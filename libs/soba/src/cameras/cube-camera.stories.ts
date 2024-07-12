import {
	ChangeDetectionStrategy,
	Component,
	CUSTOM_ELEMENTS_SCHEMA,
	ElementRef,
	input,
	viewChild,
} from '@angular/core';
import { Meta } from '@storybook/angular';
import { injectBeforeRender, merge, NgtArgs } from 'angular-three';
import { NgtsCameraContent, NgtsCubeCamera, NgtsCubeCameraOptions } from 'angular-three-soba/cameras';
import { Mesh } from 'three';
import { makeDecorators, makeStoryFunction } from '../setup-canvas';

@Component({
	selector: 'cube-camera-sphere',
	standalone: true,
	template: `
		<ngts-cube-camera [options]="options()">
			<ngt-mesh *cameraContent="let texture" #mesh>
				<ngt-sphere-geometry *args="[5, 64, 64]" />
				<ngt-mesh-standard-material [roughness]="0" [metalness]="1" [envMap]="texture()" />
			</ngt-mesh>
		</ngts-cube-camera>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtsCubeCamera, NgtsCameraContent, NgtArgs],
})
class Sphere {
	options = input({} as NgtsCubeCameraOptions);
	offset = input(0);

	mesh = viewChild<ElementRef<Mesh>>('mesh');

	constructor() {
		injectBeforeRender(({ clock }) => {
			const mesh = this.mesh()?.nativeElement;
			if (!mesh) return;
			mesh.position.y = Math.sin(this.offset() + clock.elapsedTime) * 5;
		});
	}
}

@Component({
	standalone: true,
	template: `
		<ngt-fog *args="['#f0f0f0', 100, 200]" attach="fog" />

		<cube-camera-sphere [options]="options1()" />
		<cube-camera-sphere [options]="options2()" [offset]="2000" />

		<ngt-mesh [position]="[0, 2.5, 0]">
			<ngt-box-geometry *args="[5, 5, 5]" />
			<ngt-mesh-basic-material color="hotpink" />
		</ngt-mesh>

		<ngt-grid-helper *args="[100, 10]" />
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	imports: [NgtArgs, Sphere],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
class DefaultCubeCameraStory {
	options = input({} as NgtsCubeCameraOptions);

	options1 = merge(this.options, { position: [-10, 10, 0] }, 'backfill');
	options2 = merge(this.options, { position: [10, 9, 0] }, 'backfill');
}

export default {
	title: 'Camera/CubeCamera',
	decorators: makeDecorators(),
} as Meta;

export const Default = makeStoryFunction(DefaultCubeCameraStory, {
	camera: { position: [0, 10, 40] },
});
