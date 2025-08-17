import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, input } from '@angular/core';
import { Meta } from '@storybook/angular';
import { NgtArgs, NgtVector3 } from 'angular-three';
import { NgtsOrbitControls } from 'angular-three-soba/controls';
import { NgtsEnvironment, NgtsShadow, NgtsSparkles } from 'angular-three-soba/staging';
import * as THREE from 'three';
import { storyDecorators, storyObject } from '../setup-canvas';

@Component({
	selector: 'app-sphere',
	template: `
		<ngt-mesh [position]="position()">
			<ngt-sphere-geometry *args="[size(), 64, 64]" />
			<ngt-mesh-physical-material
				[roughness]="0"
				[color]="color()"
				[emissive]="emissive() || color()"
				[envMapIntensity]="0.2"
			/>
			<ngts-sparkles [options]="{ count: amount(), scale: size() * 2, size: 6, speed: 0.4 }" />
			<ngts-shadow [options]="{ scale: size() * 1.5, position: [0, -size(), 0] }" />
		</ngt-mesh>
	`,
	imports: [NgtArgs, NgtsSparkles, NgtsShadow],
	changeDetection: ChangeDetectionStrategy.OnPush,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class Sphere {
	position = input<NgtVector3>();
	size = input(1);
	amount = input(50);
	color = input<THREE.ColorRepresentation>('white');
	emissive = input<THREE.ColorRepresentation>();
}

@Component({
	template: `
		<ngt-hemisphere-light [intensity]="0.5" color="white" groundColor="black" />
		<ngts-environment
			[options]="{
				files: 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/2k/evening_road_01_2k.hdr',
				ground: { height: 5, radius: 40, scale: 20 },
			}"
		/>
		<app-sphere [amount]="50" emissive="green" [position]="[1, 1, -1]" />
		<app-sphere [amount]="30" emissive="purple" [position]="[-1.5, 0.5, -2]" [size]="0.5" />
		<app-sphere [amount]="20" emissive="orange" [position]="[-1, 0.25, 1]" [size]="0.25" color="lightpink" />
		<ngts-orbit-controls
			[options]="{
				autoRotate: true,
				autoRotateSpeed: 0.85,
				zoomSpeed: 0.75,
				minPolarAngle: Math.PI / 2.5,
				maxPolarAngle: Math.PI / 2.55,
			}"
		/>
	`,
	imports: [NgtsEnvironment, Sphere, NgtsOrbitControls],
	changeDetection: ChangeDetectionStrategy.OnPush,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class DefaultSparklesStory {
	protected readonly Math = Math;
}

export default {
	title: 'Staging/Sparkles',
	decorators: storyDecorators(),
} satisfies Meta;

export const Default = storyObject(DefaultSparklesStory, {
	camera: { position: [0, 0, 12], fov: 30 },
	lights: false,
	controls: null,
});
