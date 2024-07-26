import type { Type } from '@angular/core';
import type { SetupCanvasOptions } from './canvas-options';

import GradientTextureScene, {
	content as gradientTextureContent,
} from './abstractions/gradient-texture?includeContent';
import GridScene, { content as gridContent } from './abstractions/grid.ts?includeContent';

export type EntryPoints = 'abstractions';
export type EntryPointScene = {
	abstractions: 'gradientTexture' | 'grid';
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
			text: gradientTextureContent,
		},
		grid: {
			scene: GridScene,
			text: gridContent,
			canvasOptions: {
				camera: { position: [10, 12, 12], fov: 25 },
				lights: false,
				controls: false,
				background: '#303035',
			},
		},
	},
};
