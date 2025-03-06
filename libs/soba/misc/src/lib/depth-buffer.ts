import { computed, Injector } from '@angular/core';
import { injectBeforeRender, injectStore } from 'angular-three';
import { assertInjector } from 'ngxtension/assert-injector';
import * as THREE from 'three';
import { injectFBO } from './fbo';

export function injectDepthBuffer(
	params: () => { size?: number; frames?: number } = () => ({}),
	{ injector }: { injector?: Injector } = {},
) {
	return assertInjector(injectDepthBuffer, injector, () => {
		const size = computed(() => params().size || 256);
		const frames = computed(() => params().frames || Infinity);

		const store = injectStore();

		const w = computed(() => size() || store.size.width() * store.viewport.dpr());
		const h = computed(() => size() || store.size.height() * store.viewport.dpr());

		const depthConfig = computed(() => {
			const depthTexture = new THREE.DepthTexture(w(), h());
			depthTexture.format = THREE.DepthFormat;
			depthTexture.type = THREE.UnsignedShortType;
			return { depthTexture };
		});

		const depthFBO = injectFBO(() => ({ width: w(), height: h(), settings: depthConfig() }));

		let count = 0;
		injectBeforeRender(({ gl, scene, camera }) => {
			if (frames() === Infinity || count < frames()) {
				gl.setRenderTarget(depthFBO);
				gl.render(scene, camera);
				gl.setRenderTarget(null);
				count++;
			}
		});

		return depthFBO.depthTexture;
	});
}
