import {
	ChangeDetectionStrategy,
	Component,
	computed,
	CUSTOM_ELEMENTS_SCHEMA,
	effect,
	ElementRef,
	inject,
	input,
} from '@angular/core';
import { injectStore, NgtArgs, NgtSelectionApi, pick, resolveRef } from 'angular-three';
import { mergeInputs } from 'ngxtension/inject-inputs';
import { BlendFunction, BloomEffectOptions, SelectiveBloomEffect } from 'postprocessing';
import * as THREE from 'three';
import { NgtpEffectComposer } from '../effect-composer';

/**
 * Configuration options for the selective bloom effect.
 * Extends BloomEffectOptions with selection control properties.
 */
export type SelectiveBloomOptions = BloomEffectOptions & {
	/**
	 * The layer used for selection rendering.
	 * @default 10
	 */
	selectionLayer: number;

	/**
	 * Whether to invert the selection (bloom everything except selected).
	 * @default false
	 */
	inverted: boolean;

	/**
	 * Whether to ignore the background in the bloom effect.
	 * @default false
	 */
	ignoreBackground: boolean;
};

const defaultOptions: SelectiveBloomOptions = {
	selectionLayer: 10,
	inverted: false,
	ignoreBackground: false,
};

/**
 * Angular component that applies bloom only to selected objects.
 *
 * Unlike the standard bloom effect, selective bloom allows you to specify
 * which objects should glow. Requires light sources to be provided for
 * proper rendering.
 *
 * Can be used with NgtSelectionApi for declarative selection or with
 * manual selection via the selection input.
 *
 * @example
 * ```html
 * <ngtp-effect-composer>
 *   <ngtp-selective-bloom
 *     [lights]="[ambientLightRef, pointLightRef]"
 *     [selection]="[glowingMeshRef]"
 *     [options]="{ intensity: 2, luminanceThreshold: 0 }"
 *   />
 * </ngtp-effect-composer>
 * ```
 */
@Component({
	selector: 'ngtp-selective-bloom',
	template: `
		<ngt-primitive *args="[effect()]" [dispose]="null" />
	`,
	imports: [NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgtpSelectiveBloom {
	/**
	 * Light sources that should be included in the bloom calculation.
	 * Required for proper selective bloom rendering.
	 */
	lights = input.required<THREE.Object3D[] | ElementRef<THREE.Object3D | undefined>[]>();

	/**
	 * Objects to apply bloom to.
	 * Can be a single object, array of objects, or ElementRefs.
	 * Not needed if using NgtSelectionApi.
	 * @default []
	 */
	selection = input<
		| THREE.Object3D
		| THREE.Object3D[]
		| ElementRef<THREE.Object3D | undefined>
		| ElementRef<THREE.Object3D | undefined>[]
	>([]);

	/**
	 * Configuration options for the selective bloom effect.
	 * @see SelectiveBloomOptions
	 */
	options = input(defaultOptions, { transform: mergeInputs(defaultOptions) });

	private blendFunction = pick(this.options, 'blendFunction');
	private luminanceThreshold = pick(this.options, 'luminanceThreshold');
	private luminanceSmoothing = pick(this.options, 'luminanceSmoothing');
	private mipmapBlur = pick(this.options, 'mipmapBlur');
	private intensity = pick(this.options, 'intensity');
	private radius = pick(this.options, 'radius');
	private levels = pick(this.options, 'levels');
	private kernelSize = pick(this.options, 'kernelSize');
	private resolutionScale = pick(this.options, 'resolutionScale');
	private width = pick(this.options, 'width');
	private height = pick(this.options, 'height');
	private resolutionX = pick(this.options, 'resolutionX');
	private resolutionY = pick(this.options, 'resolutionY');
	private inverted = pick(this.options, 'inverted');
	private ignoreBackground = pick(this.options, 'ignoreBackground');
	private selectionLayer = pick(this.options, 'selectionLayer');

	private store = injectStore();
	private effectComposer = inject(NgtpEffectComposer);
	private selectionApi = inject(NgtSelectionApi, { optional: true });

	private resolvedLights = computed(() => this.lights().map((light) => resolveRef(light)));
	private resolvedSelected = computed(() => {
		const selection = this.selection();
		if (!selection) return [];
		const array = Array.isArray(selection) ? selection : [selection];
		return array.map((selected) => resolveRef(selected));
	});
	private resolvedNgtSelected = computed(() => {
		if (!this.selectionApi || !this.selectionApi.enabled) return [];
		return this.selectionApi.selected().map((selected) => resolveRef(selected));
	});

	/**
	 * The underlying SelectiveBloomEffect instance.
	 * Created with the scene, camera, and configured options.
	 */
	protected effect = computed(() => {
		const effect = new SelectiveBloomEffect(this.effectComposer.scene(), this.effectComposer.camera(), {
			blendFunction: this.blendFunction() || BlendFunction.ADD,
			luminanceThreshold: this.luminanceThreshold(),
			luminanceSmoothing: this.luminanceSmoothing(),
			mipmapBlur: this.mipmapBlur(),
			intensity: this.intensity(),
			radius: this.radius(),
			levels: this.levels(),
			kernelSize: this.kernelSize(),
			resolutionScale: this.resolutionScale(),
			width: this.width(),
			height: this.height(),
			resolutionX: this.resolutionX(),
			resolutionY: this.resolutionY(),
		});

		effect.inverted = this.inverted();
		effect.ignoreBackground = this.ignoreBackground();

		return effect;
	});

	constructor() {
		effect((onCleanup) => {
			// skip input selection altogether if NgtSelection is used
			if (this.selectionApi) return;
			const selection = this.resolvedSelected();
			if (!selection.length) return;

			const [effect, invalidate] = [this.effect(), this.store.invalidate(), this.selectionLayer()];
			effect.selection.set(selection as THREE.Object3D[]);
			invalidate();

			onCleanup(() => {
				effect.selection.clear();
				invalidate();
			});
		});

		effect(() => {
			const [selectionLayer, invalidate, effect] = [
				this.selectionLayer(),
				this.store.invalidate(),
				this.effect(),
			];
			effect.selection.layer = selectionLayer;
			invalidate();
		});

		effect((onCleanup) => {
			const lights = this.resolvedLights();
			if (lights.length <= 0) return;

			const [effect, invalidate] = [this.effect(), this.store.invalidate(), this.selectionLayer()];

			lights.forEach((light) => light && this.addLight(effect, light));
			invalidate();

			onCleanup(() => {
				lights.forEach((light) => light && this.removeLight(effect, light));
				invalidate();
			});
		});

		effect((onCleanup) => {
			const selected = this.resolvedNgtSelected();
			if (!selected.length) return;

			const [effect, invalidate] = [this.effect(), this.store.invalidate(), this.selectionLayer()];
			effect.selection.set(selected as THREE.Object3D[]);
			invalidate();

			onCleanup(() => {
				effect.selection.clear();
				invalidate();
			});
		});
	}

	/**
	 * Enables the selection layer on a light source.
	 *
	 * @param effect - The SelectiveBloomEffect instance
	 * @param light - The light to enable on the selection layer
	 */
	private addLight(effect: SelectiveBloomEffect, light: THREE.Object3D) {
		light.layers.enable(effect.selection.layer);
	}

	/**
	 * Disables the selection layer on a light source.
	 *
	 * @param effect - The SelectiveBloomEffect instance
	 * @param light - The light to disable from the selection layer
	 */
	private removeLight(effect: SelectiveBloomEffect, light: THREE.Object3D) {
		light.layers.disable(effect.selection.layer);
	}
}
