import { NgIf } from '@angular/common';
import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, effect, ElementRef, Input } from '@angular/core';
import { extend, injectNgtRef, injectNgtStore, NgtGroup, signalStore } from 'angular-three';
import { NgtsEdges } from 'angular-three-soba/abstractions';
import { injectNgtsFBO, NgtsSobaContent } from 'angular-three-soba/misc';
import { CausticsMaterial, CausticsProjectionMaterial } from 'angular-three-soba/shaders';
import * as THREE from 'three';
import { Group, LineBasicMaterial, Mesh, OrthographicCamera, PlaneGeometry, Scene } from 'three';
import { FullScreenQuad } from 'three-stdlib';

extend({ Group, Scene, Mesh, PlaneGeometry, OrthographicCamera, CausticsProjectionMaterial, LineBasicMaterial });

const NORMALPROPS = {
	depth: true,
	minFilter: THREE.LinearFilter,
	magFilter: THREE.LinearFilter,
	type: THREE.UnsignedByteType,
};

const CAUSTICPROPS = {
	minFilter: THREE.LinearMipmapLinearFilter,
	magFilter: THREE.LinearFilter,
	type: THREE.FloatType,
	generateMipmaps: true,
};

type CausticsMaterialType = THREE.ShaderMaterial & {
	cameraMatrixWorld?: THREE.Matrix4;
	cameraProjectionMatrixInv?: THREE.Matrix4;
	lightPlaneNormal?: THREE.Vector3;
	lightPlaneConstant?: number;
	normalTexture?: THREE.Texture | null;
	depthTexture?: THREE.Texture | null;
	lightDir?: THREE.Vector3;
	near?: number;
	far?: number;
	modelMatrix?: THREE.Matrix4;
	worldRadius?: number;
	ior?: number;
	bounces?: number;
	resolution?: number;
	size?: number;
	intensity?: number;
};

type CausticsProjectionMaterialType = THREE.MeshNormalMaterial & {
	viewMatrix: { value?: THREE.Matrix4 };
	color?: THREE.Color;
	causticsTexture?: THREE.Texture;
	causticsTextureB?: THREE.Texture;
	lightProjMatrix?: THREE.Matrix4;
	lightViewMatrix?: THREE.Matrix4;
};

function createNormalMaterial(side: THREE.Side = THREE.FrontSide) {
	const viewMatrix = { value: new THREE.Matrix4() };
	return Object.assign(new THREE.MeshNormalMaterial({ side }), {
		viewMatrix,
		onBeforeCompile: (shader: any) => {
			shader.uniforms.viewMatrix = viewMatrix;
			shader.fragmentShader =
				`vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
           return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
         }\n` +
				shader.fragmentShader.replace(
					'#include <normal_fragment_maps>',
					`#include <normal_fragment_maps>
           normal = inverseTransformDirection( normal, viewMatrix );\n`,
				);
		},
	});
}

export type NgtsCausticsState = {
	/** How many frames it will render, set it to Infinity for runtime, default: 1 */
	frames: number;
	/** Enables visual cues to help you stage your scene, default: false */
	debug: boolean;
	/** Will display caustics only and skip the models, default: false */
	causticsOnly: boolean;
	/** Will include back faces and enable the backsideIOR prop, default: false */
	backside: boolean;
	/** The IOR refraction index, default: 1.1 */
	ior: number;
	/** The IOR refraction index for back faces (only available when backside is enabled), default: 1.1 */
	backsideIOR: number;
	/** The texel size, default: 0.3125 */
	worldRadius: number;
	/** Intensity of the prjected caustics, default: 0.05 */
	intensity: number;
	/** Caustics color, default: white */
	color: THREE.ColorRepresentation;
	/** Buffer resolution, default: 2048 */
	resolution: number;
	/** Camera position, it will point towards the contents bounds center, default: [5, 5, 5] */
	lightSource: [x: number, y: number, z: number] | ElementRef<THREE.Object3D>;
};

declare global {
	interface HTMLElementTagNameMap {
		/**
		 * @extends ngt-group
		 */
		'ngts-caustics': NgtsCausticsState & NgtGroup;
	}
}

@Component({
	selector: 'ngts-caustics',
	standalone: true,
	template: `
		<ngt-group [ref]="causticsRef" ngtCompound>
			<ngt-scene [ref]="sceneRef">
				<ngt-orthographic-camera [ref]="cameraRef" [up]="[0, 1, 0]" />
				<ng-content />
			</ngt-scene>
			<ngt-mesh [renderOrder]="2" [ref]="planeRef" [rotation]="[-Math.PI / 2, 0, 0]">
				<ngt-plane-geometry />
				<ngt-caustics-projection-material
					*ngIf="causticsTargetFbo.nativeElement && causticsTargetBFbo.nativeElement"
					[transparent]="true"
					[color]="color()"
					[causticsTexture]="causticsTargetFbo.nativeElement.texture"
					[causticsTextureB]="causticsTargetBFbo.nativeElement.texture"
					[blending]="CustomBlending"
					[blendSrc]="OneFactor"
					[blendDst]="SrcAlphaFactor"
					[depthWrite]="false"
				/>

				<ngts-edges *ngIf="debug()">
					<ngt-line-basic-material *ngtsSobaContent color="#ffff00" [toneMapped]="false" />
				</ngts-edges>
			</ngt-mesh>
		</ngt-group>
	`,
	imports: [NgIf, NgtsEdges, NgtsSobaContent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsCaustics {
	CustomBlending = THREE.CustomBlending;
	OneFactor = THREE.OneFactor;
	SrcAlphaFactor = THREE.SrcAlphaFactor;
	Math = Math;

	private inputs = signalStore<NgtsCausticsState>({
		frames: 1,
		ior: 1.1,
		color: 'white',
		causticsOnly: false,
		backside: false,
		backsideIOR: 1.1,
		worldRadius: 0.3125,
		intensity: 0.05,
		resolution: 2024,
		lightSource: [5, 5, 5],
	});

	@Input() causticsRef = injectNgtRef<THREE.Group>();

	/** How many frames it will render, set it to Infinity for runtime, default: 1 */
	@Input({ alias: 'frames' }) set _frames(frames: number) {
		this.inputs.set({ frames });
	}
	/** Enables visual cues to help you stage your scene, default: false */
	@Input({ alias: 'debug' }) set _debug(debug: boolean) {
		this.inputs.set({ debug });
	}
	/** Will display caustics only and skip the models, default: false */
	@Input({ alias: 'causticsOnly' }) set _causticsOnly(causticsOnly: boolean) {
		this.inputs.set({ causticsOnly });
	}
	/** Will include back faces and enable the backsideIOR prop, default: false */
	@Input({ alias: 'backside' }) set _backside(backside: boolean) {
		this.inputs.set({ backside });
	}
	/** The IOR refraction index, default: 1.1 */
	@Input({ alias: 'ior' }) set _ior(ior: number) {
		this.inputs.set({ ior });
	}
	/** The IOR refraction index for back faces (only available when backside is enabled), default: 1.1 */
	@Input({ alias: 'backsideIOR' }) set _backsideIOR(backsideIOR: number) {
		this.inputs.set({ backsideIOR });
	}
	/** The texel size, default: 0.3125 */
	@Input({ alias: 'worldRadius' }) set _worldRadius(worldRadius: number) {
		this.inputs.set({ worldRadius });
	}
	/** Intensity of the prjected caustics, default: 0.05 */
	@Input({ alias: 'intensity' }) set _intensity(intensity: number) {
		this.inputs.set({ intensity });
	}
	/** Caustics color, default: white */
	@Input({ alias: 'color' }) set _color(color: THREE.ColorRepresentation) {
		this.inputs.set({ color });
	}
	/** Buffer resolution, default: 2048 */
	@Input({ alias: 'resolution' }) set _resolution(resolution: number) {
		this.inputs.set({ resolution });
	}
	/** Camera position, it will point towards the contents bounds center, default: [5, 5, 5] */
	@Input({ alias: 'lightSource' }) set _lightSource(
		lightSource: [x: number, y: number, z: number] | ElementRef<THREE.Object3D>,
	) {
		this.inputs.set({ lightSource });
	}

	private resolution = this.inputs.select('resolution');

	private normalTargetSettings = computed(() => ({
		width: this.resolution(),
		height: this.resolution(),
		settings: NORMALPROPS,
	}));

	private causticsTargetSettings = computed(() => ({
		width: this.resolution(),
		height: this.resolution(),
		settings: CAUSTICPROPS,
	}));

	private normalTargetFbo = injectNgtsFBO(this.normalTargetSettings);
	private normalTargetBFbo = injectNgtsFBO(this.normalTargetSettings);
	causticsTargetFbo = injectNgtsFBO(this.causticsTargetSettings);
	causticsTargetBFbo = injectNgtsFBO(this.causticsTargetSettings);

	private store = injectNgtStore();

	color = this.inputs.select('color');
	debug = this.inputs.select('debug');

	planeRef = injectNgtRef<THREE.Mesh>();
	sceneRef = injectNgtRef<THREE.Scene>();
	cameraRef = injectNgtRef<THREE.OrthographicCamera>();

	private sceneChildren = this.sceneRef.children();
	private planeChildren = this.planeRef.children('both');
	private causticsChildren = this.causticsRef.children();

	constructor() {
		this.updateWorldMatrix();
		this.setBeforeRender();
	}

	private updateWorldMatrix() {
		effect(() => {
			const [caustics] = [
				this.causticsRef.nativeElement,
				this.inputs.state(),
				this.causticsChildren(),
				this.sceneChildren(),
			];
			if (!caustics) return;
			caustics.updateWorldMatrix(false, true);
		});
	}

	private setBeforeRender() {
		const causticsMaterial = new CausticsMaterial() as CausticsMaterialType;
		const causticsQuad = new FullScreenQuad(causticsMaterial);

		const normalMaterial = createNormalMaterial();
		const normalMaterialB = createNormalMaterial(THREE.BackSide);

		effect((onCleanup) => {
			const [
				caustics,
				scene,
				camera,
				normalTarget,
				normalTargetB,
				causticsTarget,
				causticsTargetB,
				plane,
				sceneChildren,
			] = [
				this.causticsRef.nativeElement,
				this.sceneRef.nativeElement,
				this.cameraRef.nativeElement,
				this.normalTargetFbo.nativeElement,
				this.normalTargetBFbo.nativeElement,
				this.causticsTargetFbo.nativeElement,
				this.causticsTargetBFbo.nativeElement,
				this.planeRef.nativeElement,
				this.sceneChildren(),
				this.planeChildren(),
			];

			if (!caustics) return;
			caustics.updateWorldMatrix(false, true);

			if (sceneChildren.length > 1) {
				const v = new THREE.Vector3();
				const lpF = new THREE.Frustum();
				const lpM = new THREE.Matrix4();
				const lpP = new THREE.Plane();

				const lightDir = new THREE.Vector3();
				const lightDirInv = new THREE.Vector3();
				const bounds = new THREE.Box3();
				const focusPos = new THREE.Vector3();

				let count = 0;
				const sub = this.store.get('internal').subscribe(({ gl }) => {
					const {
						frames,
						lightSource,
						resolution,
						worldRadius,
						intensity,
						backside,
						backsideIOR,
						ior,
						causticsOnly,
					} = this.inputs.get();

					if (frames === Infinity || count++ < frames) {
						if (Array.isArray(lightSource)) lightDir.fromArray(lightSource).normalize();
						else
							lightDir.copy(
								caustics.worldToLocal(lightSource.nativeElement.getWorldPosition(v)).normalize(),
							);

						lightDirInv.copy(lightDir).multiplyScalar(-1);

						let boundsVertices: THREE.Vector3[] = [];
						scene.parent?.matrixWorld.identity();
						bounds.setFromObject(scene, true);
						boundsVertices.push(new THREE.Vector3(bounds.min.x, bounds.min.y, bounds.min.z));
						boundsVertices.push(new THREE.Vector3(bounds.min.x, bounds.min.y, bounds.max.z));
						boundsVertices.push(new THREE.Vector3(bounds.min.x, bounds.max.y, bounds.min.z));
						boundsVertices.push(new THREE.Vector3(bounds.min.x, bounds.max.y, bounds.max.z));
						boundsVertices.push(new THREE.Vector3(bounds.max.x, bounds.min.y, bounds.min.z));
						boundsVertices.push(new THREE.Vector3(bounds.max.x, bounds.min.y, bounds.max.z));
						boundsVertices.push(new THREE.Vector3(bounds.max.x, bounds.max.y, bounds.min.z));
						boundsVertices.push(new THREE.Vector3(bounds.max.x, bounds.max.y, bounds.max.z));

						const worldVerts = boundsVertices.map((v) => v.clone());

						bounds.getCenter(focusPos);
						boundsVertices = boundsVertices.map((v) => v.clone().sub(focusPos));
						const lightPlane = lpP.set(lightDirInv, 0);
						const projectedVerts = boundsVertices.map((v) =>
							lightPlane.projectPoint(v, new THREE.Vector3()),
						);

						const centralVert = projectedVerts
							.reduce((a, b) => a.add(b), v.set(0, 0, 0))
							.divideScalar(projectedVerts.length);
						const radius = projectedVerts
							.map((v) => v.distanceTo(centralVert))
							.reduce((a, b) => Math.max(a, b));
						const dirLength = boundsVertices.map((x) => x.dot(lightDir)).reduce((a, b) => Math.max(a, b));

						// Shadows
						camera.position.copy(lightDir.clone().multiplyScalar(dirLength).add(focusPos));
						camera.lookAt(scene.localToWorld(focusPos.clone()));
						const dirMatrix = lpM.lookAt(camera.position, focusPos, v.set(0, 1, 0));
						camera.left = -radius;
						camera.right = radius;
						camera.top = radius;
						camera.bottom = -radius;
						const yOffset = v.set(0, radius, 0).applyMatrix4(dirMatrix);
						const yTime = (camera.position.y + yOffset.y) / lightDir.y;
						camera.near = 0.1;
						camera.far = yTime;
						camera.updateProjectionMatrix();
						camera.updateMatrixWorld();

						// Now find size of ground plane
						const groundProjectedCoords = worldVerts.map((v) =>
							v.add(lightDir.clone().multiplyScalar(-v.y / lightDir.y)),
						);
						const centerPos = groundProjectedCoords
							.reduce((a, b) => a.add(b), v.set(0, 0, 0))
							.divideScalar(groundProjectedCoords.length);
						const maxSize =
							2 *
							groundProjectedCoords
								.map((v) => Math.hypot(v.x - centerPos.x, v.z - centerPos.z))
								.reduce((a, b) => Math.max(a, b));
						plane.scale.setScalar(maxSize);
						plane.position.copy(centerPos);

						// if (debug) helper.current?.update();

						// Inject uniforms
						normalMaterialB.viewMatrix.value = normalMaterial.viewMatrix.value = camera.matrixWorldInverse;

						const dirLightNearPlane = lpF.setFromProjectionMatrix(
							lpM.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse),
						).planes[4];

						causticsMaterial.cameraMatrixWorld = camera.matrixWorld;
						causticsMaterial.cameraProjectionMatrixInv = camera.projectionMatrixInverse;
						causticsMaterial.lightDir = lightDirInv;

						causticsMaterial.lightPlaneNormal = dirLightNearPlane.normal;
						causticsMaterial.lightPlaneConstant = dirLightNearPlane.constant;

						causticsMaterial.near = camera.near;
						causticsMaterial.far = camera.far;
						causticsMaterial.resolution = resolution;
						causticsMaterial.size = radius;
						causticsMaterial.intensity = intensity;
						causticsMaterial.worldRadius = worldRadius;

						// Switch the scene on
						scene.visible = true;

						// Render front face normals
						gl.setRenderTarget(normalTarget);
						gl.clear();
						scene.overrideMaterial = normalMaterial;
						gl.render(scene, camera);

						// Render back face normals, if enabled
						gl.setRenderTarget(normalTargetB);
						gl.clear();
						if (backside) {
							scene.overrideMaterial = normalMaterialB;
							gl.render(scene, camera);
						}

						// Remove the override material
						scene.overrideMaterial = null;

						// Render front face caustics
						causticsMaterial.ior = ior;
						(plane.material as CausticsProjectionMaterialType).lightProjMatrix = camera.projectionMatrix;
						(plane.material as CausticsProjectionMaterialType).lightViewMatrix = camera.matrixWorldInverse;
						causticsMaterial.normalTexture = normalTarget?.texture;
						causticsMaterial.depthTexture = normalTarget?.depthTexture;
						gl.setRenderTarget(causticsTarget);
						gl.clear();
						causticsQuad.render(gl);

						// Render back face caustics, if enabled
						causticsMaterial.ior = backsideIOR;
						causticsMaterial.normalTexture = normalTargetB?.texture;
						causticsMaterial.depthTexture = normalTargetB?.depthTexture;
						gl.setRenderTarget(causticsTargetB);
						gl.clear();
						if (backside) causticsQuad.render(gl);

						// Reset render target
						gl.setRenderTarget(null);

						// Switch the scene off if caustics is all that's wanted
						if (causticsOnly) scene.visible = false;
					}
				});

				onCleanup(() => sub());
			}
		});
	}
}
