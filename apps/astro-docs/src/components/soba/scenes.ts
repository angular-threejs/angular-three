import type { Type } from '@angular/core';
import type { SetupCanvasOptions } from './canvas-options';

import GradientTextureScene, { content } from './abstractions/gradient-texture?includeContent';

export type EntryPoints = 'abstractions';
export type EntryPointScene = {
	abstractions: 'gradientTexture';
};

export type SceneKeys = {
	[TEntry in EntryPoints]: `${TEntry}.${EntryPointScene[TEntry]}`;
}[EntryPoints];

export type SceneOptions = {
	scene: Type<any>;
	text: string;
	canvasOptions?: Partial<SetupCanvasOptions>;
};

export type Scenes = {
	[TEntry in EntryPoints]: {
		[TScene in EntryPointScene[TEntry]]: SceneOptions;
	};
};

export const scenes: Scenes = {
	abstractions: {
		gradientTexture: {
			scene: GradientTextureScene,
			text: content,
		},
	},
};
