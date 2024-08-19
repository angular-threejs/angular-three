import {
	DestroyRef,
	Directive,
	EmbeddedViewRef,
	Injector,
	Signal,
	TemplateRef,
	ViewContainerRef,
	afterNextRender,
	computed,
	effect,
	inject,
	input,
	output,
	signal,
	untracked,
} from '@angular/core';
import { injectTexture } from 'angular-three-soba/loaders';
import { assertInjector } from 'ngxtension/assert-injector';
import { RepeatWrapping, Texture, Vector2 } from 'three';

const NORMAL_ROOT = 'https://rawcdn.githack.com/pmndrs/drei-assets/7a3104997e1576f83472829815b00880d88b32fb';
const LIST_URL = 'https://cdn.jsdelivr.net/gh/pmndrs/drei-assets@master/normals/normals.json';

interface NgtsNormalTextureSettings {
	repeat?: number[];
	anisotropy?: number;
	offset?: number[];
}

export function injectNormalTexture(
	id: () => string | number = () => 0,
	{
		settings = () => ({}),
		onLoad,
		injector,
	}: { settings?: () => NgtsNormalTextureSettings; onLoad?: (texture: Texture[]) => void; injector?: Injector },
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
			texture.wrapS = texture.wrapT = RepeatWrapping;
			texture.repeat = new Vector2(repeat[0], repeat[1]);
			texture.offset = new Vector2(offset[0], offset[1]);
			texture.anisotropy = anisotropy;
		});

		return { url, texture: normalTexture, numTot };
	});
}

export interface NgtsNormalTextureOptions extends NgtsNormalTextureSettings {
	id?: number | string;
}

@Directive({ selector: 'ng-template[normalTexture]', standalone: true })
export class NgtsNormalTexture {
	normalTexture = input<NgtsNormalTextureOptions>();
	normalTextureLoaded = output<Texture[]>();

	private injector = inject(Injector);
	private template = inject(TemplateRef);
	private vcr = inject(ViewContainerRef);

	private id = computed(() => this.normalTexture()?.id ?? 0);
	private settings = computed(() => {
		const { id: _, ...settings } = this.normalTexture() || {};
		return settings;
	});

	private ref?: EmbeddedViewRef<{ $implicit: Signal<Texture | null> }>;

	constructor() {
		afterNextRender(() => {
			const { texture } = injectNormalTexture(this.id, {
				settings: this.settings,
				onLoad: this.normalTextureLoaded.emit.bind(this.normalTextureLoaded),
				injector: this.injector,
			});

			untracked(() => {
				this.ref = this.vcr.createEmbeddedView(this.template, { $implicit: texture });
				this.ref.detectChanges();
			});
		});

		inject(DestroyRef).onDestroy(() => {
			this.ref?.destroy();
		});
	}

	static ngTemplateContextGuard(_: NgtsNormalTexture, ctx: unknown): ctx is { $implicit: Signal<Texture | null> } {
		return true;
	}
}
