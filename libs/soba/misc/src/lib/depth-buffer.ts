import { computed, Injector } from '@angular/core';
import { injectBeforeRender, injectStore, pick } from 'angular-three';
import { assertInjector } from 'ngxtension/assert-injector';
import { DepthFormat, DepthTexture, UnsignedShortType } from 'three';
import { injectFBO } from './fbo';

export function injectDepthBuffer(
	params: () => { size?: number; frames?: number } = () => ({}),
	{ injector }: { injector?: Injector } = {},
) {
	return assertInjector(injectDepthBuffer, injector, () => {
		const size = computed(() => params().size || 256);
		const frames = computed(() => params().frames || Infinity);

		const store = injectStore();
		const width = store.select('size', 'width');
		const height = store.select('size', 'height');
		const dpr = store.select('viewport', 'dpr');

		const w = computed(() => size() || width() * dpr());
		const h = computed(() => size() || height() * dpr());

		const depthConfig = computed(() => {
			const depthTexture = new DepthTexture(w(), h());
			depthTexture.format = DepthFormat;
			depthTexture.type = UnsignedShortType;
			return { depthTexture };
		});

		const depthFBO = injectFBO(() => ({
			width: w(),
			height: h(),
			settings: depthConfig(),
		}));

		let count = 0;
		injectBeforeRender(({ gl, scene, camera }) => {
			if (frames() === Infinity || count < frames()) {
				gl.setRenderTarget(depthFBO());
				gl.render(scene, camera);
				gl.setRenderTarget(null);
				count++;
			}
		});

		return pick(depthFBO, 'depthTexture');
	});
}
