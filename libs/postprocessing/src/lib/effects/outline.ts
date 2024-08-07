import {
	afterNextRender,
	ChangeDetectionStrategy,
	Component,
	computed,
	CUSTOM_ELEMENTS_SCHEMA,
	ElementRef,
	inject,
	input,
	untracked,
} from '@angular/core';
import { injectStore, NgtArgs, NgtSelection, omit, pick, resolveRef } from 'angular-three';
import { injectAutoEffect } from 'ngxtension/auto-effect';
import { mergeInputs } from 'ngxtension/inject-inputs';
import { OutlineEffect } from 'postprocessing';
import { Object3D } from 'three';
import { NgtpEffectComposer } from '../effect-composer';

export type NgtpOutlineOptions = ConstructorParameters<typeof OutlineEffect>[2] & {
	selection?: Array<Object3D | ElementRef<Object3D>>;
	selectionLayer: number;
};

const defaultOptions: NgtpOutlineOptions = {
	selectionLayer: 10,
};

@Component({
	selector: 'ngtp-outline',
	standalone: true,
	template: `
		<ngt-primitive *args="[effect()]" />
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtArgs],
})
export class NgtpOutline {
	options = input(defaultOptions, { transform: mergeInputs(defaultOptions) });

	private ngtSelection = inject(NgtSelection, { optional: true });
	private effectComposer = inject(NgtpEffectComposer);
	private store = injectStore();
	private invalidate = this.store.select('invalidate');

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
		const autoEffect = injectAutoEffect();

		afterNextRender(() => {
			autoEffect(() => {
				const effect = this.effect();
				return () => effect.dispose();
			});

			autoEffect(() => {
				const [effect, invalidate, selectionLayer] = [this.effect(), this.invalidate(), this.selectionLayer()];
				effect.selectionLayer = selectionLayer;
				invalidate();
			});

			autoEffect(() => {
				// NOTE: we run this effect if declarative NgtSelection is not enabled
				if (!this.ngtSelection) {
					// NOTE: if NgtSelection is not used and selection is not provided, we throw
					if (this.selection() === undefined) {
						throw new Error('[NGT PostProcessing]: ngtp-outline requires selection input or use NgtSelection');
					}

					return this.handleSelectionChangeEffect(this.selection, this.effect, this.invalidate);
				}

				// NOTE: we run this effect if declarative NgtSelection is enabled
				const selectionEnabled = this.ngtSelection.enabled();
				if (!selectionEnabled) return;
				return this.handleSelectionChangeEffect(this.ngtSelection.selected, this.effect, this.invalidate);
			});
		});
	}

	private handleSelectionChangeEffect(
		selected: () => Array<Object3D | ElementRef<Object3D>> | undefined,
		_effect: () => OutlineEffect,
		_invalidate: () => () => void,
	) {
		const selection = selected();
		if (!selection || selection.length === 0) return;

		const [effect, invalidate] = [_effect(), _invalidate()];

		const objects: Object3D[] = [];
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
