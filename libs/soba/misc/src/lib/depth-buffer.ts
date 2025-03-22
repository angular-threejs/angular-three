import { computed, Injector } from '@angular/core';
import { beforeRender, injectStore } from 'angular-three';
import { assertInjector } from 'ngxtension/assert-injector';
import * as THREE from 'three';
import { fbo } from './fbo';

export function depthBuffer(
	params: () => { size?: number; frames?: number } = () => ({}),
	{ injector }: { injector?: Injector } = {},
) {
	return assertInjector(depthBuffer, injector, () => {
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

		const depthFBO = fbo(() => ({ width: w(), height: h(), settings: depthConfig() }));

		let count = 0;
		beforeRender(({ gl, scene, camera }) => {
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

/**
 * @deprecated use depthBuffer instead. Will be removed in v5.0.0
 * @since v4.0.0
 */
export const injectDepthBuffer = depthBuffer;
