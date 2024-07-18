import { CUSTOM_ELEMENTS_SCHEMA, ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Meta } from '@storybook/angular';
import { NgtArgs } from 'angular-three';
import { NgtsPerspectiveCamera } from 'angular-three-soba/cameras';
import { NgtsOrbitControls } from 'angular-three-soba/controls';
import {
	ENVIRONMENT_PRESETS,
	NgtsContactShadows,
	NgtsEnvironment,
	NgtsEnvironmentOptions,
} from 'angular-three-soba/staging';
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

export const Files = makeStoryObject(DefaultEnvironmentStory, {
	canvasOptions: { controls: false, camera: { position: [0, 0, 10] } },
	argsOptions: {
		options: {
			background: true,
			files: ['px.png', 'nx.png', 'py.png', 'ny.png', 'pz.png', 'nz.png'],
			path: './cube/',
		},
	},
});

export const GainMap = makeStoryObject(DefaultEnvironmentStory, {
	canvasOptions: { controls: false, camera: { position: [0, 0, 10] } },
	argsOptions: {
		options: {
			files: ['./gainmap/potsdamer_platz_1k.jpg'],
			background: true,
		},
	},
});

@Component({
	standalone: true,
	template: `
		<ngts-environment [options]="options()" />
		<ngt-mesh [position]="[0, 5, 0]">
			<ngt-box-geometry *args="[10, 10, 10]" />
			<ngt-mesh-standard-material [metalness]="1" [roughness]="0" />
		</ngt-mesh>
		<ngts-contact-shadows [options]="contactShadowsOptions" />
		<ngts-orbit-controls [options]="oribitControlsOptions" />
		<ngts-perspective-camera [options]="perspectiveCameraOptions" />
	`,
	imports: [NgtArgs, NgtsEnvironment, NgtsOrbitControls, NgtsPerspectiveCamera, NgtsContactShadows],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
class GroundEnvironmentStory {
	options = input({} as NgtsEnvironmentOptions);
	contactShadowsOptions = { scale: 100, resolution: 1024, position: [0, 0, 0], blur: 2, opacity: 1, far: 10 };
	oribitControlsOptions = { autoRotate: true };
	perspectiveCameraOptions = { position: [40, 40, 40], makeDefault: true };
}

export const Ground = makeStoryObject(GroundEnvironmentStory, {
	canvasOptions: { controls: false, camera: { position: [0, 0, 10] } },
	argsOptions: {
		options: {
			ground: { height: 15, radius: 60 },
			preset: select('park', { options: Object.keys(ENVIRONMENT_PRESETS) }),
		},
	},
});
