import { effect, Injector } from '@angular/core';
import { injectStore, is, loaderResource, NgtLoaderResults } from 'angular-three';
import { assertInjector } from 'ngxtension/assert-injector';
import * as THREE from 'three';

export function textureResource<TUrl extends string[] | string | Record<string, string>>(
	input: () => TUrl,
	{
		onLoad,
		injector,
	}: { onLoad?: (result: NgtLoaderResults<TUrl, THREE.Texture>) => void; injector?: Injector } = {},
) {
	return assertInjector(textureResource, injector, () => {
		const store = injectStore();
		const resource = loaderResource(() => THREE.TextureLoader, input);

		effect(() => {
			if (!resource.hasValue()) return;
			const result = resource.value();

			if (onLoad) onLoad(result);

			const gl = store.snapshot.gl;
			if ('initTexture' in gl) {
				let textures: THREE.Texture[];

				if (Array.isArray(result)) {
					textures = result;
				} else if (is.three<THREE.Texture>(result, 'isTexture')) {
					textures = [result];
				} else {
					textures = Object.values(result);
				}

				textures.forEach(gl.initTexture.bind(gl));
			}
		});

		return resource;
	});
}

textureResource.preload = <TUrl extends string[] | string | Record<string, string>>(input: TUrl) => {
	loaderResource.preload(THREE.TextureLoader, input);
};
