import { ChangeDetectionStrategy, Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, input } from '@angular/core';
import { Meta } from '@storybook/angular';
import { NgtArgs, NgtThreeEvent } from 'angular-three';
import { NgtsOrbitControls } from 'angular-three-soba/controls';
import { injectGLTF } from 'angular-three-soba/loaders';
import { NgtsBounds, NgtsContactShadows } from 'angular-three-soba/staging';
import { Mesh, MeshStandardMaterial } from 'three';
import { makeDecorators, makeStoryFunction } from '../setup-canvas';

@Component({
	selector: 'bounds-model',
	standalone: true,
	template: `
		@if (geometry() && material()) {
			<ngt-mesh
				[geometry]="geometry()"
				[material]="material()"
				[position]="position()"
				[rotation]="rotation()"
				[scale]="scale()"
			/>
		}
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
class Model {
	name = input.required<string>();
	position = input([0, 0, 0]);
	rotation = input([0, 0, 0]);
	scale = input(1);

	gltf = injectGLTF(() => './compressed.glb');

	geometry = computed(() => {
		const gltf = this.gltf();
		if (!gltf) return null;
		const node = gltf.nodes[this.name()] as Mesh;
		return node.geometry;
	});

	material = computed(() => {
		const gltf = this.gltf();
		if (!gltf) return null;
		const node = gltf.nodes[this.name()] as Mesh;
		const material = node.material as MeshStandardMaterial;

		material.emissive.set('red');
		material.roughness = 1;

		return material;
	});
}

@Component({
	selector: 'bounds-select-to-zoom',
	standalone: true,
	template: `
		<ngt-group (click)="onClick($any($event))" (pointermissed)="onPointerMissed($any($event))">
			<ng-content />
		</ngt-group>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
class SelectToZoom {
	bounds = inject(NgtsBounds);

	onClick(event: NgtThreeEvent<PointerEvent>) {
		event.stopPropagation();
		if (event.delta <= 2) {
			this.bounds.refresh(event.object).fit();
		}
	}

	onPointerMissed(event: NgtThreeEvent<PointerEvent>) {
		if (event.button === 0) {
			this.bounds.refresh().fit();
		}
	}
}

@Component({
	standalone: true,
	template: `
		<ngt-color *args="['#ff5f40']" attach="background" />

		<ngt-spot-light [position]="-100" [intensity]="0.2 * Math.PI" [decay]="0" [angle]="0.3" [penumbra]="1" />
		<ngt-hemisphere-light color="white" groundColor="#ff0f00" [position]="[-7, 25, 13]" [intensity]="Math.PI" />

		<ngts-bounds [options]="{ fit: true, clip: true, observe: true, margin: 1.2 }">
			<bounds-select-to-zoom>
				<bounds-model name="Curly" [position]="[1, -11, -20]" [rotation]="[2, 0, -0]" />
				<bounds-model name="DNA" [position]="[20, 0, -17]" [rotation]="[1, 1, -2]" />
				<bounds-model name="Headphones" [position]="[20, 2, 4]" [rotation]="[1, 0, -1]" />
				<bounds-model name="Notebook" [position]="[-21, -15, -13]" [rotation]="[2, 0, 1]" />
				<bounds-model name="Rocket003" [position]="[18, 15, -25]" [rotation]="[1, 1, 0]" />
				<bounds-model name="Roundcube001" [position]="[-25, -4, 5]" [rotation]="[1, 0, 0]" [scale]="0.5" />
				<bounds-model name="Table" [position]="[1, -4, -28]" [rotation]="[1, 0, -1]" [scale]="0.5" />
				<bounds-model name="VR_Headset" [position]="[7, -15, 28]" [rotation]="[1, 0, -1]" [scale]="5" />
				<bounds-model name="Zeppelin" [position]="[-20, 10, 10]" [rotation]="[3, -1, 3]" [scale]="0.005" />
			</bounds-select-to-zoom>
		</ngts-bounds>

		<ngts-contact-shadows
			[options]="{
				rotation: [Math.PI / 2, 0, 0],
				position: [0, -35, 0],
				opacity: 0.2,
				width: 200,
				height: 200,
				blur: 1,
				far: 50,
			}"
		/>

		<ngts-orbit-controls [options]="{ makeDefault: true, minPolarAngle: 0, maxPolarAngle: Math.PI / 1.75 }" />
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtsBounds, SelectToZoom, Model, NgtsContactShadows, NgtsOrbitControls, NgtArgs],
})
class DefaultBoundsStory {
	protected readonly Math = Math;
}

export default {
	title: 'Staging/Bounds',
	decorators: makeDecorators(),
} as Meta;

export const Default = makeStoryFunction(DefaultBoundsStory, {
	camera: { position: [0, -10, 80], fov: 50 },
	lights: false,
	controls: false,
});
