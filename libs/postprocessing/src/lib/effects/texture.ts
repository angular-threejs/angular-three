import { CUSTOM_ELEMENTS_SCHEMA, ChangeDetectionStrategy, Component, computed, effect, input } from '@angular/core';
import { NgtArgs, injectStore, loaderResource, pick } from 'angular-three';
import { TextureEffect } from 'postprocessing';
import * as THREE from 'three';

export type TextureOptions = Omit<ConstructorParameters<typeof TextureEffect>[0], 'texture'> & {
	texture?: THREE.Texture;
	textureSrc?: string;
	opacity?: number;
};

@Component({
	selector: 'ngtp-texture',
	template: `
		<ngt-primitive *args="[effect()]" [dispose]="null" />
	`,
	imports: [NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgtpTexture {
	options = input({} as TextureOptions);

	private textureSrc = pick(this.options, 'textureSrc');
	private texture = pick(this.options, 'texture');
	private opacity = pick(this.options, 'opacity');

	private store = injectStore();

	private loadedTexture = loaderResource(
		() => THREE.TextureLoader,
		() => this.textureSrc() || '',
		{
			onLoad: (texture) => {
				texture.colorSpace = THREE.SRGBColorSpace;
				texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
			},
		},
	);

	effect = computed(() => {
		const { textureSrc: _, texture, opacity: __, ...options } = this.options();
		const loaded = this.loadedTexture.value();
		const t = loaded || texture;
		if (!t) return null;
		return new TextureEffect({ ...options, texture: t });
	});

	constructor() {
		effect(() => {
			const effect = this.effect();
			if (!effect) return;

			const opacity = this.opacity();
			if (opacity === undefined) return;

			const invalidate = this.store.invalidate();
			effect.blendMode.opacity.value = opacity;
			invalidate();
		});

		effect(() => {
			const effect = this.effect();
			if (!effect) return;

			const texture = this.texture();
			if (!texture) return;

			const invalidate = this.store.invalidate();
			effect.texture = texture;
			invalidate();
		});

		effect((onCleanup) => {
			const effect = this.effect();
			if (!effect) return;
			onCleanup(() => effect.dispose());
		});
	}
}
