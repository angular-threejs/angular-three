import { NgIf } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, Component, effect, inject, signal, untracked } from '@angular/core';
import { NgtRef, extend, injectNgtRef, is } from 'angular-three';
import {
	WireframeMaterial,
	WireframeMaterialShaders,
	injectNgtsWireframeUniforms,
	setWireframeOverride,
} from 'angular-three-soba/shaders';
import * as THREE from 'three';
import { Object3D } from 'three';
import { NgtsWireframeInput, NgtsWireframeState } from './wireframe-input';

extend({ WireframeMaterial, Object3D });

type WithGeometry =
	| THREE.Mesh<THREE.BufferGeometry, THREE.Material>
	| THREE.Line<THREE.BufferGeometry, THREE.Material>
	| THREE.Points<THREE.BufferGeometry, THREE.Material>;

function isWithGeometry(object?: THREE.Object3D | null): object is WithGeometry {
	return !!(object as THREE.Mesh)?.geometry;
}

function isWireframeGeometry(geometry: any): geometry is THREE.WireframeGeometry {
	return (geometry as THREE.WireframeGeometry).type === 'WireframeGeometry';
}

function getUniforms() {
	const u: Record<string, any> = {};
	for (const key in WireframeMaterialShaders.uniforms) {
		u[key] = { value: (WireframeMaterialShaders.uniforms as any)[key] };
	}
	return u;
}

function getBarycentricCoordinates(geometry: THREE.BufferGeometry, removeEdge?: boolean) {
	const position = geometry.getAttribute('position');
	const count = position.count;

	const barycentric: number[] = [];

	for (let i = 0; i < count; i++) {
		const even = i % 2 === 0;
		const Q = removeEdge ? 1 : 0;
		if (even) {
			barycentric.push(0, 0, 1, 0, 1, 0, 1, 0, Q);
		} else {
			barycentric.push(0, 1, 0, 0, 0, 1, 1, 0, Q);
		}
	}

	return new THREE.BufferAttribute(Float32Array.from(barycentric), 3);
}

function getInputGeometry(inputGeometry: NgtRef<THREE.BufferGeometry | THREE.Object3D>) {
	const geo = (is.ref(inputGeometry) ? inputGeometry.nativeElement : inputGeometry)!;

	if (!is.geometry(geo)) {
		// Disallow WireframeGeometry
		if (isWireframeGeometry(geo)) {
			throw new Error('Wireframe: WireframeGeometry is not supported.');
		}

		const parent = geo.parent;
		if (isWithGeometry(parent)) {
			// Disallow WireframeGeometry
			if (isWireframeGeometry(parent.geometry)) {
				throw new Error('Wireframe: WireframeGeometry is not supported.');
			}

			return parent.geometry;
		}
	} else {
		return geo;
	}

	return;
}

function setBarycentricCoordinates(geometry: THREE.BufferGeometry, simplify: boolean) {
	if (geometry.index) {
		console.warn('[NGT]: ngts-wireframe requires non-indexed geometry, converting to non-indexed geometry.');
		const nonIndexedGeo = geometry.toNonIndexed();

		geometry.copy(nonIndexedGeo);
		geometry.setIndex(null);
	}

	const newBarycentric = getBarycentricCoordinates(geometry, simplify);

	geometry.setAttribute('barycentric', newBarycentric);
}

@Component({
	selector: 'ngts-wireframe-without-custom-geometry',
	standalone: true,
	template: `<ngt-object3D [ref]="objectRef" />`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsWireframeWithoutCustomGeometry {
	objectRef = injectNgtRef<THREE.Object3D>();

	private wireframeInput = inject(NgtsWireframeInput);
	private uniforms = getUniforms();

	constructor() {
		injectNgtsWireframeUniforms(() => this.uniforms, this.wireframeInput.materialState);
		effect((onCleanup) => {
			const object = this.objectRef.nativeElement;
			if (!object) return;
			const simplify = this.wireframeInput.simplify();
			const geometry = getInputGeometry(object);
			if (!geometry) {
				throw new Error(
					'[NGT]: ngts-wireframe must be a child of a Mesh, Line or Points object or specify a geometry prop.',
				);
			}
			const cloned = geometry.clone();

			setBarycentricCoordinates(geometry, simplify);

			onCleanup(() => {
				geometry.copy(cloned);
				cloned.dispose();
			});
		});

		effect((onCleanup) => {
			const object = this.objectRef.nativeElement;
			if (!object) return;
			const parentMesh = object.parent as THREE.Mesh<THREE.BufferGeometry, THREE.Material>;
			const cloned = parentMesh.material.clone();

			setWireframeOverride(parentMesh.material, this.uniforms);

			onCleanup(() => {
				parentMesh.material.dispose();
				parentMesh.material = cloned;
			});
		});
	}
}

@Component({
	selector: 'ngts-wireframe-with-custom-geometry',
	standalone: true,
	template: `
		<ngt-mesh *ngIf="drawnGeometry() as geometry" [geometry]="geometry">
			<ngt-wireframe-material
				attach="material"
				[transparent]="true"
				[side]="DoubleSide"
				[polygonOffset]="true"
				[polygonOffsetFactor]="-4"
				[extensions]="{ derivatives: true, fragDepth: false, drawBuffers: false, shaderTextureLOD: false }"
				[strokeOpacity]="wireframeInput.strokeOpacity()"
				[fillOpacity]="wireframeInput.fillOpacity()"
				[fillMix]="wireframeInput.fillMix()"
				[thickness]="wireframeInput.thickness()"
				[colorBackfaces]="wireframeInput.colorBackfaces()"
				[dashInvert]="wireframeInput.dashInvert()"
				[dash]="wireframeInput.dash()"
				[dashRepeats]="wireframeInput.dashRepeats()"
				[dashLength]="wireframeInput.dashLength()"
				[squeeze]="wireframeInput.squeeze()"
				[squeezeMin]="wireframeInput.squeezeMin()"
				[squeezeMax]="wireframeInput.squeezeMax()"
				[stroke]="wireframeInput.stroke()"
				[backfaceStroke]="wireframeInput.backfaceStroke()"
				[fill]="wireframeInput.fill()"
			/>
		</ngt-mesh>
	`,
	imports: [NgIf],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsWireframeWithCustomGeometry {
	DoubleSide = THREE.DoubleSide;

	wireframeInput = inject(NgtsWireframeInput);
	drawnGeometry = signal<THREE.BufferGeometry>(this.wireframeInput.customGeometry()!);

	constructor() {
		effect(() => {
			const [simplify, customGeometry] = [this.wireframeInput.simplify(), this.wireframeInput.geometry()];
			const geometry = getInputGeometry(customGeometry!);
			if (!geometry) {
				throw new Error(
					'[NGT]: ngts-wireframe [geometry] input must be a BufferGeometry or a ref to a BufferGeometry.',
				);
			}

			setBarycentricCoordinates(geometry, simplify);

			if (is.ref(customGeometry)) {
				untracked(() => this.drawnGeometry.set(geometry));
			}
		});
	}
}

declare global {
	interface HTMLElementTagNameMap {
		'ngts-wireframe': NgtsWireframeState;
	}
}

@Component({
	selector: 'ngts-wireframe',
	standalone: true,
	template: `
		<ngts-wireframe-with-custom-geometry *ngIf="geometry(); else withoutCustomGeometry" />
		<ng-template #withoutCustomGeometry>
			<ngts-wireframe-without-custom-geometry />
		</ng-template>
	`,
	imports: [NgtsWireframeWithoutCustomGeometry, NgtsWireframeWithCustomGeometry, NgIf],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	providers: [{ provide: NgtsWireframeInput, useExisting: NgtsWireframe }],
})
export class NgtsWireframe extends NgtsWireframeInput {}
