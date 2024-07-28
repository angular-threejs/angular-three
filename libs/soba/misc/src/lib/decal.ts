import {
	afterNextRender,
	ChangeDetectionStrategy,
	Component,
	CUSTOM_ELEMENTS_SCHEMA,
	ElementRef,
	input,
	viewChild,
} from '@angular/core';
import { applyProps, extend, getLocalState, NgtMesh, omit, pick, resolveRef } from 'angular-three';
import { injectAutoEffect } from 'ngxtension/auto-effect';
import { mergeInputs } from 'ngxtension/inject-inputs';
import { AxesHelper, BoxGeometry, Euler, Mesh, MeshNormalMaterial, Object3D, Texture, Vector3 } from 'three';
import { DecalGeometry } from 'three-stdlib';

export interface NgtsDecalOptions extends Partial<NgtMesh> {
	polygonOffsetFactor: number;
	depthTest: boolean;
	debug: boolean;
	map?: Texture | null;
}

const defaultOptions: NgtsDecalOptions = {
	polygonOffsetFactor: -10,
	debug: false,
	depthTest: false,
};

@Component({
	selector: 'ngts-decal',
	standalone: true,
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
					<ngt-mesh-normal-material [wireframe]="true" />
					<ngt-axes-helper />
				</ngt-mesh>
			}
		</ngt-mesh>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgtsDecal {
	mesh = input<ElementRef<Mesh> | Mesh | null>();
	options = input(defaultOptions, { transform: mergeInputs(defaultOptions) });
	parameters = omit(this.options, [
		'debug',
		'map',
		'depthTest',
		'polygonOffsetFactor',
		'position',
		'scale',
		'rotation',
	]);

	meshRef = viewChild.required<ElementRef<Mesh>>('mesh');
	helperRef = viewChild<ElementRef<Mesh>>('helper');

	map = pick(this.options, 'map');
	depthTest = pick(this.options, 'depthTest');
	polygonOffsetFactor = pick(this.options, 'polygonOffsetFactor');
	debug = pick(this.options, 'debug');
	private position = pick(this.options, 'position');
	private rotation = pick(this.options, 'rotation');
	private scale = pick(this.options, 'scale');

	constructor() {
		extend({ Mesh, BoxGeometry, MeshNormalMaterial, AxesHelper });
		const autoEffect = injectAutoEffect();

		afterNextRender(() => {
			autoEffect(() => {
				const thisMesh = this.meshRef().nativeElement;
				const localState = getLocalState(thisMesh);
				if (!localState) return;

				const mesh = resolveRef(this.mesh());
				const parent = mesh || localState.parent();

				if (parent && !(parent as Mesh).isMesh) {
					throw new Error('<ngts-decal> must have a Mesh as parent or specify its "mesh" input');
				}

				if (!parent) return;

				const [position, rotation, scale] = [this.position(), this.rotation(), this.scale()];
				const state = {
					position: new Vector3(),
					rotation: new Euler(),
					scale: new Vector3(1, 1, 1),
				};

				applyProps(state, { position, scale });

				// zero out the parents matrix world for this operation
				const matrixWorld = parent.matrixWorld.clone();
				parent.matrixWorld.identity();

				if (!rotation || typeof rotation === 'number') {
					const o = new Object3D();
					o.position.copy(state.position);
					o.lookAt(parent.position);
					if (typeof rotation === 'number') o.rotateZ(rotation);
					applyProps(state, { rotation: o.rotation });
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

				return () => {
					thisMesh.geometry.dispose();
				};
			});
		});
	}
}
