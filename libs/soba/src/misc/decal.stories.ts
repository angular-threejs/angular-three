import { NgTemplateOutlet } from '@angular/common';
import {
	ChangeDetectionStrategy,
	Component,
	computed,
	contentChild,
	CUSTOM_ELEMENTS_SCHEMA,
	ElementRef,
	input,
	TemplateRef,
	viewChild,
} from '@angular/core';
import { Meta } from '@storybook/angular';
import { NgtArgs } from 'angular-three';
import { NgtsPerspectiveCamera } from 'angular-three-soba/cameras';
import { NgtsOrbitControls } from 'angular-three-soba/controls';
import { textureResource } from 'angular-three-soba/loaders';
import { NgtsDecal, surfaceSampler } from 'angular-three-soba/misc';
import { Euler, InstancedBufferAttribute, Matrix4, Mesh, Quaternion, Vector3 } from 'three';
import { storyDecorators, storyFunction } from '../setup-canvas';

@Component({
	selector: 'decal-loop-over-instanced-buffer-attribute',
	template: `
		@for (attribute of attributes(); track $index) {
			<ng-container [ngTemplateOutlet]="content()" [ngTemplateOutletContext]="{ $implicit: attribute }" />
		}
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgTemplateOutlet],
})
class LoopOverInstancedBufferAttribute {
	content = contentChild.required(TemplateRef);
	buffer = input<InstancedBufferAttribute | null>();

	matrix = new Matrix4();

	attributes = computed(() => {
		const buffer = this.buffer();
		if (!buffer) return [];
		return Array.from({ length: buffer.count }, (_, index) => {
			const p = new Vector3();
			const q = new Quaternion();
			const r = new Euler();
			const s = new Vector3();

			this.matrix.fromArray(buffer.array, index * 16);
			this.matrix.decompose(p, q, s);
			r.setFromQuaternion(q);

			return { position: p, rotation: r, scale: s };
		});
	});
}

@Component({
	template: `
		<ngts-orbit-controls [options]="{ makeDefault: true, autoRotate: true, autoRotateSpeed: 0.75 }" />
		<ngts-perspective-camera [options]="{ makeDefault: true, position: [6, 6, 6] }" />

		<ngt-directional-light [position]="[1, -1, 1]" [intensity]="Math.PI" />

		<ngt-mesh #mesh>
			<ngt-sphere-geometry *args="[3, 32, 32]" />
			<ngt-mesh-physical-material color="tomato" [roughness]="0.5" />
		</ngt-mesh>

		@if (decals.value(); as decals) {
			<decal-loop-over-instanced-buffer-attribute [buffer]="bufferAttribute()">
				<ngts-decal *="let options" [mesh]="meshRef()" [options]="options">
					<ngt-mesh-physical-material
						[roughness]="0.2"
						transparent
						[depthTest]="false"
						[map]="Math.random() > 0.5 ? decals.reactMap : decals.threeMap"
						[alphaTest]="0"
						polygonOffset
						[polygonOffsetFactor]="-10"
					/>
				</ngts-decal>
			</decal-loop-over-instanced-buffer-attribute>
		}
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtsOrbitControls, NgtsPerspectiveCamera, NgtArgs, LoopOverInstancedBufferAttribute, NgtsDecal],
})
class DefaultDecalStory {
	protected readonly Math = Math;

	decals = textureResource(() => ({
		reactMap: './decals/react.png',
		threeMap: './decals/three.png',
	}));

	meshRef = viewChild.required<ElementRef<Mesh>>('mesh');
	bufferAttribute = surfaceSampler(this.meshRef, {
		count: () => 50,
		transform: () => {
			return ({ dummy, position, normal }) => {
				const p = new Vector3();
				p.copy(position);
				const r = new Euler();
				r.x = Math.random() * Math.PI;
				dummy.position.copy(position);
				dummy.rotation.copy(r);
				dummy.lookAt(p.add(normal));
			};
		},
	});
}

export default {
	title: 'Misc/Decal',
	decorators: storyDecorators(),
} as Meta;

export const Default = storyFunction(DefaultDecalStory, {
	camera: { position: [0, 0, 5] },
});
