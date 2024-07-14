import {
	ChangeDetectionStrategy,
	Component,
	computed,
	CUSTOM_ELEMENTS_SCHEMA,
	ElementRef,
	input,
	viewChild,
} from '@angular/core';
import { Meta } from '@storybook/angular';
import { injectBeforeRender, NgtArgs } from 'angular-three';
import { NgtsPrismGeometry, NgtsPrismGeometryOptions } from 'angular-three-soba/abstractions';
import { NgtsOrbitControls } from 'angular-three-soba/controls';
import { NgtsMeshTransmissionMaterial } from 'angular-three-soba/materials';
import { NgtsContactShadows, NgtsEnvironment } from 'angular-three-soba/staging';
import { Group } from 'three';
import { color, makeDecorators, makeStoryObject, number } from '../setup-canvas';

const leftTriangle = [
	[0.101, -0.095],
	[0.075, 0.318],
	[-0.176, -0.223],
];

const rightTriangle = [
	[-0.075, 0.318],
	[-0.101, -0.095],
	[0.176, -0.223],
];

const center = [
	[-0.000035, -0.161],
	[0.0995, 0.081],
	[-0.0995, 0.081],
];

const pentagon = [
	[0.19, 0.016],
	[0.0, 0.124],
	[-0.19, 0.016],
	[-0.151, -0.078],
	[0.151, -0.078],
];

@Component({
	standalone: true,
	template: `
		<ngt-group #group>
			<!-- left triangle -->
			<ngt-group [rotation]="[-Math.PI / 2, 0, 0]" [position]="[-0.275, 0, -0.1]">
				<ngt-mesh [rotation]="[0, 0, Math.PI]">
					<ngts-prism-geometry [vertices]="leftTriangle" [options]="options()" />
					<ngts-mesh-transmission-material [options]="transmissionOptions()" />
				</ngt-mesh>
			</ngt-group>

			<!-- right triangle -->
			<ngt-group [rotation]="[-Math.PI / 2, 0, 0]" [position]="[0.275, 0, -0.1]">
				<ngt-mesh [rotation]="[0, 0, Math.PI]">
					<ngts-prism-geometry [vertices]="rightTriangle" [options]="options()" />
					<ngts-mesh-transmission-material [options]="transmissionOptions()" />
				</ngt-mesh>
			</ngt-group>

			<!-- center -->
			<ngt-group [rotation]="[-Math.PI / 2, 0, 0]" [position]="[0, 0, 0.05]">
				<ngt-mesh [rotation]="[0, 0, Math.PI]">
					<ngts-prism-geometry [vertices]="center" [options]="options()" />
					<ngts-mesh-transmission-material [options]="transmissionOptions()" />
				</ngt-mesh>
			</ngt-group>

			<!-- pentagon -->
			<ngt-group [rotation]="[-Math.PI / 2, 0, 0]" [position]="[0, 0, 0.35]">
				<ngt-mesh [rotation]="[0, 0, Math.PI]">
					<ngts-prism-geometry [vertices]="pentagon" [options]="options()" />
					<ngts-mesh-transmission-material [options]="transmissionOptions()" />
				</ngt-mesh>
			</ngt-group>
		</ngt-group>

		<ngts-environment [options]="{ preset: 'city' }" />
		<ngts-contact-shadows [options]="{ position: [0, -0.5, 0] }" />
	`,
	imports: [
		NgtsPrismGeometry,
		NgtArgs,
		NgtsEnvironment,
		NgtsMeshTransmissionMaterial,
		NgtsOrbitControls,
		NgtsContactShadows,
	],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
class DefaultPrismGeometryStory {
	protected readonly Math = Math;
	protected readonly leftTriangle = leftTriangle;
	protected readonly rightTriangle = rightTriangle;
	protected readonly center = center;
	protected readonly pentagon = pentagon;

	options = input({} as NgtsPrismGeometryOptions);
	color = input('#de194a');

	group = viewChild.required<ElementRef<Group>>('group');

	transmissionOptions = computed(() => ({
		color: this.color(),
		envMapIntensity: 2,
		roughness: 0.1,
		thickness: 1,
		transmission: 1,
	}));

	constructor() {
		injectBeforeRender(({ delta }) => {
			const group = this.group().nativeElement;
			group.rotation.x += delta * 0.75;
			group.rotation.y += delta * 0.75;
		});
	}
}

export default {
	title: 'Abstractions/PrismGeometry',
	decorators: makeDecorators(),
} as Meta;

export const Default = makeStoryObject(DefaultPrismGeometryStory, {
	canvasOptions: { camera: { position: [-0.3, 1, 0.75] }, background: '#cecece' },
	argsOptions: {
		color: color('#de194a'),
		options: {
			height: number(0.05, { range: true, min: 0.01, max: 0.2, step: 0.01 }),
			bevelEnabled: false,
		},
	},
});
