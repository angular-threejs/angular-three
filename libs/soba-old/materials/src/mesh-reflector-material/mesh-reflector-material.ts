import { NgIf } from '@angular/common';
import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, Input } from '@angular/core';
import {
	extend,
	getLocalState,
	injectBeforeRender,
	injectNgtRef,
	injectNgtStore,
	NgtKey,
	signalStore,
	type NgtMeshStandardMaterial,
	type NgtRenderState,
} from 'angular-three-old';
import { BlurPass, MeshReflectorMaterial } from 'angular-three-soba-old/shaders';
import * as THREE from 'three';

extend({ MeshReflectorMaterial });

export type NgtsMeshReflectorMaterialState = {
	resolution: number;
	mixBlur: number;
	mixStrength: number;
	blur: [number, number] | number;
	mirror: number;
	minDepthThreshold: number;
	maxDepthThreshold: number;
	depthScale: number;
	depthToBlurRatioBias: number;
	distortionMap?: THREE.Texture;
	distortion: number;
	mixContrast: number;
	reflectorOffset: number;
};

declare global {
	interface HTMLElementTagNameMap {
		/**
		 * @extends ngt-mesh-standard-material
		 */
		'ngts-mesh-reflector-material': NgtsMeshReflectorMaterialState & NgtMeshStandardMaterial;
	}
}

@Component({
	selector: 'ngts-mesh-reflector-material',
	standalone: true,
	template: `
		<ngt-mesh-reflector-material
			*ngIf="defines() as defines"
			[key]="defines"
			ngtCompound
			attach="material"
			[ref]="materialRef"
			[defines]="defines"
			[mirror]="mirror()"
			[textureMatrix]="textureMatrix()"
			[mixBlur]="mixBlur()"
			[tDiffuse]="tDiffuse()"
			[tDepth]="tDepth()"
			[tDiffuseBlur]="tDiffuseBlur()"
			[hasBlur]="hasBlur()"
			[mixStrength]="mixStrength()"
			[minDepthThreshold]="minDepthThreshold()"
			[maxDepthThreshold]="maxDepthThreshold()"
			[depthScale]="depthScale()"
			[depthToBlurRatioBias]="depthToBlurRatioBias()"
			[distortion]="distortion()"
			[distortionMap]="distortionMap()"
			[mixContrast]="mixContrast()"
		>
			<ng-content />
		</ngt-mesh-reflector-material>
	`,
	imports: [NgIf, NgtKey],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsMeshReflectorMaterial {
	private inputs = signalStore<NgtsMeshReflectorMaterialState>({
		mixBlur: 0,
		mixStrength: 1,
		resolution: 256,
		blur: [0, 0],
		minDepthThreshold: 0.9,
		maxDepthThreshold: 1,
		depthScale: 0,
		depthToBlurRatioBias: 0.25,
		mirror: 0,
		distortion: 1,
		mixContrast: 1,
		reflectorOffset: 0,
	});

	@Input() materialRef = injectNgtRef<MeshReflectorMaterial>();

	@Input({ alias: 'resolution' }) set _resolution(resolution: number) {
		this.inputs.set({ resolution });
	}

	@Input({ alias: 'mixBlur' }) set _mixBlur(mixBlur: number) {
		this.inputs.set({ mixBlur });
	}

	@Input({ alias: 'mixStrength' }) set _mixStrength(mixStrength: number) {
		this.inputs.set({ mixStrength });
	}

	@Input({ alias: 'blur' }) set _blur(blur: [number, number] | number) {
		this.inputs.set({ blur });
	}

	@Input({ alias: 'mirror' }) set _mirror(mirror: number) {
		this.inputs.set({ mirror });
	}

	@Input({ alias: 'minDepthThreshold' }) set _minDepthThreshold(minDepthThreshold: number) {
		this.inputs.set({ minDepthThreshold });
	}

	@Input({ alias: 'maxDepthThreshold' }) set _maxDepthThreshold(maxDepthThreshold: number) {
		this.inputs.set({ maxDepthThreshold });
	}

	@Input({ alias: 'depthScale' }) set _depthScale(depthScale: number) {
		this.inputs.set({ depthScale });
	}

	@Input({ alias: 'depthToBlurRatioBias' }) set _depthToBlurRatioBias(depthToBlurRatioBias: number) {
		this.inputs.set({ depthToBlurRatioBias });
	}

	@Input({ alias: 'distortionMap' }) set _distortionMap(distortionMap: THREE.Texture) {
		this.inputs.set({ distortionMap });
	}

	@Input({ alias: 'distortion' }) set _distortion(distortion: number) {
		this.inputs.set({ distortion });
	}

	@Input({ alias: 'mixContrast' }) set _mixContrast(mixContrast: number) {
		this.inputs.set({ mixContrast });
	}

	@Input({ alias: 'reflectorOffset' }) set _reflectorOffset(reflectorOffset: number) {
		this.inputs.set({ reflectorOffset });
	}

	private reflectorProps = computed(() => this.states().reflectorProps);
	defines = computed(() => this.reflectorProps().defines);
	mirror = computed(() => this.reflectorProps().mirror);
	textureMatrix = computed(() => this.reflectorProps().textureMatrix);
	mixBlur = computed(() => this.reflectorProps().mixBlur);
	tDiffuse = computed(() => this.reflectorProps().tDiffuse);
	tDepth = computed(() => this.reflectorProps().tDepth);
	tDiffuseBlur = computed(() => this.reflectorProps().tDiffuseBlur);
	hasBlur = computed(() => this.reflectorProps().hasBlur);
	mixStrength = computed(() => this.reflectorProps().mixStrength);
	minDepthThreshold = computed(() => this.reflectorProps().minDepthThreshold);
	maxDepthThreshold = computed(() => this.reflectorProps().maxDepthThreshold);
	depthScale = computed(() => this.reflectorProps().depthScale);
	depthToBlurRatioBias = computed(() => this.reflectorProps().depthToBlurRatioBias);
	distortion = computed(() => this.reflectorProps().distortion);
	distortionMap = computed(() => this.reflectorProps().distortionMap);
	mixContrast = computed(() => this.reflectorProps().mixContrast);

	private store = injectNgtStore();
	private gl = this.store.select('gl');

	private reflectorPlane = new THREE.Plane();
	private normal = new THREE.Vector3();
	private reflectorWorldPosition = new THREE.Vector3();
	private cameraWorldPosition = new THREE.Vector3();
	private rotationMatrix = new THREE.Matrix4();
	private lookAtPosition = new THREE.Vector3(0, 0, -1);
	private clipPlane = new THREE.Vector4();
	private view = new THREE.Vector3();
	private target = new THREE.Vector3();
	private q = new THREE.Vector4();
	private virtualCamera = new THREE.PerspectiveCamera();
	private _textureMatrix = new THREE.Matrix4();

	private __blur = this.inputs.select('blur');
	private __resolution = this.inputs.select('resolution');
	private __mirror = this.inputs.select('mirror');
	private __mixBlur = this.inputs.select('mixBlur');
	private __mixStrength = this.inputs.select('mixStrength');
	private __minDepthThreshold = this.inputs.select('minDepthThreshold');
	private __maxDepthThreshold = this.inputs.select('maxDepthThreshold');
	private __depthScale = this.inputs.select('depthScale');
	private __depthToBlurRatioBias = this.inputs.select('depthToBlurRatioBias');
	private __distortion = this.inputs.select('distortion');
	private __distortionMap = this.inputs.select('distortionMap');
	private __mixContrast = this.inputs.select('mixContrast');

	private normalizedBlur = computed(() => {
		const blur = this.__blur();
		return Array.isArray(blur) ? blur : [blur, blur];
	});

	private __hasBlur = computed(() => {
		const [x, y] = this.normalizedBlur();
		return x + y > 0;
	});

	private states = computed(() => {
		const gl = this.gl();
		const resolution = this.__resolution();
		const blur = this.normalizedBlur();
		const minDepthThreshold = this.__minDepthThreshold();
		const maxDepthThreshold = this.__maxDepthThreshold();
		const depthScale = this.__depthScale();
		const depthToBlurRatioBias = this.__depthToBlurRatioBias();
		const mirror = this.__mirror();
		const mixBlur = this.__mixBlur();
		const mixStrength = this.__mixStrength();
		const mixContrast = this.__mixContrast();
		const distortion = this.__distortion();
		const distortionMap = this.__distortionMap();
		const hasBlur = this.__hasBlur();

		const parameters = {
			minFilter: THREE.LinearFilter,
			magFilter: THREE.LinearFilter,
			type: THREE.HalfFloatType,
		};
		const fbo1 = new THREE.WebGLRenderTarget(resolution, resolution, parameters);
		fbo1.depthBuffer = true;
		fbo1.depthTexture = new THREE.DepthTexture(resolution, resolution);
		fbo1.depthTexture.format = THREE.DepthFormat;
		fbo1.depthTexture.type = THREE.UnsignedShortType;

		const fbo2 = new THREE.WebGLRenderTarget(resolution, resolution, parameters);
		const blurPass = new BlurPass({
			gl,
			resolution,
			width: blur[0],
			height: blur[1],
			minDepthThreshold,
			maxDepthThreshold,
			depthScale,
			depthToBlurRatioBias,
		});
		const reflectorProps = {
			mirror,
			textureMatrix: this._textureMatrix,
			mixBlur,
			tDiffuse: fbo1.texture,
			tDepth: fbo1.depthTexture,
			tDiffuseBlur: fbo2.texture,
			hasBlur,
			mixStrength,
			minDepthThreshold,
			maxDepthThreshold,
			depthScale,
			depthToBlurRatioBias,
			distortion,
			distortionMap,
			mixContrast,
			defines: {
				USE_BLUR: hasBlur ? '' : undefined,
				USE_DEPTH: depthScale > 0 ? '' : undefined,
				USE_DISTORTION: distortionMap ? '' : undefined,
			},
		};

		return { fbo1, fbo2, blurPass, reflectorProps };
	});

	constructor() {
		injectBeforeRender(this.onBeforeRender.bind(this));
	}

	private onBeforeRender(state: NgtRenderState) {
		if (!this.materialRef.nativeElement) return;
		const parent = getLocalState(this.materialRef.nativeElement).instanceStore?.get('parent');
		if (!parent) return;

		const { gl, scene } = state;
		const hasBlur = this.__hasBlur();
		const { fbo1, fbo2, blurPass } = this.states();

		if (fbo1 && fbo2 && blurPass) {
			parent.visible = false;
			const currentXrEnabled = gl.xr.enabled;
			const currentShadowAutoUpdate = gl.shadowMap.autoUpdate;
			this.beforeRender(state);
			gl.xr.enabled = false;
			gl.shadowMap.autoUpdate = false;
			gl.setRenderTarget(fbo1);
			gl.state.buffers.depth.setMask(true);
			if (!gl.autoClear) gl.clear();
			gl.render(scene, this.virtualCamera);
			if (hasBlur) blurPass.render(gl, fbo1, fbo2);
			gl.xr.enabled = currentXrEnabled;
			gl.shadowMap.autoUpdate = currentShadowAutoUpdate;
			parent.visible = true;
			gl.setRenderTarget(null);
		}
	}

	private beforeRender(state: NgtRenderState) {
		const parent = getLocalState(this.materialRef.nativeElement).instanceStore?.get('parent');
		if (!parent) return;

		const { camera } = state;

		this.reflectorWorldPosition.setFromMatrixPosition(parent.matrixWorld);
		this.cameraWorldPosition.setFromMatrixPosition(camera.matrixWorld);
		this.rotationMatrix.extractRotation(parent.matrixWorld);
		this.normal.set(0, 0, 1);
		this.normal.applyMatrix4(this.rotationMatrix);
		this.reflectorWorldPosition.addScaledVector(this.normal, this.inputs.get('reflectorOffset'));
		this.view.subVectors(this.reflectorWorldPosition, this.cameraWorldPosition);
		// Avoid rendering when reflector is facing away
		if (this.view.dot(this.normal) > 0) return;
		this.view.reflect(this.normal).negate();
		this.view.add(this.reflectorWorldPosition);
		this.rotationMatrix.extractRotation(camera.matrixWorld);
		this.lookAtPosition.set(0, 0, -1);
		this.lookAtPosition.applyMatrix4(this.rotationMatrix);
		this.lookAtPosition.add(this.cameraWorldPosition);
		this.target.subVectors(this.reflectorWorldPosition, this.lookAtPosition);
		this.target.reflect(this.normal).negate();
		this.target.add(this.reflectorWorldPosition);
		this.virtualCamera.position.copy(this.view);
		this.virtualCamera.up.set(0, 1, 0);
		this.virtualCamera.up.applyMatrix4(this.rotationMatrix);
		this.virtualCamera.up.reflect(this.normal);
		this.virtualCamera.lookAt(this.target);
		this.virtualCamera.far = camera.far; // Used in WebGLBackground
		this.virtualCamera.updateMatrixWorld();
		this.virtualCamera.projectionMatrix.copy(camera.projectionMatrix);
		// Update the texture matrix
		this._textureMatrix.set(0.5, 0.0, 0.0, 0.5, 0.0, 0.5, 0.0, 0.5, 0.0, 0.0, 0.5, 0.5, 0.0, 0.0, 0.0, 1.0);
		this._textureMatrix.multiply(this.virtualCamera.projectionMatrix);
		this._textureMatrix.multiply(this.virtualCamera.matrixWorldInverse);
		this._textureMatrix.multiply(parent.matrixWorld);
		// Now update projection matrix with new clip plane, implementing code from: http://www.terathon.com/code/oblique.html
		// Paper explaining this technique: http://www.terathon.com/lengyel/Lengyel-Oblique.pdf
		this.reflectorPlane.setFromNormalAndCoplanarPoint(this.normal, this.reflectorWorldPosition);
		this.reflectorPlane.applyMatrix4(this.virtualCamera.matrixWorldInverse);
		this.clipPlane.set(
			this.reflectorPlane.normal.x,
			this.reflectorPlane.normal.y,
			this.reflectorPlane.normal.z,
			this.reflectorPlane.constant,
		);
		const projectionMatrix = this.virtualCamera.projectionMatrix;
		this.q.x = (Math.sign(this.clipPlane.x) + projectionMatrix.elements[8]) / projectionMatrix.elements[0];
		this.q.y = (Math.sign(this.clipPlane.y) + projectionMatrix.elements[9]) / projectionMatrix.elements[5];
		this.q.z = -1.0;
		this.q.w = (1.0 + projectionMatrix.elements[10]) / projectionMatrix.elements[14];
		// Calculate the scaled plane vector
		this.clipPlane.multiplyScalar(2.0 / this.clipPlane.dot(this.q));
		// Replacing the third row of the projection matrix
		projectionMatrix.elements[2] = this.clipPlane.x;
		projectionMatrix.elements[6] = this.clipPlane.y;
		projectionMatrix.elements[10] = this.clipPlane.z + 1.0;
		projectionMatrix.elements[14] = this.clipPlane.w;
	}
}
