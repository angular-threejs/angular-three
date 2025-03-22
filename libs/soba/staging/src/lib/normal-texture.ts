import {
	DestroyRef,
	Directive,
	EmbeddedViewRef,
	Injector,
	ResourceRef,
	TemplateRef,
	ViewContainerRef,
	computed,
	effect,
	inject,
	input,
	signal,
} from '@angular/core';
import { injectTexture, textureResource } from 'angular-three-soba/loaders';
import { assertInjector } from 'ngxtension/assert-injector';
import * as THREE from 'three';

const NORMAL_ROOT = 'https://rawcdn.githack.com/pmndrs/drei-assets/7a3104997e1576f83472829815b00880d88b32fb';
const LIST_URL = 'https://cdn.jsdelivr.net/gh/pmndrs/drei-assets@master/normals/normals.json';

interface NgtsNormalTextureSettings {
	repeat?: number[];
	anisotropy?: number;
	offset?: number[];
}

/**
 * @deprecated Use normalTexture instead. Will be removed in v5.0.0
 * @since v4.0.0
 */
export function injectNormalTexture(
	id: () => string | number = () => 0,
	{
		settings = () => ({}),
		onLoad,
		injector,
	}: { settings?: () => NgtsNormalTextureSettings; onLoad?: (texture: THREE.Texture[]) => void; injector?: Injector },
) {
	return assertInjector(injectNormalTexture, injector, () => {
		const normalList = signal<Record<string, string>>({});

		fetch(LIST_URL)
			.then((res) => res.json())
			.then((list) => {
				normalList.set(list);
			});

		const DEFAULT_NORMAL = computed(() => normalList()[0]);
		const numTot = computed(() => Object.keys(normalList()).length);

		const fileHash = computed(() => {
			const idValue = id();
			if (typeof idValue === 'string') {
				return idValue;
			}

			if (typeof idValue === 'number') {
				return normalList()[idValue];
			}

			return null;
		});

		const imageName = computed(() => fileHash() || DEFAULT_NORMAL());
		const url = computed(() => `${NORMAL_ROOT}/normals/${imageName()}`);

		const normalTexture = injectTexture(url, { onLoad });

		effect(() => {
			const texture = normalTexture();
			if (!texture) return;

			const { anisotropy = 1, repeat = [1, 1], offset = [0, 0] } = settings();
			texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
			texture.repeat = new THREE.Vector2(repeat[0], repeat[1]);
			texture.offset = new THREE.Vector2(offset[0], offset[1]);
			texture.anisotropy = anisotropy;
		});

		return { url, texture: normalTexture, numTot };
	});
}

export function normalTextureResource(
	id: () => string | number = () => 0,
	{
		settings = () => ({}),
		onLoad,
		injector,
	}: { settings?: () => NgtsNormalTextureSettings; onLoad?: (texture: THREE.Texture) => void; injector?: Injector },
) {
	return assertInjector(normalTextureResource, injector, () => {
		const normalList = signal<Record<string, string>>({});

		fetch(LIST_URL)
			.then((res) => res.json())
			.then((list) => {
				normalList.set(list);
			});

		const DEFAULT_NORMAL = computed(() => normalList()[0]);
		const numTot = computed(() => Object.keys(normalList()).length);

		const fileHash = computed(() => {
			const idValue = id();
			if (typeof idValue === 'string') {
				return idValue;
			}

			if (typeof idValue === 'number') {
				return normalList()[idValue];
			}

			return null;
		});

		const imageName = computed(() => fileHash() || DEFAULT_NORMAL());
		const url = computed(() => `${NORMAL_ROOT}/normals/${imageName()}`);

		const resource = textureResource(url, { onLoad });

		effect(() => {
			if (!resource.hasValue()) return;

			const texture = resource.value();
			const { anisotropy = 1, repeat = [1, 1], offset = [0, 0] } = settings();

			texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
			texture.repeat = new THREE.Vector2(repeat[0], repeat[1]);
			texture.offset = new THREE.Vector2(offset[0], offset[1]);
			texture.anisotropy = anisotropy;
		});

		return { url, resource, numTot };
	});
}

export interface NgtsNormalTextureOptions extends NgtsNormalTextureSettings {
	id?: number | string;
}

@Directive({ selector: 'ng-template[normalTexture]' })
export class NgtsNormalTexture {
	normalTexture = input<NgtsNormalTextureOptions>();
	normalTextureLoaded = input<(texture: THREE.Texture) => void>();

	private template = inject(TemplateRef);
	private vcr = inject(ViewContainerRef);

	private id = computed(() => this.normalTexture()?.id ?? 0);
	private settings = computed(() => {
		const { id: _, ...settings } = this.normalTexture() || {};
		return settings;
	});

	private ref?: EmbeddedViewRef<{ $implicit: ResourceRef<THREE.Texture | undefined> }>;

	constructor() {
		const { resource } = normalTextureResource(this.id, {
			settings: this.settings,
			onLoad: this.normalTextureLoaded(),
		});

		effect(() => {
			this.ref = this.vcr.createEmbeddedView(this.template, { $implicit: resource });
			this.ref.detectChanges();
		});

		inject(DestroyRef).onDestroy(() => {
			this.ref?.destroy();
		});
	}

	static ngTemplateContextGuard(
		_: NgtsNormalTexture,
		ctx: unknown,
	): ctx is { $implicit: ResourceRef<THREE.Texture | undefined> } {
		return true;
	}
}
