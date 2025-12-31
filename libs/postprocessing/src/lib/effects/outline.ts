import {
	ChangeDetectionStrategy,
	Component,
	computed,
	CUSTOM_ELEMENTS_SCHEMA,
	effect,
	ElementRef,
	inject,
	input,
	untracked,
} from '@angular/core';
import { injectStore, NgtArgs, NgtSelectionApi, omit, pick, resolveRef } from 'angular-three';
import { mergeInputs } from 'ngxtension/inject-inputs';
import { OutlineEffect } from 'postprocessing';
import * as THREE from 'three';
import { NgtpEffectComposer } from '../effect-composer';

/**
 * Configuration options for the outline effect.
 * Extends OutlineEffect options with selection management.
 */
export type NgtpOutlineOptions = ConstructorParameters<typeof OutlineEffect>[2] & {
	/**
	 * Array of objects to outline.
	 * Can be Object3D instances or ElementRefs.
	 * Not needed if using NgtSelectionApi.
	 */
	selection?: Array<THREE.Object3D | ElementRef<THREE.Object3D>>;

	/**
	 * The layer used for selection rendering.
	 * @default 10
	 */
	selectionLayer: number;
};

const defaultOptions: NgtpOutlineOptions = {
	selectionLayer: 10,
};

/**
 * Angular component that applies an outline effect to selected objects.
 *
 * This effect draws an outline around specified objects in the scene.
 * Can be used with NgtSelectionApi for declarative selection or with
 * manual selection via the options input.
 *
 * @example
 * ```html
 * <!-- With NgtSelectionApi (recommended) -->
 * <ngt-group [select]="hovered()" (pointerenter)="hovered.set(true)">
 *   <ngt-mesh>...</ngt-mesh>
 * </ngt-group>
 *
 * <ngtp-effect-composer>
 *   <ngtp-outline [options]="{ edgeStrength: 2.5, blur: true }" />
 * </ngtp-effect-composer>
 * ```
 *
 * @example
 * ```html
 * <!-- With manual selection -->
 * <ngtp-effect-composer>
 *   <ngtp-outline [options]="{ selection: [meshRef.nativeElement], edgeStrength: 5 }" />
 * </ngtp-effect-composer>
 * ```
 */
@Component({
	selector: 'ngtp-outline',
	template: `
		<ngt-primitive *args="[effect()]" />
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtArgs],
})
export class NgtpOutline {
	/**
	 * Configuration options for the outline effect.
	 * @see NgtpOutlineOptions
	 */
	options = input(defaultOptions, { transform: mergeInputs(defaultOptions) });

	private selectionApi = inject(NgtSelectionApi, { optional: true });
	private effectComposer = inject(NgtpEffectComposer);
	private store = injectStore();

	private selection = pick(this.options, 'selection');
	private selectionLayer = pick(this.options, 'selectionLayer');

	private blendFunction = pick(this.options, 'blendFunction');
	private patternTexture = pick(this.options, 'patternTexture');
	private edgeStrength = pick(this.options, 'edgeStrength');
	private pulseSpeed = pick(this.options, 'pulseSpeed');
	private visibleEdgeColor = pick(this.options, 'visibleEdgeColor');
	private hiddenEdgeColor = pick(this.options, 'hiddenEdgeColor');
	private width = pick(this.options, 'width');
	private height = pick(this.options, 'height');
	private kernelSize = pick(this.options, 'kernelSize');
	private blur = pick(this.options, 'blur');
	private xRay = pick(this.options, 'xRay');
	private restOptions = omit(this.options, [
		'blendFunction',
		'patternTexture',
		'edgeStrength',
		'pulseSpeed',
		'visibleEdgeColor',
		'hiddenEdgeColor',
		'width',
		'height',
		'kernelSize',
		'blur',
		'xRay',
	]);

	/**
	 * The underlying OutlineEffect instance.
	 * Created with the scene, camera, and configured options.
	 */
	effect = computed(() => {
		const [
			scene,
			camera,
			blendFunction,
			patternTexture,
			edgeStrength,
			pulseSpeed,
			visibleEdgeColor,
			hiddenEdgeColor,
			width,
			height,
			kernelSize,
			blur,
			xRay,
			restOptions,
		] = [
			this.effectComposer.scene(),
			this.effectComposer.camera(),
			this.blendFunction(),
			this.patternTexture(),
			this.edgeStrength(),
			this.pulseSpeed(),
			this.visibleEdgeColor(),
			this.hiddenEdgeColor(),
			this.width(),
			this.height(),
			this.kernelSize(),
			this.blur(),
			this.xRay(),
			untracked(this.restOptions),
		];

		return new OutlineEffect(scene, camera, {
			blendFunction,
			patternTexture,
			edgeStrength,
			pulseSpeed,
			visibleEdgeColor,
			hiddenEdgeColor,
			width,
			height,
			kernelSize,
			blur,
			xRay,
			...restOptions,
		});
	});

	constructor() {
		effect((onCleanup) => {
			const effect = this.effect();
			onCleanup(() => effect.dispose());
		});

		effect(() => {
			const [effect, invalidate, selectionLayer] = [
				this.effect(),
				this.store.invalidate(),
				this.selectionLayer(),
			];
			effect.selectionLayer = selectionLayer;
			invalidate();
		});

		effect((onCleanup) => {
			// NOTE: we run this effect if declarative NgtSelection is not enabled
			if (!this.selectionApi) {
				// NOTE: if NgtSelection is not used and selection is not provided, we throw
				if (this.selection() === undefined) {
					throw new Error('[NGT PostProcessing]: ngtp-outline requires selection input or use NgtSelection');
				}
				const cleanup = this.handleSelectionChangeEffect(this.selection, this.effect, this.store.invalidate);

				onCleanup(() => {
					cleanup?.();
				});
				return;
			}

			// NOTE: we run this effect if declarative NgtSelection is enabled
			const selectionEnabled = this.selectionApi.enabled();
			if (!selectionEnabled) return;
			const cleanup = this.handleSelectionChangeEffect(
				this.selectionApi.selected,
				this.effect,
				this.store.invalidate,
			);
			onCleanup(() => {
				cleanup?.();
			});
		});
	}

	/**
	 * Handles changes to the selection and updates the outline effect.
	 *
	 * @param selected - Function returning the currently selected objects
	 * @param _effect - Function returning the OutlineEffect instance
	 * @param _invalidate - Function returning the invalidate callback
	 * @returns Cleanup function to clear the selection
	 */
	private handleSelectionChangeEffect(
		selected: () => Array<THREE.Object3D | ElementRef<THREE.Object3D>> | undefined,
		_effect: () => OutlineEffect,
		_invalidate: () => () => void,
	) {
		const selection = selected();
		if (!selection || selection.length === 0) return;

		const [effect, invalidate] = [_effect(), _invalidate()];

		const objects: THREE.Object3D[] = [];
		for (const el of selection) {
			const obj = resolveRef(el);
			if (!obj) continue;
			objects.push(obj);
		}

		if (objects.length === 0) return;

		effect.selection.set(objects);
		invalidate();

		return () => {
			effect.selection.clear();
			invalidate();
		};
	}
}
