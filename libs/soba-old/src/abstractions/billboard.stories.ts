import { Component, CUSTOM_ELEMENTS_SCHEMA, Input } from '@angular/core';
import { NgtArgs } from 'angular-three-old';
import { NgtsBillboard, NgtsText } from 'angular-three-soba-old/abstractions';
import { NgtsOrbitControls } from 'angular-three-soba-old/controls';
import { BoxGeometry, ConeGeometry, PlaneGeometry } from 'three';
import { makeDecorators, makeStoryObject } from '../setup-canvas';

@Component({
	selector: 'billboard-cone',
	standalone: true,
	template: `
		<ngt-mesh>
			<ngt-cone-geometry *args="args" />
			<ngt-value attach="material.color" [rawValue]="color" />
			<ng-content />
		</ngt-mesh>
	`,
	imports: [NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class Cone {
	@Input() args: ConstructorParameters<typeof ConeGeometry> = [1, 1];
	@Input() color = 'white';
}

@Component({
	selector: 'billboard-box',
	standalone: true,
	template: `
		<ngt-mesh [position]="position">
			<ngt-box-geometry *args="args" />
			<ngt-value attach="material.color" [rawValue]="color" />
			<ng-content />
		</ngt-mesh>
	`,
	imports: [NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class Box {
	@Input() position = [0, 0, 0];
	@Input() args: ConstructorParameters<typeof BoxGeometry> = [1, 1, 1];
	@Input() color = 'white';
}

@Component({
	selector: 'billboard-plane',
	standalone: true,
	template: `
		<ngt-mesh>
			<ngt-plane-geometry *args="args" />
			<ngt-value attach="material.color" [rawValue]="color" />
			<ng-content />
		</ngt-mesh>
	`,
	imports: [NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class Plane {
	@Input() args: ConstructorParameters<typeof PlaneGeometry> = [];
	@Input() color = 'white';
}

@Component({
	standalone: true,
	template: `
		<ngts-billboard [follow]="follow" [lockX]="lockX" [lockY]="lockY" [lockZ]="lockZ" [position]="[0.5, 2.05, 0.5]">
			<ngts-text text="box" [fontSize]="1" [outlineWidth]="'5%'" [outlineColor]="'#000'" [outlineOpacity]="1" />
		</ngts-billboard>
		<billboard-box [position]="[0.5, 1, 0.5]" color="red">
			<ngt-mesh-standard-material />
		</billboard-box>
		<ngt-group [position]="[-2.5, -3, -1]">
			<ngts-billboard [follow]="follow" [lockX]="lockX" [lockY]="lockY" [lockZ]="lockZ" [position]="[0, 1.05, 0]">
				<ngts-text
					text="cone"
					[fontSize]="1"
					[outlineWidth]="'5%'"
					[outlineColor]="'#000'"
					[outlineOpacity]="1"
				/>
			</ngts-billboard>
			<billboard-cone color="green">
				<ngt-mesh-standard-material />
			</billboard-cone>
		</ngt-group>
		<ngts-billboard [follow]="follow" [lockX]="lockX" [lockY]="lockY" [lockZ]="lockZ" [position]="[0, 0, -5]">
			<billboard-plane [args]="[2, 2]" color="#000066">
				<ngt-mesh-standard-material />
			</billboard-plane>
		</ngts-billboard>

		<ngts-orbit-controls [enablePan]="true" [zoomSpeed]="0.5" />
	`,
	imports: [NgtsBillboard, NgtsText, Cone, Box, Plane, NgtsOrbitControls],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class TextBillboardStory {
	@Input() follow = true;
	@Input() lockX = false;
	@Input() lockY = false;
	@Input() lockZ = false;
}

@Component({
	standalone: true,
	template: `
		<ngts-billboard [follow]="follow" [lockX]="lockX" [lockY]="lockY" [lockZ]="lockZ" [position]="[-4, -2, 0]">
			<billboard-plane [args]="[3, 2]" color="red" />
		</ngts-billboard>
		<ngts-billboard [follow]="follow" [lockX]="lockX" [lockY]="lockY" [lockZ]="lockZ" [position]="[-4, 2, 0]">
			<billboard-plane [args]="[3, 2]" color="orange" />
		</ngts-billboard>
		<ngts-billboard [follow]="follow" [lockX]="lockX" [lockY]="lockY" [lockZ]="lockZ" [position]="[0, 0, 0]">
			<billboard-plane [args]="[3, 2]" color="green" />
		</ngts-billboard>
		<ngts-billboard [follow]="follow" [lockX]="lockX" [lockY]="lockY" [lockZ]="lockZ" [position]="[4, -2, 0]">
			<billboard-plane [args]="[3, 2]" color="blue" />
		</ngts-billboard>
		<ngts-billboard [follow]="follow" [lockX]="lockX" [lockY]="lockY" [lockZ]="lockZ" [position]="[4, 2, 0]">
			<billboard-plane [args]="[3, 2]" color="yellow" />
		</ngts-billboard>

		<ngts-orbit-controls [enablePan]="true" [zoomSpeed]="0.5" />
	`,
	imports: [NgtsBillboard, Plane, NgtsOrbitControls],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class DefaultBillboardStory {
	@Input() follow = true;
	@Input() lockX = false;
	@Input() lockY = false;
	@Input() lockZ = false;
}

export default {
	title: 'Abstractions/Billboard',
	decorators: makeDecorators(),
};

const canvasOptions = { camera: { position: [0, 0, 10] }, controls: false };

export const Default = makeStoryObject(DefaultBillboardStory, {
	canvasOptions,
	argsOptions: { follow: true, lockX: false, lockY: false, lockZ: false },
});

export const Text = makeStoryObject(TextBillboardStory, {
	canvasOptions,
	argsOptions: { follow: true, lockX: false, lockY: false, lockZ: false },
});
