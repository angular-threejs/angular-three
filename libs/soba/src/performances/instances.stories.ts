import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, input, Signal, viewChild } from '@angular/core';
import { Meta } from '@storybook/angular';
import { injectBeforeRender, NgtObjectEvents, omit, pick } from 'angular-three';
import { NgtsOrbitControls } from 'angular-three-soba/controls';
import { injectGLTF } from 'angular-three-soba/loaders';
import { NgtsInstance, NgtsInstances } from 'angular-three-soba/performances';
import { NgtsEnvironment } from 'angular-three-soba/staging';
import { Color, MathUtils, Mesh, MeshPhongMaterial } from 'three';
import { GLTF } from 'three-stdlib';
import { makeDecorators, makeStoryObject, number } from '../setup-canvas';

function randomVector(r: number) {
	return [r / 2 - Math.random() * r, r / 2 - Math.random() * r, r / 2 - Math.random() * r];
}

function randomEuler() {
	return [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI];
}

const data = Array.from({ length: 1000 }, (r: number) => ({
	random: Math.random(),
	position: randomVector(r ?? 10),
	rotation: randomEuler(),
}));

type Data = (typeof data)[number];

@Component({
	selector: 'instances-shoe',
	standalone: true,
	template: `
		<ngt-group [parameters]="parameters()">
			<ngts-instance
				#instance
				[ngtObjectEvents]="instance.positionMeshRef()"
				(pointerover)="$event.stopPropagation(); this.hovered = true"
				(pointerout)="this.hovered = false"
			/>
		</ngt-group>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtsInstance, NgtObjectEvents],
})
class Shoe {
	data = input.required<Data>();
	parameters = omit(this.data, ['random']);

	random = pick(this.data, 'random');

	instance = viewChild.required(NgtsInstance);

	// NOTE: this can be just a property because we use it in the injectBeforeRender loop
	//  and not bind in the template. If we were to bind it in the template, it would
	//  have to be a signal
	hovered = false;

	constructor() {
		const color = new Color();

		injectBeforeRender(({ clock }) => {
			const instance = this.instance().positionMeshRef().nativeElement;
			const t = clock.getElapsedTime() + this.random() * 10000;

			instance.rotation.set(Math.cos(t / 4) / 2, Math.sin(t / 4) / 2, Math.cos(t / 1.5) / 2);
			instance.position.y = Math.sin(t / 1.5) / 2;
			instance.scale.x =
				instance.scale.y =
				instance.scale.z =
					MathUtils.lerp(instance.scale.z, this.hovered ? 1.4 : 1, 0.1);
			instance.color.lerp(color.set(this.hovered ? 'red' : 'white'), this.hovered ? 1 : 0.1);
		});
	}
}

type ShoeGLTF = GLTF & {
	nodes: { Shoe: Mesh };
	materials: { phong1SG: MeshPhongMaterial };
};

@Component({
	selector: 'instances-shoes',
	standalone: true,
	template: `
		@if (gltf(); as gltf) {
			<ngts-instances
				[options]="{ range: range(), geometry: gltf.nodes.Shoe.geometry, material: gltf.materials.phong1SG }"
			>
				@for (datum of data; track $index) {
					<instances-shoe [data]="datum" />
				}
			</ngts-instances>
		}
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtsInstances, Shoe],
})
class Shoes {
	data = data;
	range = input(100);

	gltf = injectGLTF(() => './shoe.glb') as Signal<ShoeGLTF | null>;
}

@Component({
	standalone: true,
	template: `
		<ngt-ambient-light [intensity]="0.5 * Math.PI" />
		<ngt-directional-light [intensity]="0.3" [position]="[5, 25, 20]" />

		<instances-shoes [range]="range()" />

		<ngts-environment [options]="{ preset: 'city' }" />
		<ngts-orbit-controls [options]="{ autoRotate: true, autoRotateSpeed: 1 }" />
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtsEnvironment, NgtsOrbitControls, Shoes],
})
class DefaultInstancesStory {
	protected readonly Math = Math;

	range = input(100);
}

export default {
	title: 'Performances/Instances',
	decorators: makeDecorators(),
} as Meta;

export const Default = makeStoryObject(DefaultInstancesStory, {
	canvasOptions: {
		controls: false,
		lights: false,
		background: 'white',
		camera: { position: [0, 0, 20], fov: 50 },
	},
	argsOptions: {
		range: number(100, { range: true, min: 10, max: 500, step: 1 }),
	},
});
