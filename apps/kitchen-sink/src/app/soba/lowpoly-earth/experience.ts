import { NgTemplateOutlet } from '@angular/common';
import {
	ChangeDetectionStrategy,
	Component,
	computed,
	contentChild,
	CUSTOM_ELEMENTS_SCHEMA,
	ElementRef,
	input,
	signal,
	Signal,
	TemplateRef,
	viewChild,
} from '@angular/core';
import { injectBeforeRender, NgtArgs, NgtEuler, NgtHTML, NgtVector3 } from 'angular-three';
import { NgtsOrbitControls } from 'angular-three-soba/controls';
import { injectGLTF } from 'angular-three-soba/loaders';
import { NgtsHTML, NgtsHTMLContent } from 'angular-three-soba/misc';
import { NgtsContactShadows, NgtsEnvironment } from 'angular-three-soba/staging';
import { Group, Vector3 } from 'three';

@Component({
	selector: 'app-marker',
	standalone: true,
	template: `
		<ngt-group #group>
			<ngts-html [options]="{ transform: true, occlude: true, position: position(), rotation: rotation() }">
				<div [ngtsHTMLContent]="{ containerStyle: containerStyle() }" (occluded)="isOccluded.set($event)">
					<ng-content />
				</div>
			</ngts-html>
		</ngt-group>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtsHTML, NgtsHTMLContent],
})
export class Marker {
	position = input<NgtVector3>([0, 0, 0]);
	rotation = input<NgtEuler>([0, 0, 0]);

	private groupRef = viewChild.required<ElementRef<Group>>('group');

	protected isOccluded = signal(false);
	private isInRange = signal(false);

	private isVisible = computed(() => !this.isOccluded() && this.isInRange());
	protected containerStyle = computed(() => ({
		transition: 'all 0.2s',
		opacity: this.isVisible() ? '1' : '0',
		transform: `scale(${this.isVisible() ? 1 : 0.25})`,
	}));

	constructor() {
		const v = new Vector3();
		injectBeforeRender(({ camera }) => {
			const range = camera.position.distanceTo(this.groupRef().nativeElement.getWorldPosition(v)) <= 10;
			if (range !== this.isInRange()) this.isInRange.set(range);
		});
	}
}

@Component({
	selector: 'app-marker-icon',
	standalone: true,
	template: `
		@if (withText()) {
			<div style="position: absolute; font-size: 10px; letter-spacing: -0.5px; left: 17.5px">north</div>
		}
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="size-5" [class]="color()">
			<path
				fill-rule="evenodd"
				d="m9.69 18.933.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 0 0 .281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 1 0 3 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 0 0 2.273 1.765 11.842 11.842 0 0 0 .976.544l.062.029.018.008.006.003ZM10 11.25a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z"
				clip-rule="evenodd"
			/>
		</svg>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MarkerIcon extends NgtHTML {
	color = input<string>('text-orange-500');
	withText = input(false);
}

@Component({
	selector: 'app-model',
	standalone: true,
	template: `
		@if (gltf(); as gltf) {
			<ngt-group [rotation]="[-Math.PI / 2, 0, Math.PI]" [position]="position()" [dispose]="null">
				<ngt-mesh [geometry]="gltf.nodes['URF-Height_Lampd_Ice_0'].geometry" [material]="gltf.materials.Lampd_Ice" />
				<ngt-mesh [geometry]="gltf.nodes['URF-Height_watr_0'].geometry" [material]="gltf.materials.watr">
					<ngt-value [rawValue]="0" attach="material.roughness" />
				</ngt-mesh>
				<ngt-mesh [geometry]="gltf.nodes['URF-Height_Lampd_0'].geometry" [material]="gltf.materials.Lampd">
					<ngt-value [rawValue]="'lightgreen'" attach="material.color" />

					<app-marker [position]="[0, 1.3, 0]" [rotation]="[0, Math.PI / 2, 0]">
						<app-marker-icon color="text-orange-500" />
					</app-marker>

					<ngt-group [position]="[0, 0, 1.3]" [rotation]="[0, 0, Math.PI]">
						<app-marker [rotation]="[0, Math.PI / 2, Math.PI / 2]">
							<app-marker-icon color="text-red-500" [withText]="true" />
						</app-marker>
					</ngt-group>
				</ngt-mesh>
			</ngt-group>

			<ng-container [ngTemplateOutlet]="content()" />
		}
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [Marker, MarkerIcon, NgTemplateOutlet],
})
export class Model {
	protected Math = Math;

	position = input<NgtVector3>([0, 0, 0]);

	protected content = contentChild.required(TemplateRef);

	protected gltf = injectGLTF(() => './earth.gltf') as Signal<any>;
}

@Component({
	standalone: true,
	template: `
		<ngt-color *args="['#ececec']" attach="background" />
		<ngt-ambient-light [intensity]="0.5" />
		<app-model [position]="[0, 0.25, 0]">
			<ngts-contact-shadows
				*
				[options]="{ frames: 1, scale: 5, position: [0, -1, 0], far: 1, blur: 5, color: '#204080' }"
			/>
		</app-model>
		<ngts-environment [options]="{ preset: 'city' }" />
		<ngts-orbit-controls [options]="{ autoRotate: true }" />
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [Model, NgtsEnvironment, NgtsContactShadows, NgtsOrbitControls, NgtArgs],
})
export class Experience {
	protected Math = Math;
}

injectGLTF.preload(() => './earth.gltf');
