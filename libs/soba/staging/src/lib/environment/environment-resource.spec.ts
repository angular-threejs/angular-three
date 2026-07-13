import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HDRJPGLoader } from '@monogrid/gainmap-js';
import { loaderResource } from 'angular-three';
import { NgtTestBed } from 'angular-three/testing';
import { DataTexture } from 'three';
import { RGBELoader } from 'three-stdlib';
import { vi } from 'vitest';
import { environmentResource } from './environment-resource';

async function flushPromises() {
	await Promise.resolve();
	await Promise.resolve();
}

describe('environmentResource cache configuration', () => {
	beforeEach(() => loaderResource.destroy());
	afterEach(() => {
		loaderResource.destroy();
		vi.restoreAllMocks();
	});

	it('shares equivalent texture configuration and isolates path or color-space changes', async () => {
		const load = vi.spyOn(RGBELoader.prototype, 'load').mockImplementation(function (_url, onLoad) {
			onLoad?.(new DataTexture());
			return this;
		});

		environmentResource.preload({ files: 'studio.hdr', path: '/first/' });
		await flushPromises();
		environmentResource.preload({ files: 'studio.hdr', path: '/first/' });
		await flushPromises();
		environmentResource.preload({ files: 'studio.hdr', path: '/second/' });
		await flushPromises();
		environmentResource.preload({ files: 'studio.hdr', path: '/first/', colorSpace: 'display-p3' });
		await flushPromises();
		environmentResource.preload({ files: 'studio.hdr', path: '/first/', colorSpace: 'display-p3' });
		await flushPromises();

		expect(load).toHaveBeenCalledTimes(3);
	});

	it('replaces and destroys gainmap context-loss listeners with reactive options', () => {
		vi.spyOn(HDRJPGLoader.prototype, 'load').mockImplementation(function (_url, onLoad) {
			onLoad?.({ renderTarget: { texture: new DataTexture() } } as never);
			return this;
		});
		let addEventListener!: ReturnType<typeof vi.spyOn>;
		let removeEventListener!: ReturnType<typeof vi.spyOn>;

		@Component({ template: '' })
		class EnvironmentProbe {
			options = signal({ files: 'first.jpg' });
			resource = environmentResource(this.options);
		}

		const { fixture, sceneGraphComponentRef } = NgtTestBed.create(EnvironmentProbe, {
			mockCanvasOptions: {
				beforeReturn: (canvas) => {
					addEventListener = vi.spyOn(canvas, 'addEventListener');
					removeEventListener = vi.spyOn(canvas, 'removeEventListener');
				},
			},
		});
		const contextLostAdds = () =>
			addEventListener.mock.calls.filter(
				([type, , options]) =>
					type === 'webglcontextlost' &&
					typeof options === 'object' &&
					options !== null &&
					options.once === true,
			);
		const contextLostRemovals = () => {
			const ownedListeners = new Set(contextLostAdds().map(([, listener]) => listener));
			return removeEventListener.mock.calls.filter(
				([type, listener]) => type === 'webglcontextlost' && ownedListeners.has(listener),
			);
		};
		const initialAdds = contextLostAdds().length;
		const initialRemovals = contextLostRemovals().length;

		sceneGraphComponentRef.instance.options.set({ files: 'second.jpg' });
		TestBed.flushEffects();
		expect(contextLostAdds().length).toBeGreaterThan(initialAdds);
		expect(contextLostRemovals().length).toBeGreaterThan(initialRemovals);
		const replacementRemovals = contextLostRemovals().slice(initialRemovals);
		for (const [, callback] of replacementRemovals) {
			expect(contextLostAdds().some(([, addedCallback]) => addedCallback === callback)).toBe(true);
		}

		const removalsBeforeDestroy = contextLostRemovals().length;
		fixture.destroy();
		expect(contextLostRemovals().length).toBeGreaterThan(removalsBeforeDestroy);
	});
});
