import { computed, effect, signal, untracked, type Injector, type Signal } from '@angular/core';
import { injectNgtsTextureLoader } from 'angular-three-soba/loaders';
import { assertInjector } from 'ngxtension/assert-injector';
import * as THREE from 'three';

const NORMAL_ROOT = 'https://rawcdn.githack.com/pmndrs/drei-assets/7a3104997e1576f83472829815b00880d88b32fb';
const LIST_URL = 'https://cdn.jsdelivr.net/gh/pmndrs/drei-assets@master/normals/normals.json';

export type NgtsNormalTextureState = {
	id: string | number;
	repeat: number[];
	anisotropy: number;
	offset: number[];
	onLoad?: (texture: THREE.Texture | THREE.Texture[]) => void;
};

const defaultState: NgtsNormalTextureState = {
	id: 0,
	repeat: [1, 1],
	anisotropy: 1,
	offset: [0, 0],
};

export function injectNgtsNormalTexture(
	normalTextureState: () => Partial<NgtsNormalTextureState>,
	{ injector }: { injector?: Injector } = {},
) {
	return assertInjector(injectNgtsNormalTexture, injector, () => {
		const state = computed(() => ({ ...defaultState, ...normalTextureState() }));
		const normalsList = signal<Record<string, string>>({});

		const DEFAULT_NORMAL = () => normalsList()[0];
		const numTot = () => Object.keys(normalsList()).length;

		effect(() => {
			if (!untracked(numTot)) {
				fetch(LIST_URL)
					.then((res) => res.json())
					.then((data) => {
						normalsList.set(data);
					});
			}
		});

		const imageName = () => normalsList()[state().id] || DEFAULT_NORMAL();
		const url = () => `${NORMAL_ROOT}/normals/${imageName()}`;

		let texture: Signal<THREE.Texture | null>;
		const normalTexture = computed(() => {
			if (url().includes('undefined')) return null;
			if (!texture) {
				texture = injectNgtsTextureLoader(url, { onLoad: state().onLoad, injector });
			}
			return texture();
		});

		effect(() => {
			const _texture = normalTexture();
			if (!_texture) return;

			const { repeat, offset, anisotropy } = state();
			_texture.wrapS = _texture.wrapT = THREE.RepeatWrapping;
			_texture.repeat = new THREE.Vector2(repeat[0], repeat[1]);
			_texture.offset = new THREE.Vector2(offset[0], offset[1]);
			_texture.anisotropy = anisotropy;
		});

		return { texture: normalTexture, numTot, url };
	});
}
