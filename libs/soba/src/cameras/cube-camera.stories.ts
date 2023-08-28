import { CUSTOM_ELEMENTS_SCHEMA, Component, Input } from '@angular/core';
import { NgtArgs, type NgtBeforeRenderEvent } from 'angular-three';
import { NgtsCubeCamera, NgtsCubeCameraContent } from 'angular-three-soba/cameras';
import { makeDecorators, makeStoryObject } from '../setup-canvas';

@Component({
	selector: 'cube-camera-sphere',
	standalone: true,
	template: `
		<ngts-cube-camera [position]="position">
			<ngt-mesh *ngtsCubeCameraContent="''; texture as texture" (beforeRender)="onBeforeRender($event)">
				<ngt-sphere-geometry *args="[5, 64, 64]" />
				<ngt-mesh-standard-material [roughness]="0" [metalness]="1" [envMap]="texture()" />
			</ngt-mesh>
		</ngts-cube-camera>
	`,
	imports: [NgtsCubeCamera, NgtsCubeCameraContent, NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class Sphere {
	@Input() position = [0, 0, 0];
	@Input() offset = 0;

	onBeforeRender({ object, state: { clock } }: NgtBeforeRenderEvent<THREE.Mesh>) {
		object.position.y = Math.sin(this.offset + clock.elapsedTime) * 5;
	}
}

@Component({
	standalone: true,
	template: `
		<ngt-fog attach="fog" *args="['#f0f0f0', 100, 200]" />

		<cube-camera-sphere [position]="[-10, 10, 0]" />
		<cube-camera-sphere [position]="[10, 9, 0]" [offset]="2000" />

		<ngt-mesh>
			<ngt-box-geometry *args="[5, 5, 5]" [position]="[0, 2.5, 0]" />
			<ngt-mesh-basic-material color="hotpink" />
		</ngt-mesh>

		<ngt-grid-helper *args="[100, 10]" />
	`,
	imports: [NgtArgs, Sphere],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class DefaultCubeCameraStory {}

export default {
	title: 'Camera/CubeCamera',
	decorators: makeDecorators(),
};

export const Default = makeStoryObject(DefaultCubeCameraStory, {
	canvasOptions: { camera: { position: [0, 10, 40] } },
});
