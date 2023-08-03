import { NgIf, NgTemplateOutlet } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, Component, ContentChild, Input, computed } from '@angular/core';
import { extend, signalStore, type NgtOrthographicCamera } from 'angular-three';
import { Group, OrthographicCamera } from 'three';
import { NgtsCamera, type NgtsCameraState } from '../camera/camera';
import { NgtsCameraContent } from '../camera/camera-content';

extend({ OrthographicCamera, Group });

export type NgtsOrthographicCameraState = {
	left: number;
	top: number;
	right: number;
	bottom: number;
};

declare global {
	interface HTMLElementTagNameMap {
		/**
		 * @extends ngt-orthographic-camera
		 */
		'ngts-orthographic-camera': NgtsCameraState & NgtsOrthographicCameraState & NgtOrthographicCamera;
	}
}

@Component({
	selector: 'ngts-orthographic-camera',
	standalone: true,
	template: `
		<ngt-orthographic-camera
			ngtCompound
			[ref]="cameraRef"
			[left]="cameraLeft()"
			[right]="cameraRight()"
			[top]="cameraTop()"
			[bottom]="cameraBottom()"
		>
			<ng-container
				*ngIf="cameraContent && !cameraContent.ngtsCameraContent"
				[ngTemplateOutlet]="cameraContent.template"
			/>
		</ngt-orthographic-camera>
		<ngt-group #group *ngIf="cameraContent && cameraContent.ngtsCameraContent">
			<ng-container *ngTemplateOutlet="cameraContent.template; context: { fbo: fboRef(), group }" />
		</ngt-group>
	`,
	imports: [NgIf, NgTemplateOutlet],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsOrthographicCamera extends NgtsCamera<THREE.OrthographicCamera> {
	private orthographicInputs = signalStore<NgtsOrthographicCameraState>({
		left: 0,
		right: 0,
		top: 0,
		bottom: 0,
	});

	@ContentChild(NgtsCameraContent) cameraContent?: NgtsCameraContent;

	@Input() set left(left: number) {
		this.orthographicInputs.set({ left });
	}

	@Input() set right(right: number) {
		this.orthographicInputs.set({ right });
	}

	@Input() set top(top: number) {
		this.orthographicInputs.set({ top });
	}

	@Input() set bottom(bottom: number) {
		this.orthographicInputs.set({ bottom });
	}

	private _left = this.orthographicInputs.select('left');
	private _right = this.orthographicInputs.select('right');
	private _top = this.orthographicInputs.select('top');
	private _bottom = this.orthographicInputs.select('bottom');
	private size = this.store.select('size');

	cameraLeft = computed(() => this._left() || this.size().width / -2);
	cameraRight = computed(() => this._right() || this.size().width / 2);
	cameraTop = computed(() => this._top() || this.size().height / 2);
	cameraBottom = computed(() => this._bottom() || this.size().height / -2);
}
