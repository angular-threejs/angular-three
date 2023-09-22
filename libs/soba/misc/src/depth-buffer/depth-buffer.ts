import {
	ChangeDetectorRef,
	computed,
	effect,
	inject,
	runInInjectionContext,
	signal,
	untracked,
	type Injector,
} from '@angular/core';
import { injectBeforeRender, injectNgtStore, safeDetectChanges } from 'angular-three';
import { assertInjector } from 'ngxtension/assert-injector';
import * as THREE from 'three';
import { injectNgtsFBO } from '../fbo/fbo';

export interface NgtsDepthBufferParams {
	size: number;
	frames: number;
}

export function injectNgtsDepthBuffer(
	paramsFactory: () => Partial<NgtsDepthBufferParams> = () => ({}),
	{ injector }: { injector?: Injector } = {},
) {
	injector = assertInjector(injectNgtsDepthBuffer, injector);
	return runInInjectionContext(injector, () => {
		const depthBufferSignal = signal<THREE.DepthTexture | null>(null);
		const store = injectNgtStore();
		const cdr = inject(ChangeDetectorRef);

		const [defaultWidth, defaultHeight, dpr] = [
			store.select('size', 'width'),
			store.select('size', 'height'),
			store.select('viewport', 'dpr'),
		];

		const fboParams = computed(() => {
			const params = { size: 256, frames: Infinity, ...paramsFactory() };
			const width = params.size || defaultWidth() * dpr();
			const height = params.size || defaultHeight() * dpr();
			const depthTexture = new THREE.DepthTexture(width, height);
			depthTexture.format = THREE.DepthFormat;
			depthTexture.type = THREE.UnsignedShortType;
			return { width, height, settings: { depthTexture } };
		});

		const _fbo = injectNgtsFBO(fboParams, { injector });

		effect(() => {
			const fbo = _fbo();
			if (fbo) {
				untracked(() => {
					depthBufferSignal.set(fbo.depthTexture);
				});
				safeDetectChanges(cdr);
			}
		});

		let count = 0;
		injectBeforeRender(
			({ gl, scene, camera }) => {
				const params = { size: 256, frames: Infinity, ...paramsFactory() };
				const fbo = _fbo();
				if ((params.frames === Infinity || count < params.frames) && fbo) {
					gl.setRenderTarget(fbo);
					gl.render(scene, camera);
					gl.setRenderTarget(null);
					count++;
				}
			},
			{ injector },
		);

		return depthBufferSignal.asReadonly();
	});
}
