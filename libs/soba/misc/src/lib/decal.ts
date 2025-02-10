import {
	ChangeDetectionStrategy,
	Component,
	CUSTOM_ELEMENTS_SCHEMA,
	effect,
	ElementRef,
	input,
	viewChild,
} from '@angular/core';
import { applyProps, extend, getInstanceState, is, NgtThreeElements, omit, pick, resolveRef } from 'angular-three';
import { mergeInputs } from 'ngxtension/inject-inputs';
import * as THREE from 'three';
import { AxesHelper, BoxGeometry, Mesh, MeshNormalMaterial } from 'three';
import { DecalGeometry } from 'three-stdlib';

export interface NgtsDecalOptions extends Partial<NgtThreeElements['ngt-mesh']> {
	polygonOffsetFactor: number;
	depthTest: boolean;
	debug: boolean;
	map?: THREE.Texture | null;
}

const defaultOptions: NgtsDecalOptions = {
	polygonOffsetFactor: -10,
	debug: false,
	depthTest: false,
};

@Component({
	selector: 'ngts-decal',
	template: `
		<ngt-mesh #mesh [parameters]="parameters()">
			<ngt-value [rawValue]="true" attach="material.transparent" />
			<ngt-value [rawValue]="true" attach="material.polygonOffset" />
			<ngt-value [rawValue]="map()" attach="material.map" />

			<ng-content>
				<!-- we only want to pass through these material properties if they don't use a custom material -->
				<ngt-value [rawValue]="polygonOffsetFactor()" attach="material.polygonOffsetFactor" />
				<ngt-value [rawValue]="depthTest()" attach="material.depthTest" />
			</ng-content>

			@if (debug()) {
				<ngt-mesh #helper>
					<ngt-box-geometry />
					<ngt-mesh-normal-material wireframe />
					<ngt-axes-helper />
				</ngt-mesh>
			}
		</ngt-mesh>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgtsDecal {
	mesh = input<ElementRef<THREE.Mesh> | THREE.Mesh | null>();
	options = input(defaultOptions, { transform: mergeInputs(defaultOptions) });
	protected parameters = omit(this.options, [
		'debug',
		'map',
		'depthTest',
		'polygonOffsetFactor',
		'position',
		'scale',
		'rotation',
	]);

	meshRef = viewChild.required<ElementRef<THREE.Mesh>>('mesh');
	private helperRef = viewChild<ElementRef<THREE.Mesh>>('helper');

	protected map = pick(this.options, 'map');
	protected depthTest = pick(this.options, 'depthTest');
	protected polygonOffsetFactor = pick(this.options, 'polygonOffsetFactor');
	protected debug = pick(this.options, 'debug');
	private position = pick(this.options, 'position');
	private rotation = pick(this.options, 'rotation');
	private scale = pick(this.options, 'scale');

	constructor() {
		extend({ Mesh, BoxGeometry, MeshNormalMaterial, AxesHelper });

		effect((onCleanup) => {
			const thisMesh = this.meshRef().nativeElement;
			const instanceState = getInstanceState(thisMesh);
			if (!instanceState) return;

			const parent = resolveRef(this.mesh()) || instanceState.parent();

			if (parent && !is.three<THREE.Mesh>(parent, 'isMesh')) {
				throw new Error('<ngts-decal> must have a Mesh as parent or specify its "mesh" input');
			}

			if (!parent) return;

			const parentInstanceState = getInstanceState(parent);
			if (!parentInstanceState) return;

			// track parent's children
			const parentNonObjects = parentInstanceState.nonObjects();
			if (!parentNonObjects || !parentNonObjects.length) {
				return;
			}

			// if parent geometry doesn't have its attributes populated properly, we skip
			if (!parent.geometry?.attributes?.['position']) {
				return;
			}

			const [position, rotation, scale] = [this.position(), this.rotation(), this.scale()];
			const state = {
				position: new THREE.Vector3(),
				rotation: new THREE.Euler(),
				scale: new THREE.Vector3(1, 1, 1),
			};

			applyProps(state, { position, scale });

			// zero out the parents matrix world for this operation
			const matrixWorld = parent.matrixWorld.clone();
			parent.matrixWorld.identity();

			if (!rotation || typeof rotation === 'number') {
				const obj = new THREE.Object3D();
				obj.position.copy(state.position);
				obj.lookAt(parent.position);
				if (typeof rotation === 'number') obj.rotateZ(rotation);
				applyProps(state, { rotation: obj.rotation });
			} else {
				applyProps(state, { rotation });
			}

			thisMesh.geometry = new DecalGeometry(parent, state.position, state.rotation, state.scale);
			const helper = this.helperRef()?.nativeElement;
			if (helper) {
				applyProps(helper, state);
				// Prevent the helpers from blocking rays
				helper.traverse((child) => (child.raycast = () => null));
			}

			// Reset parents matrix-world
			parent.matrixWorld = matrixWorld;

			onCleanup(() => {
				thisMesh.geometry.dispose();
			});
		});
	}
}
