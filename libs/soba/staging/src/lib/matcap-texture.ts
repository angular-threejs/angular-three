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
	inject,
	input,
	output,
	signal,
	untracked,
} from '@angular/core';
import { injectTexture } from 'angular-three-soba/loaders';
import { assertInjector } from 'ngxtension/assert-injector';
import { Texture } from 'three';

function getFormatString(format: number) {
	switch (format) {
		case 64:
			return '-64px';
		case 128:
			return '-128px';
		case 256:
			return '-256px';
		case 512:
			return '-512px';
		default:
			return '';
	}
}

const LIST_URL = 'https://cdn.jsdelivr.net/gh/pmndrs/drei-assets@master/matcaps.json';
const MATCAP_ROOT = 'https://rawcdn.githack.com/emmelleppi/matcaps/9b36ccaaf0a24881a39062d05566c9e92be4aa0d';

export function injectMatcapTexture(
	id: () => number | string = () => 0,
	{
		format = () => 1024,
		onLoad,
		injector,
	}: { format?: () => number; onLoad?: (texture: Texture[]) => void; injector?: Injector } = {},
) {
	return assertInjector(injectMatcapTexture, injector, () => {
		const matcapList = signal<Record<string, string>>({});

		fetch(LIST_URL)
			.then((res) => res.json())
			.then((list) => {
				matcapList.set(list);
			});

		const DEFAULT_MATCAP = computed(() => matcapList()[0]);
		const numTot = computed(() => Object.keys(matcapList()).length);

		const fileHash = computed(() => {
			const idValue = id();
			if (typeof idValue === 'string') {
				return idValue;
			}

			if (typeof idValue === 'number') {
				return matcapList()[idValue];
			}

			return null;
		});

		const fileName = computed(() => `${fileHash() || DEFAULT_MATCAP()}${getFormatString(format())}.png`);
		const url = computed(() => `${MATCAP_ROOT}/${format()}/${fileName()}`);

		const matcapTexture = injectTexture(url, { onLoad });

		return { url, texture: matcapTexture, numTot };
	});
}

export interface NgtsMatcapTextureOptions {
	id?: number | string;
	format?: number;
}

@Directive({ selector: 'ng-template[matcapTexture]', standalone: true })
export class NgtsMatcapTexture {
	matcapTexture = input<NgtsMatcapTextureOptions>();
	matcapTextureLoaded = output<Texture[]>();

	private injector = inject(Injector);
	private template = inject(TemplateRef);
	private vcr = inject(ViewContainerRef);

	private id = computed(() => this.matcapTexture()?.id ?? 0);
	private format = computed(() => this.matcapTexture()?.format ?? 1024);

	private ref?: EmbeddedViewRef<{ $implicit: Signal<Texture | null> }>;

	constructor() {
		afterNextRender(() => {
			const { texture } = injectMatcapTexture(this.id, {
				format: this.format,
				onLoad: this.matcapTextureLoaded.emit.bind(this.matcapTextureLoaded),
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

	static ngTemplateContextGuard(_: NgtsMatcapTexture, ctx: unknown): ctx is { $implicit: Signal<Texture | null> } {
		return true;
	}
}
