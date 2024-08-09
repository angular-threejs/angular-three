import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, viewChild } from '@angular/core';
import { Meta } from '@storybook/angular';
import { injectBeforeRender } from 'angular-three';
import { NgtsPerspectiveCamera } from 'angular-three-soba/cameras';
import { BoxHelper, CameraHelper } from 'three';
import { VertexNormalsHelper } from 'three-stdlib';
import { NgtsHelper } from '../../abstractions/src/lib/helper';
import { makeDecorators, makeStoryFunction } from '../setup-canvas';

@Component({
	standalone: true,
	template: `
		<ngts-perspective-camera [options]="{ makeDefault: false, position: [0, 3, 3], near: 1, far: 4 }">
			<ng-template>
				<ngt-mesh-basic-material />
				<ngts-helper [type]="CameraHelper" />
			</ng-template>
		</ngts-perspective-camera>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtsPerspectiveCamera, NgtsHelper],
})
class CameraHelperStory {
	protected readonly CameraHelper = CameraHelper;

	perspectiveCamera = viewChild.required(NgtsPerspectiveCamera);

	constructor() {
		injectBeforeRender(({ clock }) => {
			const camera = this.perspectiveCamera().cameraRef().nativeElement;

			const t = clock.getElapsedTime();

			camera.lookAt(0, 0, 0);
			camera.position.x = Math.sin(t) * 4;
			camera.position.z = Math.cos(t) * 4;
		});
	}
}

@Component({
	standalone: true,
	template: `
		<ngt-mesh>
			<ngt-sphere-geometry />
			<ngt-mesh-basic-material />

			<ngts-helper [type]="BoxHelper" [options]="['royalblue']" />
			<ngts-helper [type]="VertexNormalsHelper" [options]="[1, '#ff0000']" />
		</ngt-mesh>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtsHelper],
})
class DefaultHelperStory {
	protected readonly BoxHelper = BoxHelper;
	protected readonly VertexNormalsHelper = VertexNormalsHelper;
}

export default {
	title: 'Abstractions/Helper',
	decorators: makeDecorators(),
} as Meta;

export const Default = makeStoryFunction(DefaultHelperStory);
export const Camera = makeStoryFunction(CameraHelperStory);
