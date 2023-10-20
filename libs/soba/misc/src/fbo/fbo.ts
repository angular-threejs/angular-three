import {
	ChangeDetectorRef,
	DestroyRef,
	computed,
	effect,
	inject,
	signal,
	untracked,
	type Injector,
} from '@angular/core';
import { injectNgtStore, safeDetectChanges } from 'angular-three';
import { assertInjector } from 'ngxtension/assert-injector';
import * as THREE from 'three';

interface FBOSettings extends THREE.WebGLRenderTargetOptions {
	/** Defines the count of MSAA samples. Can only be used with WebGL 2. Default: 0 */
	samples?: number;
	/** If set, the scene depth will be rendered into buffer.depthTexture. Default: false */
	depth?: boolean;
}

export interface NgtsFBOParams {
	width?: number | FBOSettings;
	height?: number;
	settings?: FBOSettings;
}

export function injectNgtsFBO(fboParams: () => NgtsFBOParams, { injector }: { injector?: Injector } = {}) {
	return assertInjector(injectNgtsFBO, injector, () => {
		const store = injectNgtStore();
		const cdr = inject(ChangeDetectorRef);

		const targetSignal = signal<THREE.WebGLRenderTarget | null>(null);

		inject(DestroyRef).onDestroy(() => targetSignal()?.dispose());

		const [defaultWidth, defaultHeight, dpr] = [
			store.select('size', 'width'),
			store.select('size', 'height'),
			store.select('viewport', 'dpr'),
		];
		const fboSettings = computed(() => {
			const { width, height, settings } = fboParams();
			return [
				typeof width === 'number' ? width : defaultWidth() * dpr(),
				typeof height === 'number' ? height : defaultHeight() * dpr(),
				(typeof width === 'number' ? settings : (width as FBOSettings)) || {},
			] as const;
		});

		effect(() => {
			const [width, height, { samples = 0, depth, ...settings }] = fboSettings();
			let untrackedTarget = untracked(targetSignal);
			if (!untrackedTarget) {
				const target = new THREE.WebGLRenderTarget(width, height, {
					minFilter: THREE.LinearFilter,
					magFilter: THREE.LinearFilter,
					type: THREE.HalfFloatType,
					...settings,
				});
				if (depth) target.depthTexture = new THREE.DepthTexture(width, height, THREE.FloatType);

				target.samples = samples;
				untracked(() => {
					targetSignal.set(target);
				});
				untrackedTarget = untracked(targetSignal);
			}

			if (untrackedTarget) {
				untrackedTarget.setSize(width, height);
				if (samples) untrackedTarget.samples = samples;
				safeDetectChanges(cdr);
			}
		});

		return targetSignal.asReadonly();
	});
}
