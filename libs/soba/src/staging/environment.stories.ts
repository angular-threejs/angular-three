import { NgIf } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, Input } from '@angular/core';
import { Meta } from '@storybook/angular';
import { NgtArgs } from 'angular-three';
import { NgtsPerspectiveCamera } from 'angular-three-soba/cameras';
import { NgtsOrbitControls } from 'angular-three-soba/controls';
import { ENVIRONMENT_PRESETS, NgtsContactShadows, NgtsEnvironment } from 'angular-three-soba/staging';
import { makeDecorators, makeStoryObject, number, select } from '../setup-canvas';

const presets = Object.keys(ENVIRONMENT_PRESETS);

const preset = select('park', { options: presets });
const height = number(15, { range: true, min: 0, max: 50, step: 0.1 });
const radius = number(60, { range: true, min: 0, max: 200, step: 1 });
const blur = number(0, { range: true, min: 0, max: 1, step: 0.01 });
const defaultPreset = select(presets[0], { options: presets });

@Component({
	standalone: true,
	template: `
		<ngts-environment [ground]="{ height, radius }" [preset]="preset" />
		<ngt-mesh [position]="[0, 5, 0]">
			<ngt-box-geometry *args="[10, 10, 10]" />
			<ngt-mesh-standard-material [metalness]="1" [roughness]="0" />
		</ngt-mesh>
		<ngts-contact-shadows
			[resolution]="1024"
			[position]="[0, 0, 0]"
			[scale]="100"
			[blur]="2"
			[opacity]="1"
			[far]="10"
		/>
		<ngts-orbit-controls [autoRotate]="true" />
		<ngts-perspective-camera [position]="[40, 40, 40]" [makeDefault]="true" />
	`,
	imports: [NgtsEnvironment, NgtsOrbitControls, NgtsPerspectiveCamera, NgtsContactShadows, NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class GroundEnvironmentStory {
	@Input() preset = preset.defaultValue;
	@Input() height = height.defaultValue;
	@Input() radius = radius.defaultValue;
}

@Component({
	standalone: true,
	template: `
		<ngts-environment
			[background]="background"
			[path]="'soba/cube/'"
			[files]="['px.png', 'nx.png', 'py.png', 'ny.png', 'pz.png', 'nz.png']"
		/>
		<ngt-mesh>
			<ngt-torus-knot-geometry *args="[1, 0.5, 128, 32]" />
			<ngt-mesh-standard-material [metalness]="1" [roughness]="0" />
		</ngt-mesh>
		<ngts-orbit-controls [autoRotate]="true" />
	`,
	imports: [NgtsEnvironment, NgtsOrbitControls, NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class FilesEnvironmentStory {
	@Input() background = true;
}

@Component({
	standalone: true,
	template: `
		<ngts-environment [background]="background" [preset]="preset" [blur]="blur" />
		<ngt-mesh>
			<ngt-torus-knot-geometry *args="[1, 0.5, 128, 32]" />
			<ngt-mesh-standard-material [metalness]="1" [roughness]="0" />
		</ngt-mesh>
		<ngts-orbit-controls [autoRotate]="true" />
	`,
	imports: [NgtsEnvironment, NgtsOrbitControls, NgtArgs, NgIf],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class DefaultEnvironmentStory {
	@Input() background = true;
	@Input() preset = defaultPreset.defaultValue;
	@Input() blur = blur.defaultValue;
}

export default {
	title: 'Staging/Environment',
	decorators: makeDecorators(),
} as Meta;

export const Default = makeStoryObject(DefaultEnvironmentStory, {
	canvasOptions: { controls: false, camera: { position: [0, 0, 10] } },
	argsOptions: { background: true, blur, preset: defaultPreset },
});

export const Files = makeStoryObject(FilesEnvironmentStory, {
	canvasOptions: { controls: false, camera: { position: [0, 0, 10] } },
	argsOptions: { background: true },
});

export const Ground = makeStoryObject(GroundEnvironmentStory, {
	canvasOptions: { controls: false, camera: { position: [0, 0, 10] } },
	argsOptions: { preset, height, radius },
});
