import {
	ChangeDetectionStrategy,
	Component,
	contentChild,
	CUSTOM_ELEMENTS_SCHEMA,
	ElementRef,
	input,
	TemplateRef,
	viewChild,
} from '@angular/core';
import { injectBeforeRender, injectStore, NgtArgs, NgtEuler, NgtThreeEvent, NgtVector3 } from 'angular-three';
import { NgtrRigidBody } from 'angular-three-rapier';
import { NgtsText3D } from 'angular-three-soba/abstractions';
import { NgtsMeshTransmissionMaterial } from 'angular-three-soba/materials';
import { NgtsCenter, NgtsRenderTexture, NgtsRenderTextureContent } from 'angular-three-soba/staging';
import { Group } from 'three';

import { NgTemplateOutlet } from '@angular/common';
import CameraControls from 'camera-controls';
import boldFont from './bold.blob';

@Component({
	selector: 'app-letter',
	standalone: true,
	template: `
		<ngt-object3D
			ngtrRigidBody
			[options]="{ restitution: 0.1, colliders: 'cuboid' }"
			[position]="position()"
			[rotation]="rotation()"
			(dblclick)="onDblClick($any($event))"
			(pointermissed)="onPointerMissed($any($event))"
		>
			<ngts-center>
				<ngts-text-3d
					[text]="char()"
					[font]="boldFont"
					[options]="{
						bevelEnabled: true,
						smooth: 1,
						scale: 0.125,
						size: 80,
						height: 4,
						curveSegments: 10,
						bevelThickness: 10,
						bevelSize: 2,
						bevelOffset: 0,
					}"
				>
					<ngts-mesh-transmission-material
						[options]="$any({ clearcoat: 1, samples: 3, thickness: 40, chromaticAberration: 0.25, anisotropy: 0.4 })"
					>
						<!--Render a portalled scene into the "buffer" attribute of transmission material, which is a texture.-->
						<!--Since we're moving the contents with the letter shape in world space we take the standard event compute-->
						<ngts-render-texture
							attach="buffer"
							[options]="{ stencilBuffer: stencilBuffer(), width: 512, height: 512, compute: $any(eventsCompute()) }"
						>
							<!--Everything in here is self-contained, behaves like a regular canvas, but we're *in* the texture-->
							<ng-template renderTextureContent let-injector="injector">
								<ngt-color attach="background" *args="['#4899c9']" />
								<ngt-group #contents [matrixAutoUpdate]="false">
									<ng-container [ngTemplateOutlet]="content()" [ngTemplateOutletInjector]="injector" />
								</ngt-group>
							</ng-template>
						</ngts-render-texture>
					</ngts-mesh-transmission-material>
				</ngts-text-3d>
			</ngts-center>
		</ngt-object3D>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [
		NgtrRigidBody,
		NgtsCenter,
		NgtsText3D,
		NgtsMeshTransmissionMaterial,
		NgtsRenderTexture,
		NgtsRenderTextureContent,
		NgtArgs,
		NgTemplateOutlet,
	],
})
export class Letter {
	protected readonly boldFont: string = boldFont;

	char = input.required<string>();
	stencilBuffer = input(false);
	position = input<NgtVector3>([0, 0, 0]);
	rotation = input<NgtEuler>([0, 0, 0]);

	private centerRef = viewChild.required(NgtsCenter);
	private contentsRef = viewChild<ElementRef<Group>>('contents');

	protected content = contentChild.required(TemplateRef);

	private store = injectStore();
	private controls = this.store.select('controls');
	protected eventsCompute = this.store.select('events', 'compute');

	constructor() {
		injectBeforeRender(() => {
			const contents = this.contentsRef()?.nativeElement;
			if (!contents) return;
			// The letters contents are moved to its whereabouts in world coordinates
			contents.matrix.copy(this.centerRef().groupRef().nativeElement.matrixWorld);
		});
	}

	onDblClick(event: NgtThreeEvent<MouseEvent>) {
		event.stopPropagation();
		const controls = this.controls() as CameraControls;
		if (!controls) return;

		// TODO: not sure why this is not working as expected.
		//  This is supposed to zoom to the center of the letter, but it's always zooming to the center of the scene
		void controls.fitToBox(this.centerRef().groupRef().nativeElement, true);
	}

	onPointerMissed(event: NgtThreeEvent<MouseEvent>) {
		event.stopPropagation();
		const controls = this.controls() as CameraControls;
		if (!controls) return;

		void controls.reset(true);
	}
}
