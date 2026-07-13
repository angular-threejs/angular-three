import * as THREE from 'three';

type LoaderConstructor<TLoader extends THREE.Loader = THREE.Loader> = new (...args: any[]) => TLoader;
type AnyLoaderConstructor = LoaderConstructor<any>;

interface LoaderCacheEntry<TLoader extends THREE.Loader = THREE.Loader, TData = unknown> {
	loader: TLoader;
	promises: Map<unknown, Promise<TData>>;
}

const defaultConfigurationKey = Symbol('ngt-default-loader-configuration');

/**
 * Interns semantic tuples component-by-component so equivalent configuration
 * and multi-part URL tuples share an identity without retaining object parts.
 */
class SemanticKeyRegistry {
	private root = new SemanticKeyNode();

	resolve(key: unknown): unknown {
		if (!Array.isArray(key)) return key;

		let node = this.root;

		for (const part of key) {
			node = node.child(part);
		}

		return (node.value ??= {});
	}

	clear() {
		this.root = new SemanticKeyNode();
	}
}

class SemanticKeyNode {
	value?: object;
	private primitiveChildren = new Map<unknown, SemanticKeyNode>();
	private objectChildren = new WeakMap<object, SemanticKeyNode>();

	child(part: unknown) {
		if ((typeof part === 'object' && part !== null) || typeof part === 'function') {
			let child = this.objectChildren.get(part);
			if (!child) {
				child = new SemanticKeyNode();
				this.objectChildren.set(part, child);
			}
			return child;
		}

		let child = this.primitiveChildren.get(part);
		if (!child) {
			child = new SemanticKeyNode();
			this.primitiveChildren.set(part, child);
		}
		return child;
	}
}

/**
 * Owns configured loader instances and their result promises. Constructor,
 * configuration, and URL are deliberately separate cache dimensions.
 */
export class NgtLoaderCache {
	private constructors = new Map<AnyLoaderConstructor, Map<unknown, LoaderCacheEntry<any, any>>>();
	private configurationKeys = new SemanticKeyRegistry();
	private requestKeys = new SemanticKeyRegistry();

	configurationKey(extensions: ((loader: THREE.Loader<unknown>) => void) | undefined, key?: readonly unknown[]) {
		if (key !== undefined) return this.configurationKeys.resolve(key);
		return extensions ? {} : defaultConfigurationKey;
	}

	getOrCreate<TLoader extends THREE.Loader, TData>(
		LoaderConstructor: LoaderConstructor<TLoader>,
		configurationKey: unknown,
		request: unknown,
		extensions: ((loader: TLoader) => void) | undefined,
		load: (loader: TLoader) => Promise<TData>,
	): Promise<TData> {
		const normalizedConfigurationKey = this.configurationKeys.resolve(configurationKey);
		const requestKey = this.requestKeys.resolve(request);
		const entry = this.getEntry<TLoader, TData>(LoaderConstructor, normalizedConfigurationKey, extensions);

		const cachedPromise = entry.promises.get(requestKey);
		if (cachedPromise) return cachedPromise;

		let promise: Promise<TData>;
		promise = load(entry.loader).catch((error: unknown) => {
			this.evict(LoaderConstructor, normalizedConfigurationKey, entry, requestKey, promise);
			throw error;
		});
		entry.promises.set(requestKey, promise);

		return promise;
	}

	clear(urls: string | string[]) {
		const requestsToClear = Array.isArray(urls)
			? [this.requestKeys.resolve(urls), ...urls.map((url) => this.requestKeys.resolve(url))]
			: [this.requestKeys.resolve(urls)];

		for (const [LoaderConstructor, configurations] of this.constructors) {
			for (const [configurationKey, entry] of configurations) {
				for (const requestKey of requestsToClear) entry.promises.delete(requestKey);
				if (entry.promises.size === 0) configurations.delete(configurationKey);
			}

			if (configurations.size === 0) this.constructors.delete(LoaderConstructor);
		}
	}

	destroy() {
		this.constructors.clear();
		this.configurationKeys.clear();
		this.requestKeys.clear();
	}

	private getConfigurations<TLoader extends THREE.Loader>(LoaderConstructor: LoaderConstructor<TLoader>) {
		let configurations = this.constructors.get(LoaderConstructor);
		if (!configurations) {
			configurations = new Map();
			this.constructors.set(LoaderConstructor, configurations);
		}
		return configurations;
	}

	private getEntry<TLoader extends THREE.Loader, TData>(
		LoaderConstructor: LoaderConstructor<TLoader>,
		configurationKey: unknown,
		extensions: ((loader: TLoader) => void) | undefined,
	) {
		const configurations = this.getConfigurations(LoaderConstructor);
		let entry = configurations.get(configurationKey) as LoaderCacheEntry<TLoader, TData> | undefined;
		if (entry) return entry;

		const loader = new LoaderConstructor();
		extensions?.(loader);
		entry = { loader, promises: new Map() };
		configurations.set(configurationKey, entry);
		return entry;
	}

	private evict<TLoader extends THREE.Loader, TData>(
		LoaderConstructor: LoaderConstructor<TLoader>,
		configurationKey: unknown,
		entry: LoaderCacheEntry<TLoader, TData>,
		requestKey: unknown,
		promise: Promise<TData>,
	) {
		if (entry.promises.get(requestKey) !== promise) return;

		entry.promises.delete(requestKey);
		if (entry.promises.size > 0) return;

		const configurations = this.constructors.get(LoaderConstructor);
		if (configurations?.get(configurationKey) !== entry) return;

		configurations.delete(configurationKey);
		if (configurations.size === 0) this.constructors.delete(LoaderConstructor);
	}
}
