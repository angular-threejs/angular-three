import { NgIf, NgTemplateOutlet } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, Component, ContentChild } from '@angular/core';
import { extend, type NgtPerspectiveCamera } from 'angular-three';
import { Group, PerspectiveCamera } from 'three';
import { NgtsCamera, type NgtsCameraState } from '../camera/camera';
import { NgtsCameraContent } from '../camera/camera-content';

extend({ PerspectiveCamera, Group });

declare global {
	interface HTMLElementTagNameMap {
		/**
		 * @extends ngt-perspective-camera
		 */
		'ngts-perspective-camera': NgtsCameraState & NgtPerspectiveCamera;
	}
}

@Component({
	selector: 'ngts-perspective-camera',
	standalone: true,
	template: `
		<ngt-perspective-camera [ref]="cameraRef" ngtCompound>
			<ng-container
				*ngIf="cameraContent && !cameraContent.ngtsCameraContent"
				[ngTemplateOutlet]="cameraContent.template"
			/>
		</ngt-perspective-camera>
		<ngt-group #group *ngIf="cameraContent && cameraContent.ngtsCameraContent">
			<ng-container *ngTemplateOutlet="cameraContent.template; context: { fbo: fbo(), group }" />
		</ngt-group>
	`,
	imports: [NgIf, NgTemplateOutlet],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsPerspectiveCamera extends NgtsCamera<PerspectiveCamera> {
	@ContentChild(NgtsCameraContent) cameraContent?: NgtsCameraContent;
}
