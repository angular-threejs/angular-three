import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import * as THREE from 'three';
import { vi } from 'vitest';
import { injectLoader } from './loader';
import { loaderResource } from './loader-resource';

interface TestAsset {
	url: string;
	variant: string;
}

interface CacheAdapter {
	name: string;
	preload: (
		LoaderConstructor: new () => THREE.Loader<TestAsset>,
		input: unknown,
		extensions?: (loader: THREE.Loader<TestAsset>) => void,
		cacheKey?: readonly unknown[],
	) => void;
	clear: (urls: string | string[]) => void;
	destroy: () => void;
}

const cacheAdapters: CacheAdapter[] = [
	{
		name: 'loaderResource',
		preload: (LoaderConstructor, input, extensions, cacheKey) => {
			(loaderResource.preload as any)(LoaderConstructor, input, extensions, cacheKey);
		},
		clear: loaderResource.clear,
		destroy: loaderResource.destroy,
	},
	{
		name: 'injectLoader',
		preload: (LoaderConstructor, input, extensions, cacheKey) => {
			(injectLoader.preload as any)(
				() => LoaderConstructor,
				() => input,
				extensions,
				undefined,
				cacheKey ? () => cacheKey : undefined,
			);
		},
		clear: injectLoader.clear,
		destroy: injectLoader.destroy,
	},
];

function createTestLoader(failures = 0) {
	let failuresRemaining = failures;

	return class TestLoader extends THREE.Loader<TestAsset> {
		static instanceCount = 0;
		static loadCount = 0;

		variant = 'default';

		constructor() {
			super();
			TestLoader.instanceCount++;
		}

		load(
			url: string,
			onLoad?: (asset: TestAsset) => void,
			_onProgress?: (event: ProgressEvent) => void,
			onError?: (error: unknown) => void,
		) {
			TestLoader.loadCount++;
			if (failuresRemaining > 0) {
				failuresRemaining--;
				onError?.({ message: 'expected failure' });
			} else {
				onLoad?.({ url, variant: this.variant });
			}
			return this;
		}
	};
}

async function flushPromises() {
	await Promise.resolve();
	await Promise.resolve();
	await Promise.resolve();
	await Promise.resolve();
}

describe.each(cacheAdapters)('$name cache identity', (adapter) => {
	beforeEach(() => adapter.destroy());
	afterEach(() => adapter.destroy());

	it('separates the same URL loaded by different constructors', async () => {
		const FirstLoader = createTestLoader();
		const SecondLoader = createTestLoader();

		adapter.preload(FirstLoader, '/asset');
		adapter.preload(SecondLoader, '/asset');
		await flushPromises();

		expect(FirstLoader.loadCount).toBe(1);
		expect(SecondLoader.loadCount).toBe(1);
	});

	it('separates materially different extension configurations', async () => {
		const Loader = createTestLoader();

		adapter.preload(Loader, '/asset', (loader) => {
			(loader as InstanceType<typeof Loader>).variant = 'first';
		});
		adapter.preload(Loader, '/asset', (loader) => {
			(loader as InstanceType<typeof Loader>).variant = 'second';
		});
		await flushPromises();

		expect(Loader.instanceCount).toBe(2);
		expect(Loader.loadCount).toBe(2);
	});

	it('does not assume a reused extension closure still has the same captured configuration', async () => {
		const Loader = createTestLoader();
		let variant = 'first';
		const extension = (loader: THREE.Loader<TestAsset>) => {
			(loader as InstanceType<typeof Loader>).variant = variant;
		};

		adapter.preload(Loader, '/asset', extension);
		await flushPromises();
		variant = 'second';
		adapter.preload(Loader, '/asset', extension);
		await flushPromises();

		expect(Loader.instanceCount).toBe(2);
		expect(Loader.loadCount).toBe(2);
	});

	it('shares preload results across equivalent semantic configuration tuples', async () => {
		const Loader = createTestLoader();
		const firstExtension = vi.fn((loader: THREE.Loader<TestAsset>) => {
			(loader as InstanceType<typeof Loader>).variant = 'shared';
		});
		const secondExtension = vi.fn((loader: THREE.Loader<TestAsset>) => {
			(loader as InstanceType<typeof Loader>).variant = 'shared';
		});

		adapter.preload(Loader, '/asset', firstExtension, ['shared', true]);
		await flushPromises();
		adapter.preload(Loader, '/asset', secondExtension, ['shared', true]);
		await flushPromises();

		expect(Loader.instanceCount).toBe(1);
		expect(Loader.loadCount).toBe(1);
		expect(firstExtension).toHaveBeenCalledOnce();
		expect(secondExtension).not.toHaveBeenCalled();
	});

	it('evicts a rejected promise so a later request retries', async () => {
		const Loader = createTestLoader(1);

		adapter.preload(Loader, '/flaky');
		await flushPromises();
		adapter.preload(Loader, '/flaky');
		await flushPromises();

		expect(Loader.instanceCount).toBe(2);
		expect(Loader.loadCount).toBe(2);
	});

	it('clears every constructor and configuration variant for a URL', async () => {
		const FirstLoader = createTestLoader();
		const SecondLoader = createTestLoader();

		adapter.preload(FirstLoader, '/asset', undefined, ['first']);
		adapter.preload(FirstLoader, '/asset', undefined, ['second']);
		adapter.preload(SecondLoader, '/asset');
		await flushPromises();

		adapter.clear('/asset');
		adapter.preload(FirstLoader, '/asset', undefined, ['first']);
		adapter.preload(FirstLoader, '/asset', undefined, ['second']);
		adapter.preload(SecondLoader, '/asset');
		await flushPromises();

		expect(FirstLoader.loadCount).toBe(4);
		expect(SecondLoader.loadCount).toBe(2);
	});

	it('reuses and clears a multi-part loader URL tuple by value', async () => {
		const Loader = createTestLoader();
		const faces = ['/px.png', '/nx.png'];

		adapter.preload(Loader, [[...faces]]);
		await flushPromises();
		adapter.preload(Loader, [[...faces]]);
		await flushPromises();
		expect(Loader.loadCount).toBe(1);

		adapter.clear(faces);
		adapter.preload(Loader, [[...faces]]);
		await flushPromises();

		expect(Loader.loadCount).toBe(2);
	});

	it('does not retain configured loader entries for skipped empty requests', async () => {
		const Loader = createTestLoader();
		const extension = vi.fn();

		adapter.preload(Loader, '', extension);
		adapter.preload(Loader, 'undefined', extension);
		adapter.preload(Loader, 'null', extension);
		await flushPromises();
		expect(Loader.instanceCount).toBe(0);

		adapter.preload(Loader, '/asset', extension);
		await flushPromises();
		expect(Loader.instanceCount).toBe(1);
		expect(Loader.loadCount).toBe(1);
	});
});

describe('injectLoader consumer callbacks', () => {
	beforeEach(() => injectLoader.destroy());
	afterEach(() => {
		injectLoader.destroy();
		TestBed.resetTestingModule();
	});

	it('notifies every consumer even when the underlying promise is shared', async () => {
		const Loader = createTestLoader();
		const first = vi.fn();
		const second = vi.fn();
		const preload = (onLoad: (data: TestAsset) => void) =>
			(injectLoader.preload as any)(
				() => Loader,
				() => '/shared',
				undefined,
				onLoad,
				() => ['shared'],
			);

		preload(first);
		await flushPromises();
		preload(second);
		await flushPromises();

		expect(Loader.loadCount).toBe(1);
		expect(first).toHaveBeenCalledOnce();
		expect(second).toHaveBeenCalledOnce();
	});

	it('does not let a stale reactive request overwrite a newer result', async () => {
		class DeferredLoader extends THREE.Loader<TestAsset> {
			static pending = new Map<string, (asset: TestAsset) => void>();

			load(url: string, onLoad?: (asset: TestAsset) => void) {
				if (onLoad) DeferredLoader.pending.set(url, onLoad);
				return this;
			}
		}

		const url = signal('/slow');
		const onLoad = vi.fn();
		const result = TestBed.runInInjectionContext(() => injectLoader(() => DeferredLoader, url, { onLoad }));
		TestBed.flushEffects();

		url.set('/fast');
		TestBed.flushEffects();
		expect(DeferredLoader.pending.has('/fast')).toBe(true);
		DeferredLoader.pending.get('/fast')?.({ url: '/fast', variant: 'new' });
		await flushPromises();
		expect(result()).toEqual({ url: '/fast', variant: 'new' });

		DeferredLoader.pending.get('/slow')?.({ url: '/slow', variant: 'old' });
		await flushPromises();
		expect(result()).toEqual({ url: '/fast', variant: 'new' });
		expect(onLoad).toHaveBeenCalledOnce();
		expect(onLoad).toHaveBeenCalledWith({ url: '/fast', variant: 'new' });
	});
});
