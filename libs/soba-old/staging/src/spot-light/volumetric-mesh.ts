import { CUSTOM_ELEMENTS_SCHEMA, Component, computed, effect, inject } from '@angular/core';
import { NgtArgs, extend, injectBeforeRender, injectNgtRef, injectNgtStore } from 'angular-three-old';
import { SpotLightMaterial } from 'angular-three-soba-old/shaders';
import * as THREE from 'three';
import { Mesh } from 'three';
import { NgtsSpotLightInput } from './spot-light-input';

extend({ Mesh });

@Component({
	selector: 'ngts-volumetric-mesh',
	standalone: true,
	template: `
		<ngt-mesh [ref]="mesh" [geometry]="geometry()" [raycast]="nullRaycast">
			<ngt-primitive *args="[material]" attach="material">
				<ngt-value [rawValue]="spotLightInput.opacity()" attach="uniforms.opacity.value" />
				<ngt-value [rawValue]="spotLightInput.color()" attach="uniforms.lightColor.value" />
				<ngt-value [rawValue]="spotLightInput.attenuation()" attach="uniforms.attenuation.value" />
				<ngt-value [rawValue]="spotLightInput.anglePower()" attach="uniforms.anglePower.value" />
				<ngt-value [rawvalue]="spotLightInput.depthBuffer()" attach="uniforms.depth.value" />
				<ngt-value [rawvalue]="near()" attach="uniforms.cameraNear.value" />
				<ngt-value [rawvalue]="far()" attach="uniforms.cameraFar.value" />
				<ngt-value [rawvalue]="resolution()" attach="uniforms.resolution.value" />
			</ngt-primitive>
		</ngt-mesh>
	`,
	imports: [NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsVolumetricMesh {
	spotLightInput = inject(NgtsSpotLightInput);
	mesh = injectNgtRef<Mesh>();
	material = new SpotLightMaterial();
	nullRaycast = () => null;

	private vec = new THREE.Vector3();
	private store = injectNgtStore();
	private size = this.store.select('size');
	private dpr = this.store.select('viewport', 'dpr');

	private radiusTop = computed(() => {
		const radiusTop = this.spotLightInput.radiusTop();
		return radiusTop === undefined ? 0.1 : radiusTop;
	});
	private radiusBottom = computed(() => {
		const [angle, radiusBottom] = [this.spotLightInput.angle(), this.spotLightInput.radiusBottom()];
		return radiusBottom === undefined ? angle * 7 : radiusBottom;
	});

	near = this.store.select('camera', 'near');
	far = this.store.select('camera', 'far');
	resolution = computed(() =>
		this.spotLightInput.depthBuffer() ? [this.size().width * this.dpr(), this.size().height * this.dpr()] : [0, 0],
	);
	geometry = computed(() => {
		const [radiusTop, radiusBottom, distance] = [
			this.radiusTop(),
			this.radiusBottom(),
			this.spotLightInput.distance(),
		];

		const geometry = new THREE.CylinderGeometry(radiusTop, radiusBottom, distance, 128, 64, true);
		geometry.applyMatrix4(new THREE.Matrix4().makeTranslation(0, -distance / 2, 0));
		geometry.applyMatrix4(new THREE.Matrix4().makeRotationX(-Math.PI / 2));
		return geometry;
	});

	constructor() {
		this.beforeRender();
		effect(() => {
			this.spotLightInput.inputs.patch({
				opacity: 1,
				color: 'white',
				distance: 5,
				angle: 0.15,
				attenuation: 5,
				anglePower: 5,
			});
		});
	}

	private beforeRender() {
		injectBeforeRender(() => {
			this.material.uniforms['spotPosition'].value.copy(this.mesh.nativeElement.getWorldPosition(this.vec));
			this.mesh.nativeElement.lookAt((this.mesh.nativeElement.parent as any).target.getWorldPosition(this.vec));
		});
	}
}
