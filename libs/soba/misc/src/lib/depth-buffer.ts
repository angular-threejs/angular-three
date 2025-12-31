import { computed, Injector } from '@angular/core';
import { beforeRender, injectStore } from 'angular-three';
import { assertInjector } from 'ngxtension/assert-injector';
import * as THREE from 'three';
import { fbo } from './fbo';

/**
 * Creates a depth buffer texture that captures scene depth information.
 *
 * Renders the scene to an off-screen FBO with a depth texture attachment,
 * which can be used for effects like soft particles, SSAO, or custom shaders.
 *
 * @param params - Signal of configuration options
 * @param params.size - Resolution of the depth buffer (default: 256, or canvas size if not specified)
 * @param params.frames - Number of frames to render (default: Infinity for continuous)
 * @param options - Optional configuration
 * @param options.injector - Custom injector for dependency injection context
 * @returns The DepthTexture from the FBO
 *
 * @example
 * ```typescript
 * // Create a depth buffer for post-processing
 * const depth = depthBuffer(() => ({ size: 512 }));
 *
 * // Use in a shader
 * effect(() => {
 *   material.uniforms['depthTexture'].value = depth;
 * });
 * ```
 */
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
 * @deprecated Use `depthBuffer` instead. Will be removed in v5.0.0.
 * @since v4.0.0
 * @see depthBuffer
 */
export const injectDepthBuffer = depthBuffer;
