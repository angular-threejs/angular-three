// const addLight = (light: Object3D, effect: SelectiveBloomEffect) => light.layers.enable(effect.selection.layer)
// const removeLight = (light: Object3D, effect: SelectiveBloomEffect) => light.layers.disable(effect.selection.layer)

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
import { injectStore, NgtArgs, NgtSelection, pick, resolveRef } from 'angular-three';
import { mergeInputs } from 'ngxtension/inject-inputs';
import { BlendFunction, BloomEffectOptions, SelectiveBloomEffect } from 'postprocessing';
import * as THREE from 'three';
import { NgtpEffectComposer } from '../effect-composer';

export type SelectiveBloomOptions = BloomEffectOptions & {
	selectionLayer: number;
	inverted: boolean;
	ignoreBackground: boolean;
};

const defaultOptions: SelectiveBloomOptions = {
	selectionLayer: 10,
	inverted: false,
	ignoreBackground: false,
};

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
	lights = input.required<THREE.Object3D[] | ElementRef<THREE.Object3D | undefined>[]>();
	selection = input<
		| THREE.Object3D
		| THREE.Object3D[]
		| ElementRef<THREE.Object3D | undefined>
		| ElementRef<THREE.Object3D | undefined>[]
	>([]);
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
	private ngtSelection = inject(NgtSelection, { optional: true });

	private resolvedLights = computed(() => this.lights().map((light) => resolveRef(light)));
	private resolvedSelected = computed(() => {
		const selection = this.selection();
		if (!selection) return [];
		const array = Array.isArray(selection) ? selection : [selection];
		return array.map((selected) => resolveRef(selected));
	});
	private resolvedNgtSelected = computed(() => {
		if (!this.ngtSelection || !this.ngtSelection.enabled) return [];
		return this.ngtSelection.selected().map((selected) => resolveRef(selected));
	});

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
			if (this.ngtSelection) return;
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
			const [selectionLayer, invalidate, effect] = [this.selectionLayer(), this.store.invalidate(), this.effect()];
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

	private addLight(effect: SelectiveBloomEffect, light: THREE.Object3D) {
		light.layers.enable(effect.selection.layer);
	}

	private removeLight(effect: SelectiveBloomEffect, light: THREE.Object3D) {
		light.layers.disable(effect.selection.layer);
	}
}
