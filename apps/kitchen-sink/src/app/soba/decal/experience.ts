import {
	ChangeDetectionStrategy,
	Component,
	CUSTOM_ELEMENTS_SCHEMA,
	ElementRef,
	input,
	signal,
	Signal,
	viewChild,
} from '@angular/core';
import { injectBeforeRender, NgtArgs } from 'angular-three';
import { NgtsText } from 'angular-three-soba/abstractions';
import { NgtsPerspectiveCamera } from 'angular-three-soba/cameras';
import { NgtsOrbitControls } from 'angular-three-soba/controls';
import { injectGLTF, injectTexture } from 'angular-three-soba/loaders';
import { NgtsDecal } from 'angular-three-soba/misc';
import {
	NgtsAccumulativeShadows,
	NgtsEnvironment,
	NgtsRandomizedLights,
	NgtsRenderTexture,
	NgtsRenderTextureContent,
} from 'angular-three-soba/staging';
import { Mesh } from 'three';

@Component({
	selector: 'app-dodecahedron',
	standalone: true,
	template: `
		<ngt-group [scale]="scale()" [position]="position()">
			<ngt-mesh
				#mesh
				[scale]="clicked() ? 2.25 : 1.75"
				(click)="$event.stopPropagation(); clicked.set(!clicked())"
				(pointerover)="hovered.set(true)"
				(pointerout)="hovered.set(false)"
			>
				<ngt-dodecahedron-geometry *args="[0.75]" />
				<ngt-mesh-standard-material [color]="hovered() ? 'hotpink' : 'goldenrod'" />
				<ngts-decal [options]="{ polygonOffsetFactor: 0, position: [0, -0.2, 0.5], scale: 0.75, map: texture() }" />
			</ngt-mesh>
		</ngt-group>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtArgs, NgtsDecal],
})
export class Dodecahedron {
	protected Math = Math;

	scale = input(1);
	position = input([0, 0, 0]);

	protected texture = injectTexture(() => './three.png');

	protected clicked = signal(false);
	protected hovered = signal(false);

	private meshRef = viewChild.required<ElementRef<Mesh>>('mesh');

	constructor() {
		injectBeforeRender(({ delta }) => {
			const mesh = this.meshRef().nativeElement;
			mesh.rotation.x += delta;
			mesh.rotation.y += delta;
		});
	}
}

@Component({
	selector: 'app-bunny',
	standalone: true,
	template: `
		@if (gltf(); as gltf) {
			<ngt-mesh [castShadow]="true" [receiveShadow]="true" [geometry]="gltf.nodes.bunny.geometry" [dispose]="null">
				<ngt-mesh-standard-material color="black" />
				<ngts-decal [options]="{ position: [0, 0.9, 0.75], rotation: [-0.4, Math.PI, 0], scale: [0.9, 0.25, 1] }">
					<ngt-mesh-standard-material
						[roughness]="1"
						[transparent]="true"
						[polygonOffset]="true"
						[polygonOffsetFactor]="-1"
					>
						<ngts-render-texture>
							<ng-template renderTextureContent>
								<ngts-perspective-camera
									[options]="{ makeDefault: true, manual: true, aspect: 0.9 / 0.25, position: [0, 0, 5] }"
								/>
								<ngt-color attach="background" *args="['#af2040']" />
								<ngt-ambient-light [intensity]="Math.PI" />
								<ngt-directional-light [position]="[10, 10, 5]" />
								<ngts-text
									text="hello from soba"
									[options]="{ rotation: [0, Math.PI, 0], fontSize: 4, color: 'white' }"
								/>
								<app-dodecahedron />
							</ng-template>
						</ngts-render-texture>
					</ngt-mesh-standard-material>
				</ngts-decal>
			</ngt-mesh>
		}
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [
		NgtsDecal,
		NgtsRenderTexture,
		NgtsRenderTextureContent,
		NgtsPerspectiveCamera,
		NgtArgs,
		NgtsText,
		Dodecahedron,
	],
})
export class Bunny {
	protected readonly Math = Math;

	protected gltf = injectGLTF(() => './bunny-transformed.glb') as Signal<any | null>;

	private textRef = viewChild(NgtsText);

	constructor() {
		injectBeforeRender(({ clock }) => {
			const text = this.textRef()?.troikaMesh;
			if (text) {
				text.position.x = Math.sin(clock.elapsedTime) * 6.5;
			}
		});
	}
}

@Component({
	standalone: true,
	template: `
		<ngt-color attach="background" *args="['#f0f0f0']" />
		<ngt-ambient-light [intensity]="0.25 * Math.PI" />
		<ngt-spot-light [decay]="0" [position]="[10, 10, 10]" [angle]="0.15" [penumbra]="1" />
		<ngt-point-light [decay]="0" [position]="[-10, 0, -5]" [intensity]="6" />
		<ngt-group [position]="[0, -0.75, 0]">
			<app-bunny />
			<app-dodecahedron [position]="[-0.9, 2, 0.4]" [scale]="0.1" />
			<ngts-accumulative-shadows
				[options]="{ frames: 80, color: 'black', opacity: 1, scale: 12, position: [0, 0.04, 0], alphaTest: 0.65 }"
			>
				<ngts-randomized-lights [options]="{ amount: 8, radius: 5, position: [5, 5, -10], bias: 0.001 }" />
			</ngts-accumulative-shadows>
		</ngt-group>
		<ngts-environment
			[options]="{
				files: 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/dancing_hall_1k.hdr',
				background: true,
				blur: 1,
			}"
		/>
		<ngts-orbit-controls [options]="{ makeDefault: true }" />
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'decal-soba-experience' },
	imports: [
		NgtArgs,
		Bunny,
		Dodecahedron,
		NgtsAccumulativeShadows,
		NgtsRandomizedLights,
		NgtsEnvironment,
		NgtsOrbitControls,
	],
})
export class Experience {
	protected Math = Math;
}
