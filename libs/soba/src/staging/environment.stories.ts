import { CUSTOM_ELEMENTS_SCHEMA, ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Meta } from '@storybook/angular';
import { NgtArgs } from 'angular-three';
import { NgtsPerspectiveCamera } from 'angular-three-soba/cameras';
import { NgtsOrbitControls } from 'angular-three-soba/controls';
import { ENVIRONMENT_PRESETS, NgtsEnvironment, NgtsEnvironmentOptions } from 'angular-three-soba/staging';
import { makeDecorators, makeStoryObject, number, select } from '../setup-canvas';

@Component({
	selector: 'environment-torus',
	standalone: true,
	template: `
		<ngt-mesh>
			<ngt-torus-knot-geometry *args="[1, 0.5, 128, 32]" />
			<ngt-mesh-standard-material [metalness]="1" [roughness]="0" />
		</ngt-mesh>
	`,
	imports: [NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
class Torus {}

@Component({
	standalone: true,
	template: `
		<ngts-environment [options]="options()" />
		<ngt-mesh [position]="[0, 5, 0]">
			<ngt-box-geometry *args="[10, 10, 10]" />
			<ngt-mesh-standard-material [metalness]="1" [roughness]="0" />
		</ngt-mesh>
		<ngts-orbit-controls [options]="{ autoRotate: true }" />
		<ngts-perspective-camera [options]="{ position: [40, 40, 40], makeDefault: true }" />
	`,
	imports: [NgtArgs, NgtsEnvironment, NgtsOrbitControls, NgtsPerspectiveCamera],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
class GroundEnvironmentStory {
	options = input({} as NgtsEnvironmentOptions);
}

@Component({
	standalone: true,
	template: `
		<ngts-environment [options]="options()" />
		<environment-torus />
		<ngts-orbit-controls [options]="{ autoRotate: true }" />
	`,
	imports: [Torus, NgtsEnvironment, NgtsOrbitControls],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
class FilesEnvironmentStory {
	options = input({} as NgtsEnvironmentOptions);
}

@Component({
	standalone: true,
	template: `
		<ngts-environment [options]="options()" />
		<environment-torus />
		<ngts-orbit-controls [options]="{ autoRotate: true }" />
	`,
	imports: [Torus, NgtsEnvironment, NgtsOrbitControls],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
class DefaultEnvironmentStory {
	options = input({} as NgtsEnvironmentOptions);
}

export default {
	title: 'Staging/Environment',
	decorators: makeDecorators(),
} as Meta;

export const Default = makeStoryObject(DefaultEnvironmentStory, {
	canvasOptions: { controls: false, camera: { position: [0, 0, 10] } },
	argsOptions: {
		options: {
			background: true,
			backgroundBlurriness: number(0, { range: true, min: 0, max: 1, step: 0.01 }),
			preset: select('apartment', { options: Object.keys(ENVIRONMENT_PRESETS) }),
		},
	},
});

export const Files = makeStoryObject(FilesEnvironmentStory, {
	canvasOptions: { controls: false, camera: { position: [0, 0, 10] } },
	argsOptions: {
		options: {
			background: true,
			files: ['px.png', 'nx.png', 'py.png', 'ny.png', 'pz.png', 'nz.png'],
			path: 'https://drei.pmnd.rs/cube/',
		},
	},
});

export const Ground = makeStoryObject(GroundEnvironmentStory, {
	canvasOptions: { controls: false, camera: { position: [0, 0, 10] } },
	argsOptions: {
		options: {
			ground: { height: 15, radius: 60 },
			preset: select('park', { options: Object.keys(ENVIRONMENT_PRESETS) }),
		},
	},
});
