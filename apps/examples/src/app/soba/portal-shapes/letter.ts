import {
	booleanAttribute,
	ChangeDetectionStrategy,
	Component,
	contentChild,
	CUSTOM_ELEMENTS_SCHEMA,
	ElementRef,
	input,
	signal,
	TemplateRef,
	viewChild,
} from '@angular/core';
import {
	beforeRender,
	injectStore,
	NgtArgs,
	NgtEuler,
	NgtObjectEvents,
	NgtThreeEvent,
	NgtVector3,
} from 'angular-three';
import { NgtrRigidBody } from 'angular-three-rapier';
import { NgtsText3D } from 'angular-three-soba/abstractions';
import { NgtsMeshTransmissionMaterial } from 'angular-three-soba/materials';
import { NgtsCenter, NgtsRenderTexture } from 'angular-three-soba/staging';
import { Group } from 'three';

import { NgTemplateOutlet } from '@angular/common';
import CameraControls from 'camera-controls';
import boldFont from './bold.blob';

@Component({
	selector: 'app-letter',
	template: `
		<ngt-object3D
			rigidBody
			[options]="{ restitution: 0.1, colliders: 'cuboid' }"
			[position]="position()"
			[rotation]="rotation()"
		>
			<ngts-center>
				<ngts-text-3d
					#text3D
					[ngtObjectEvents]="text3D.meshRef()"
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
					(dblclick)="onDblClick($any($event))"
				>
					<ngts-mesh-transmission-material
						[options]="
							$any({
								clearcoat: 1,
								samples: 3,
								thickness: 40,
								chromaticAberration: 0.25,
								anisotropy: 0.4,
							})
						"
					>
						<!--Render a portalled scene into the "buffer" attribute of transmission material, which is a texture.-->
						<!--Since we're moving the contents with the letter shape in world space we take the standard event compute-->
						<ngts-render-texture
							attach="buffer"
							[options]="{
								stencilBuffer: stencilBuffer(),
								width: 512,
								height: 512,
								compute: $any(eventsCompute?.()),
							}"
						>
							<!--Everything in here is self-contained, behaves like a regular canvas, but we're *in* the texture-->
							<ng-template renderTextureContent let-injector="injector">
								<ngt-color attach="background" *args="['#4899c9']" />
								<ngt-group #contents [matrixAutoUpdate]="false">
									<ng-container
										[ngTemplateOutlet]="content()"
										[ngTemplateOutletInjector]="injector"
									/>
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
		NgtArgs,
		NgTemplateOutlet,
		NgtObjectEvents,
	],
})
export class Letter {
	protected readonly boldFont: string = boldFont;

	char = input.required<string>();
	stencilBuffer = input(false, { transform: booleanAttribute });
	position = input<NgtVector3>([0, 0, 0]);
	rotation = input<NgtEuler>([0, 0, 0]);

	private centerRef = viewChild.required(NgtsCenter);
	private contentsRef = viewChild<ElementRef<Group>>('contents');

	protected content = contentChild.required(TemplateRef);

	private store = injectStore();
	protected eventsCompute = this.store.events.compute;

	private focused = signal(false);

	constructor() {
		beforeRender(() => {
			const contents = this.contentsRef()?.nativeElement;
			if (!contents) return;
			// The letters contents are moved to its whereabouts in world coordinates
			contents.matrix.copy(this.centerRef().groupRef().nativeElement.matrixWorld);
		});
	}

	onDblClick(event: NgtThreeEvent<MouseEvent>) {
		event.stopPropagation();
		const controls = this.store.snapshot.controls as CameraControls;
		if (!controls) return;

		if (this.focused()) {
			void controls.reset(true);
		} else {
			// NOTE: if any of the render-texture scene has other controls, it messes this up
			void controls.fitToBox(this.centerRef().groupRef().nativeElement, true);
		}

		this.focused.update((v) => !v);
	}
}
