import { NgIf } from '@angular/common';
import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, effect, Input } from '@angular/core';
import {
	applyProps,
	extend,
	injectNgtRef,
	is,
	signalStore,
	type NgtEuler,
	type NgtMesh,
	type NgtRef,
	type NgtVector3,
} from 'angular-three';
import * as THREE from 'three';
import { AxesHelper, BoxGeometry, Mesh, MeshNormalMaterial } from 'three';
import { DecalGeometry } from 'three-stdlib';

extend({ Mesh, BoxGeometry, MeshNormalMaterial, AxesHelper });

export type NgtsDecalState = {
	debug: boolean;
	mesh?: NgtRef<THREE.Mesh>;
	position: NgtVector3;
	rotation: NgtEuler | number;
	scale: NgtVector3;
	map?: THREE.Texture;
	polygonOffsetFactor: number;
	depthTest: boolean;
};

declare global {
	interface HTMLElementTagNameMap {
		/**
		 * @extends ngt-mesh
		 */
		'ngts-decal': NgtsDecalState & NgtMesh;
	}
}

function vecToArray(vec: number[] | NgtVector3 | NgtEuler | number = [0, 0, 0]) {
	if (Array.isArray(vec)) {
		return vec;
	}

	if (vec instanceof THREE.Vector3 || vec instanceof THREE.Euler) {
		return [vec.x, vec.y, vec.z];
	}

	return [vec, vec, vec];
}

@Component({
	selector: 'ngts-decal',
	standalone: true,
	template: `
		<ngt-mesh [ref]="decalRef" ngtCompound>
			<ngt-value [rawValue]="true" attach="material.transparent" />
			<ngt-value [rawValue]="true" attach="material.polygonOffset" />
			<ngt-value [rawValue]="polygonOffsetFactor()" attach="material.polygonOffsetFactor" />
			<ngt-value [rawValue]="depthTest()" attach="material.depthTest" />
			<ngt-value [rawValue]="map()" attach="material.map" />
			<ng-content />

			<ngt-mesh *ngIf="debug()" [ref]="helperRef">
				<ngt-box-geometry />
				<ngt-mesh-normal-material [wireframe]="true" />
				<ngt-axes-helper />
			</ngt-mesh>
		</ngt-mesh>
	`,
	imports: [NgIf],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsDecal {
	private inputs = signalStore<NgtsDecalState>({
		debug: false,
		depthTest: false,
		polygonOffsetFactor: -10,
		position: [0, 0, 0],
		rotation: [0, 0, 0],
		scale: 1,
	});

	@Input() decalRef = injectNgtRef<Mesh>();

	@Input({ alias: 'debug' }) set _debug(debug: boolean) {
		this.inputs.set({ debug });
	}

	@Input({ alias: 'mesh' }) set _mesh(mesh: NgtRef<THREE.Mesh>) {
		this.inputs.set({ mesh });
	}

	@Input({ alias: 'position' }) set _position(position: NgtVector3) {
		this.inputs.set({ position });
	}

	@Input({ alias: 'rotation' }) set _rotation(rotation: NgtEuler | number) {
		this.inputs.set({ rotation });
	}

	@Input({ alias: 'scale' }) set _scale(scale: NgtVector3) {
		this.inputs.set({ scale });
	}

	@Input({ alias: 'map' }) set _map(map: THREE.Texture) {
		this.inputs.set({ map });
	}

	@Input({ alias: 'polygonOffsetFactor' }) set _polygonOffsetFactor(polygonOffsetFactor: number) {
		this.inputs.set({ polygonOffsetFactor });
	}

	@Input({ alias: 'depthTest' }) set _depthTest(depthTest: boolean) {
		this.inputs.set({ depthTest });
	}

	private mesh = this.inputs.select('mesh');
	private __position = this.inputs.select('position');
	private __rotation = this.inputs.select('rotation');
	private __scale = this.inputs.select('scale');
	private position = computed(() => vecToArray(this.__position()));
	private rotation = computed(() => vecToArray(this.__rotation()));
	private scale = computed(() => vecToArray(this.__scale()));

	helperRef = injectNgtRef<Mesh>();

	debug = this.inputs.select('debug');
	depthTest = this.inputs.select('depthTest');
	polygonOffsetFactor = this.inputs.select('polygonOffsetFactor');
	map = this.inputs.select('map');

	constructor() {
		this.processDecal();
	}

	private processDecal() {
		effect((onCleanup) => {
			const decal = this.decalRef.nativeElement;
			if (!decal) return;

			const [mesh, position, rotation, scale, helper] = [
				this.mesh(),
				this.position(),
				this.rotation(),
				this.scale(),
				this.helperRef.untracked,
			];

			const parent = mesh ? (is.ref(mesh) ? mesh.nativeElement : mesh) : decal.parent;
			if (!(parent instanceof Mesh)) {
				throw new Error('[NGT] ngts-decal must have a ngt-mesh as parent or specify its "mesh" input');
			}

			const state = {
				position: new THREE.Vector3(),
				rotation: new THREE.Euler(),
				scale: new THREE.Vector3(1, 1, 1),
			};

			if (parent) {
				applyProps(state, { position, scale });

				// Zero out the parents matrix world for this operation
				const matrixWorld = parent.matrixWorld.clone();
				parent.matrixWorld.identity();

				if (!rotation || typeof rotation === 'number') {
					const o = new THREE.Object3D();

					o.position.copy(state.position);
					o.lookAt(parent.position);
					if (typeof rotation === 'number') o.rotateZ(rotation);
					applyProps(state, { rotation: o.rotation });
				} else {
					applyProps(state, { rotation });
				}

				decal.geometry = new DecalGeometry(parent, state.position, state.rotation, state.scale);
				if (helper) {
					applyProps(helper, state);
					// Prevent the helpers from blocking rays
					helper.traverse((child) => (child.raycast = () => null));
				}
				// Reset parents matix-world
				parent.matrixWorld = matrixWorld;

				onCleanup(() => {
					decal.geometry.dispose();
				});
			}
		});
	}
}
