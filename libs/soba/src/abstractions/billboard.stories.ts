import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, input } from '@angular/core';
import { Meta } from '@storybook/angular';
import { NgtArgs } from 'angular-three';
import { NgtsBillboard, NgtsText } from 'angular-three-soba/abstractions';
import { NgtsOrbitControls } from 'angular-three-soba/controls';
import { makeDecorators, makeStoryObject } from '../setup-canvas';

@Component({
	standalone: true,
	template: `
		<ngts-billboard
			[options]="{ follow: follow(), lockZ: lockZ(), lockY: lockY(), lockX: lockX(), position: [0.5, 2.05, 0.5] }"
		>
			<ngts-text
				text="hello"
				[options]="{ fontSize: 1, outlineWidth: '5%', outlineColor: '#000000', outlineOpacity: 1 }"
			/>
		</ngts-billboard>
		<ngt-mesh [position]="[0.5, 1, 0.5]">
			<ngt-box-geometry />
			<ngt-mesh-standard-material color="red" />
		</ngt-mesh>
		<ngt-group [position]="[-2.5, -3, -1]">
			<ngts-billboard
				[options]="{ follow: follow(), lockZ: lockZ(), lockY: lockY(), lockX: lockX(), position: [0, 1.05, 0] }"
			>
				<ngts-text
					text="cone"
					[options]="{ fontSize: 1, outlineWidth: '5%', outlineColor: '#000000', outlineOpacity: 1 }"
				/>
			</ngts-billboard>
			<ngt-mesh>
				<ngt-cone-geometry />
				<ngt-mesh-standard-material color="green" />
			</ngt-mesh>
		</ngt-group>

		<ngts-billboard
			[options]="{ follow: follow(), lockZ: lockZ(), lockY: lockY(), lockX: lockX(), position: [0, 0, -5] }"
		>
			<ngt-mesh>
				<ngt-plane-geometry />
				<ngt-mesh-standard-material color="#000066" />
			</ngt-mesh>
		</ngts-billboard>

		<ngts-orbit-controls [options]="{ enablePan: true, zoomSpeed: 0.5 }" />
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtsBillboard, NgtsText, NgtsOrbitControls],
})
class TextBillboardStory {
	follow = input(true);
	lockX = input(false);
	lockY = input(false);
	lockZ = input(false);
}

@Component({
	standalone: true,
	template: `
		<ngts-billboard
			[options]="{ follow: follow(), lockZ: lockZ(), lockY: lockY(), lockX: lockX(), position: [-4, -2, 0] }"
		>
			<ngt-mesh>
				<ngt-plane-geometry *args="[3, 2]" />
				<ngt-value rawValue="red" attach="material.color" />
			</ngt-mesh>
		</ngts-billboard>

		<ngts-billboard
			[options]="{ follow: follow(), lockZ: lockZ(), lockY: lockY(), lockX: lockX(), position: [-4, 2, 0] }"
		>
			<ngt-mesh>
				<ngt-plane-geometry *args="[3, 2]" />
				<ngt-value rawValue="orange" attach="material.color" />
			</ngt-mesh>
		</ngts-billboard>

		<ngts-billboard
			[options]="{ follow: follow(), lockZ: lockZ(), lockY: lockY(), lockX: lockX(), position: [0, 0, 0] }"
		>
			<ngt-mesh>
				<ngt-plane-geometry *args="[3, 2]" />
				<ngt-value rawValue="green" attach="material.color" />
			</ngt-mesh>
		</ngts-billboard>

		<ngts-billboard
			[options]="{ follow: follow(), lockZ: lockZ(), lockY: lockY(), lockX: lockX(), position: [4, -2, 0] }"
		>
			<ngt-mesh>
				<ngt-plane-geometry *args="[3, 2]" />
				<ngt-value rawValue="blue" attach="material.color" />
			</ngt-mesh>
		</ngts-billboard>

		<ngts-billboard
			[options]="{ follow: follow(), lockZ: lockZ(), lockY: lockY(), lockX: lockX(), position: [4, 2, 0] }"
		>
			<ngt-mesh>
				<ngt-plane-geometry *args="[3, 2]" />
				<ngt-value rawValue="yellow" attach="material.color" />
			</ngt-mesh>
		</ngts-billboard>

		<ngts-orbit-controls [options]="{ enablePan: true, zoomSpeed: 0.5 }" />
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtsBillboard, NgtsOrbitControls, NgtArgs],
})
class DefaultBillboardStory {
	follow = input(true);
	lockX = input(false);
	lockY = input(false);
	lockZ = input(false);
}

export default {
	title: 'Abstractions/Billboard',
	decorators: makeDecorators(),
} as Meta;

export const Default = makeStoryObject(DefaultBillboardStory, {
	canvasOptions: { camera: { position: [0, 0, 10] }, controls: false },
	argsOptions: { follow: true, lockX: false, lockY: false, lockZ: false },
});

export const Text = makeStoryObject(TextBillboardStory, {
	canvasOptions: { camera: { position: [0, 0, 10] }, controls: false },
	argsOptions: { follow: true, lockX: false, lockY: false, lockZ: false },
});
