import { NgFor, NgIf, NgTemplateOutlet } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, Component, ContentChild, Input, TemplateRef, computed, signal } from '@angular/core';
import { NgtArgs, injectNgtRef } from 'angular-three';
import { NgtsPerspectiveCamera } from 'angular-three-soba/cameras';
import { NgtsOrbitControls } from 'angular-three-soba/controls';
import { injectNgtsTextureLoader } from 'angular-three-soba/loaders';
import { NgtsDecal, NgtsSurfaceSamplerTransformFn, injectNgtsSurfaceSampler } from 'angular-three-soba/misc';
import * as THREE from 'three';
import { makeDecorators, makeStoryObject } from '../setup-canvas';

@Component({
	selector: 'decal-loop-over-instanced-buffer-attribute',
	standalone: true,
	template: `
		<ng-container
			*ngFor="let attribute of attributes()"
			[ngTemplateOutlet]="template"
			[ngTemplateOutletContext]="{ attribute }"
		/>
	`,
	imports: [NgTemplateOutlet, NgFor],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class LoopOverInstancedBufferAttribute {
	@ContentChild(TemplateRef, { static: true }) template!: TemplateRef<unknown>;

	private _buffer = signal<THREE.InstancedBufferAttribute | null>(null);
	@Input() set buffer(buffer: THREE.InstancedBufferAttribute) {
		this._buffer.set(buffer);
	}

	private m = new THREE.Matrix4();
	attributes = computed(() => {
		const buffer = this._buffer();
		if (!buffer) return [];
		return Array.from({ length: buffer.count }, (_, index) => {
			const p = new THREE.Vector3();
			const q = new THREE.Quaternion();
			const r = new THREE.Euler();
			const s = new THREE.Vector3();

			this.m.fromArray(buffer.array, index * 16);
			this.m.decompose(p, q, s);
			r.setFromQuaternion(q);

			return { position: p, rotation: r, scale: s };
		});
	});
}

@Component({
	standalone: true,
	template: `
		<ngts-orbit-controls [makeDefault]="true" [autoRotate]="true" [autoRotateSpeed]="0.75" />
		<ngts-perspective-camera [makeDefault]="true" [position]="6" />

		<ngt-directional-light [position]="[1, -1, 1]" />

		<ngt-mesh [ref]="ref">
			<ngt-sphere-geometry *args="[3, 32, 32]" />
			<ngt-mesh-physical-material color="tomato" [roughness]="0.5" />
		</ngt-mesh>

		<decal-loop-over-instanced-buffer-attribute [buffer]="buffer()">
			<ng-template let-a="attribute">
				<ngts-decal [mesh]="ref" [position]="a.position" [rotation]="a.rotation" [scale]="a.scale">
					<ngt-mesh-physical-material
						[roughness]="0.2"
						[transparent]="true"
						[depthTest]="false"
						[map]="map()"
						[alphaTest]="0"
						[polygonOffset]="true"
						[polygonOffsetFactor]="-10"
					/>
				</ngts-decal>
			</ng-template>
		</decal-loop-over-instanced-buffer-attribute>
	`,
	imports: [NgtsDecal, LoopOverInstancedBufferAttribute, NgtsOrbitControls, NgtsPerspectiveCamera, NgtArgs, NgIf],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class DefaultDecalStory {
	Math = Math;

	ref = injectNgtRef<THREE.Mesh>();

	private transformFn: NgtsSurfaceSamplerTransformFn = ({ dummy, position, normal }) => {
		const p = new THREE.Vector3();
		p.copy(position);

		const r = new THREE.Euler();
		r.x = Math.random() * Math.PI;

		dummy.position.copy(position);
		dummy.rotation.copy(r);
		dummy.lookAt(p.add(normal));
	};

	buffer = injectNgtsSurfaceSampler(() => ({ mesh: this.ref, count: 50, transform: this.transformFn }));

	private textures = injectNgtsTextureLoader(() => ({
		angular: 'soba/decals/angular.png',
		three: 'soba/decals/ngt-logo.png',
	}));

	map = () => {
		const textures = this.textures();
		if (!textures) return null;
		return Math.random() > 0.5 ? textures.angular : textures.three;
	};
}

export default {
	title: 'Misc/Decal',
	decorators: makeDecorators(),
};

export const Default = makeStoryObject(DefaultDecalStory, {
	canvasOptions: { camera: { position: [0, 0, 5] } },
});
