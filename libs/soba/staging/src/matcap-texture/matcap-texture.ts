import { computed, effect, runInInjectionContext, signal, untracked, type Injector, type Signal } from '@angular/core';
import { assertInjectionContext } from 'angular-three';
import { injectNgtsTextureLoader } from 'angular-three-soba/loaders';

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

export type NgtsMatcapTextureState = {
	id: string | number;
	format: number;
	onLoad?: (texture: THREE.Texture | THREE.Texture[]) => void;
};

const defaultState: NgtsMatcapTextureState = {
	id: 0,
	format: 1024,
};

export function injectNgtsMatcapTexture(
	matcapTextureState: () => Partial<NgtsMatcapTextureState>,
	{ injector }: { injector?: Injector } = {},
) {
	injector = assertInjectionContext(injectNgtsMatcapTexture, injector);
	return runInInjectionContext(injector, () => {
		const state = computed(() => ({ ...defaultState, ...matcapTextureState() }));

		const matcapList = signal<Record<string, string>>({});

		const DEFAULT_MATCAP = () => matcapList()[0];
		const numTot = () => Object.keys(matcapList()).length;

		effect(() => {
			if (!untracked(numTot)) {
				fetch(LIST_URL)
					.then((res) => res.json())
					.then((data) => {
						matcapList.set(data);
					});
			}
		});

		const fileHash = () => {
			const id = state().id;
			if (typeof id === 'string') {
				return id;
			}

			if (typeof id === 'number' && matcapList()[id]) {
				return matcapList()[id];
			}

			return null;
		};

		const fileName = () => `${fileHash() || DEFAULT_MATCAP()}${getFormatString(state().format)}.png`;
		const url = () => `${MATCAP_ROOT}/${state().format}/${fileName()}`;

		let texture: Signal<THREE.Texture | null>;
		const matcapTexture = computed(() => {
			if (url().includes('undefined')) return null;
			if (!texture) {
				texture = injectNgtsTextureLoader(url, { onLoad: state().onLoad, injector });
			}
			return texture();
		});

		return { texture: matcapTexture, numTot, url };
	});
}
