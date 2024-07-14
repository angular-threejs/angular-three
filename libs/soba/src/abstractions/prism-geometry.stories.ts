import { ChangeDetectionStrategy, Component, computed, CUSTOM_ELEMENTS_SCHEMA, input } from '@angular/core';
import { Meta } from '@storybook/angular';
import { NgtsPrismGeometry, NgtsPrismGeometryOptions } from 'angular-three-soba/abstractions';
import { NgtsOrbitControls } from 'angular-three-soba/controls';
import { NgtsMeshTransmissionMaterial } from 'angular-three-soba/materials';
import { NgtsStage } from 'angular-three-soba/staging';
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
		<ngts-stage>
			<!-- left triangle -->
			<ngt-group [rotation]="[-Math.PI / 2, 0, 0]" [position]="leftTrianglePosition()">
				<ngt-mesh [rotation]="[0, 0, Math.PI]">
					<ngts-prism-geometry [vertices]="leftTriangle" [options]="options()" />
					<ngts-mesh-transmission-material [options]="transmissionOptions()" />
				</ngt-mesh>
			</ngt-group>

			<!-- right triangle -->
			<ngt-group [rotation]="[-Math.PI / 2, 0, 0]" [position]="rightTrianglePosition()">
				<ngt-mesh [rotation]="[0, 0, Math.PI]">
					<ngts-prism-geometry [vertices]="rightTriangle" [options]="options()" />
					<ngts-mesh-transmission-material [options]="transmissionOptions()" />
				</ngt-mesh>
			</ngt-group>

			<!-- center -->
			<ngt-group [rotation]="[-Math.PI / 2, 0, 0]" [position]="centerPosition()">
				<ngt-mesh [rotation]="[0, 0, Math.PI]">
					<ngts-prism-geometry [vertices]="center" [options]="options()" />
					<ngts-mesh-transmission-material [options]="transmissionOptions()" />
				</ngt-mesh>
			</ngt-group>

			<!-- pentagon -->
			<ngt-group [rotation]="[-Math.PI / 2, 0, 0]" [position]="pentagonPosition()">
				<ngt-mesh [rotation]="[0, 0, Math.PI]">
					<ngts-prism-geometry [vertices]="pentagon" [options]="options()" />
					<ngts-mesh-transmission-material [options]="transmissionOptions()" />
				</ngt-mesh>
			</ngt-group>
		</ngts-stage>

		<ngts-orbit-controls [options]="{ makeDefault: true, minPolarAngle: 0, maxPolarAngle: Math.PI / 2 }" />
	`,
	imports: [NgtsPrismGeometry, NgtsMeshTransmissionMaterial, NgtsOrbitControls, NgtsStage],
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

	private positionRatio = computed(() => {
		const bevelEnabled = this.options().bevelEnabled;
		return bevelEnabled ? 1.5 : 1;
	});

	leftTrianglePosition = computed(() => [-0.275 * this.positionRatio(), 0, -0.1 * this.positionRatio()]);
	rightTrianglePosition = computed(() => [0.275 * this.positionRatio(), 0, -0.1 * this.positionRatio()]);
	centerPosition = computed(() => [0, 0, 0.05 * this.positionRatio()]);
	pentagonPosition = computed(() => [0, 0, 0.35 * this.positionRatio()]);

	transmissionOptions = computed(() => ({
		color: this.color(),
		envMapIntensity: 2,
		roughness: 0.1,
		thickness: 1,
		transmission: 1,
	}));
}

export default {
	title: 'Abstractions/PrismGeometry',
	decorators: makeDecorators(),
} as Meta;

export const Default = makeStoryObject(DefaultPrismGeometryStory, {
	canvasOptions: { camera: { position: [-0.3, 1, 0.75] }, background: '#cecece', controls: false },
	argsOptions: {
		color: color('#de194a'),
		options: {
			height: number(0.1, { range: true, min: 0.01, max: 0.2, step: 0.01 }),
			bevelEnabled: false,
		},
	},
});
