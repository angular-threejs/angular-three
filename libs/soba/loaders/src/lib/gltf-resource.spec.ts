import { loaderResource } from 'angular-three';
import { Group } from 'three';
import { type GLTF, GLTFLoader } from 'three-stdlib';
import { vi } from 'vitest';
import { gltfResource } from './gltf-resource';

async function flushPromises() {
	await Promise.resolve();
	await Promise.resolve();
}

describe('gltfResource cache configuration', () => {
	beforeEach(() => loaderResource.destroy());
	afterEach(() => {
		loaderResource.destroy();
		gltfResource.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.5/');
		vi.restoreAllMocks();
	});

	it('shares equivalent preloads and isolates meshopt and every Draco decoder configuration', async () => {
		const load = vi.spyOn(GLTFLoader.prototype, 'load').mockImplementation(function (_url, onLoad) {
			onLoad?.({ scene: new Group() } as GLTF);
			return this;
		});

		gltfResource.preload('/model.glb', { useDraco: false, useMeshOpt: false });
		await flushPromises();
		gltfResource.preload('/model.glb', { useDraco: false, useMeshOpt: false });
		await flushPromises();
		gltfResource.preload('/model.glb', { useDraco: false, useMeshOpt: true });
		await flushPromises();
		gltfResource.preload('/model.glb', { useDraco: true, useMeshOpt: false });
		await flushPromises();
		gltfResource.preload('/model.glb', { useDraco: true, useMeshOpt: false });
		await flushPromises();
		gltfResource.preload('/model.glb', { useDraco: '/draco-a/', useMeshOpt: false });
		await flushPromises();
		gltfResource.preload('/model.glb', { useDraco: '/draco-b/', useMeshOpt: false });
		await flushPromises();

		gltfResource.setDecoderPath('/global-draco-a/');
		gltfResource.preload('/model.glb', { useMeshOpt: false });
		await flushPromises();
		gltfResource.preload('/model.glb', { useMeshOpt: false });
		await flushPromises();
		gltfResource.setDecoderPath('/global-draco-b/');
		gltfResource.preload('/model.glb', { useMeshOpt: false });
		await flushPromises();

		expect(load).toHaveBeenCalledTimes(7);
	});
});
