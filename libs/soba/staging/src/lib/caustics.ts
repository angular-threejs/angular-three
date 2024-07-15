import {
	afterNextRender,
	ChangeDetectionStrategy,
	Component,
	computed,
	CUSTOM_ELEMENTS_SCHEMA,
	ElementRef,
	input,
	viewChild,
} from '@angular/core';
import { extend, getLocalState, injectBeforeRender, NgtGroup, omit, pick, resolveRef } from 'angular-three';
import { injectHelper, NgtsEdges } from 'angular-three-soba/abstractions';
import { injectFBO } from 'angular-three-soba/misc';
import {
	CausticsMaterial,
	CausticsMaterialType,
	CausticsProjectionMaterial,
	CausticsProjectionMaterialType,
	createNormalMaterial,
} from 'angular-three-soba/shaders';
import { injectAutoEffect } from 'ngxtension/auto-effect';
import { mergeInputs } from 'ngxtension/inject-inputs';
import {
	BackSide,
	Box3,
	CameraHelper,
	ColorRepresentation,
	CustomBlending,
	FloatType,
	Frustum,
	Group,
	LinearFilter,
	LinearMipmapLinearFilter,
	LineBasicMaterial,
	Matrix4,
	Mesh,
	Object3D,
	OneFactor,
	OrthographicCamera,
	Plane,
	PlaneGeometry,
	Scene,
	SrcAlphaFactor,
	UnsignedByteType,
	Vector3,
} from 'three';
import { FullScreenQuad } from 'three-stdlib';

const NORMAL_OPTIONS = {
	depth: true,
	minFilter: LinearFilter,
	magFilter: LinearFilter,
	type: UnsignedByteType,
};

const CAUSTIC_OPTIONS = {
	minFilter: LinearMipmapLinearFilter,
	magFilter: LinearFilter,
	type: FloatType,
	generateMipmaps: true,
};

export interface NgtsCausticsOptions extends Partial<NgtGroup> {
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
	color: ColorRepresentation;
	/** Buffer resolution, default: 2048 */
	resolution: number;
	/** Camera position, it will point towards the contents bounds center, default: [5, 5, 5] */
	lightSource: [x: number, y: number, z: number] | ElementRef<Object3D> | Object3D;
}

const defaultOptions: NgtsCausticsOptions = {
	frames: 1,
	debug: false,
	causticsOnly: false,
	backside: false,
	ior: 1.1,
	backsideIOR: 1.1,
	worldRadius: 0.3125,
	intensity: 0.05,
	color: 'white',
	resolution: 2024,
	lightSource: [5, 5, 5],
};

@Component({
	selector: 'ngts-caustics',
	standalone: true,
	template: `
		<ngt-group #group [parameters]="parameters()">
			<ngt-scene #scene>
				<ngt-orthographic-camera #camera [up]="[0, 1, 0]" />
				<ng-content />
			</ngt-scene>

			<ngt-mesh #plane [renderOrder]="2" [rotation]="[-Math.PI / 2, 0, 0]">
				<ngt-plane-geometry />
				<ngt-caustics-projection-material
					[transparent]="false"
					[color]="color()"
					[causticsTexture]="causticsTarget().texture"
					[causticsTextureB]="causticsTargetB().texture"
					[blending]="CustomBlending"
					[blendSrc]="OneFactor"
					[blendDst]="SrcAlphaFactor"
					[depthWrite]="false"
				/>

				@if (debug()) {
					<ngts-edges>
						<ngt-line-basic-material color="#ffff00" [toneMapped]="false" />
					</ngts-edges>
				}
			</ngt-mesh>
		</ngt-group>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtsEdges],
})
export class NgtsCaustics {
	protected readonly Math = Math;
	protected readonly CustomBlending = CustomBlending;
	protected readonly OneFactor = OneFactor;
	protected readonly SrcAlphaFactor = SrcAlphaFactor;

	options = input(defaultOptions, { transform: mergeInputs(defaultOptions) });
	parameters = omit(this.options, [
		'frames',
		'debug',
		'causticsOnly',
		'backside',
		'ior',
		'backsideIOR',
		'worldRadius',
		'intensity',
		'color',
		'resolution',
		'lightSource',
	]);

	debug = pick(this.options, 'debug');
	color = pick(this.options, 'color');
	private resolution = pick(this.options, 'resolution');

	group = viewChild.required<ElementRef<Group>>('group');
	private scene = viewChild.required<ElementRef<Scene>>('scene');
	private camera = viewChild.required<ElementRef<OrthographicCamera>>('camera');
	private plane = viewChild.required<ElementRef<Mesh<PlaneGeometry, CausticsProjectionMaterialType>>>('plane');

	private causticsTargetParams = computed(() => ({
		width: this.resolution(),
		height: this.resolution(),
		settings: CAUSTIC_OPTIONS,
	}));
	causticsTarget = injectFBO(this.causticsTargetParams);
	causticsTargetB = injectFBO(this.causticsTargetParams);

	constructor() {
		extend({ CausticsProjectionMaterial, Group, Scene, Mesh, PlaneGeometry, LineBasicMaterial, OrthographicCamera });

		const autoEffect = injectAutoEffect();

		const cameraHelper = injectHelper(
			() => (this.debug() ? this.camera().nativeElement : null),
			() => CameraHelper,
		);

		const normalTargetParams = computed(() => ({
			width: this.resolution(),
			height: this.resolution(),
			settings: NORMAL_OPTIONS,
		}));

		// Buffers for front and back faces
		const normalTarget = injectFBO(normalTargetParams);
		const normalTargetB = injectFBO(normalTargetParams);

		// Normal materials for front and back faces
		const normalMat = createNormalMaterial();
		const normalMatB = createNormalMaterial(BackSide);

		// The quad that catches the caustics
		const causticsMaterial = new CausticsMaterial() as CausticsMaterialType;
		const causticsQuad = new FullScreenQuad(causticsMaterial);

		afterNextRender(() => {
			autoEffect(() => {
				// track all changes
				this.options();
				const [group, scene, plane] = [
					this.group().nativeElement,
					this.scene().nativeElement,
					this.plane().nativeElement,
				];
				const groupLocalState = getLocalState(group);
				const sceneLocalState = getLocalState(scene);
				const planeLocalState = getLocalState(plane);

				if (!groupLocalState || !sceneLocalState || !planeLocalState) return;

				groupLocalState.objects();
				sceneLocalState.objects();
				planeLocalState.objects();
				planeLocalState.nonObjects();

				group.updateWorldMatrix(false, true);
			});
		});

		let count = 0;

		const v = new Vector3();
		const lpF = new Frustum();
		const lpM = new Matrix4();
		const lpP = new Plane();

		const lightDir = new Vector3();
		const lightDirInv = new Vector3();
		const bounds = new Box3();
		const focusPos = new Vector3();

		const boundsVertices: Vector3[] = [];
		const worldVerts: Vector3[] = [];
		const projectedVerts: Vector3[] = [];
		const lightDirs: Vector3[] = [];

		for (let i = 0; i < 8; i++) {
			boundsVertices.push(new Vector3());
			worldVerts.push(new Vector3());
			projectedVerts.push(new Vector3());
			lightDirs.push(new Vector3());
		}

		const cameraPos = new Vector3();

		injectBeforeRender(({ gl }) => {
			const [
				{ frames, lightSource, debug, intensity, resolution, worldRadius, backside, backsideIOR, ior, causticsOnly },
				group,
				scene,
				camera,
				plane,
				causticsTarget,
				causticsTargetB,
			] = [
				this.options(),
				this.group().nativeElement,
				this.scene().nativeElement,
				this.camera().nativeElement,
				this.plane().nativeElement,
				this.causticsTarget(),
				this.causticsTargetB(),
			];

			if (frames === Infinity || count++ < frames) {
				if (Array.isArray(lightSource)) lightDir.fromArray(lightSource).normalize();
				else {
					const _lightSource = resolveRef(lightSource);
					if (_lightSource) {
						lightDir.copy(group.worldToLocal(_lightSource.getWorldPosition(v)).normalize());
					}
				}

				lightDirInv.copy(lightDir).multiplyScalar(-1);

				scene.parent?.matrixWorld.identity();
				bounds.setFromObject(scene, true);
				boundsVertices[0].set(bounds.min.x, bounds.min.y, bounds.min.z);
				boundsVertices[1].set(bounds.min.x, bounds.min.y, bounds.max.z);
				boundsVertices[2].set(bounds.min.x, bounds.max.y, bounds.min.z);
				boundsVertices[3].set(bounds.min.x, bounds.max.y, bounds.max.z);
				boundsVertices[4].set(bounds.max.x, bounds.min.y, bounds.min.z);
				boundsVertices[5].set(bounds.max.x, bounds.min.y, bounds.max.z);
				boundsVertices[6].set(bounds.max.x, bounds.max.y, bounds.min.z);
				boundsVertices[7].set(bounds.max.x, bounds.max.y, bounds.max.z);

				for (let i = 0; i < 8; i++) {
					worldVerts[i].copy(boundsVertices[i]);
				}

				bounds.getCenter(focusPos);
				boundsVertices.forEach((v) => v.sub(focusPos));
				const lightPlane = lpP.set(lightDirInv, 0);

				boundsVertices.forEach((v, i) => lightPlane.projectPoint(v, projectedVerts[i]));

				const centralVert = projectedVerts
					.reduce((a, b) => a.add(b), v.set(0, 0, 0))
					.divideScalar(projectedVerts.length);
				const radius = projectedVerts.map((v) => v.distanceTo(centralVert)).reduce((a, b) => Math.max(a, b));
				const dirLength = boundsVertices.map((x) => x.dot(lightDir)).reduce((a, b) => Math.max(a, b));
				// Shadows
				camera.position.copy(cameraPos.copy(lightDir).multiplyScalar(dirLength).add(focusPos));
				camera.lookAt(scene.localToWorld(focusPos));
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
				const groundProjectedCoords = worldVerts.map((v, i) =>
					v.add(lightDirs[i].copy(lightDir).multiplyScalar(-v.y / lightDir.y)),
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

				if (debug) cameraHelper()?.update();

				// Inject uniforms
				normalMatB.viewMatrix.value = normalMat.viewMatrix.value = camera.matrixWorldInverse;

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

				// // Render front face normals
				gl.setRenderTarget(normalTarget());
				gl.clear();
				scene.overrideMaterial = normalMat;
				gl.render(scene, camera);

				// // Render back face normals, if enabled
				gl.setRenderTarget(normalTargetB());
				gl.clear();
				if (backside) {
					scene.overrideMaterial = normalMatB;
					gl.render(scene, camera);
				}

				// // Remove the override material
				scene.overrideMaterial = null;

				// Render front face caustics
				causticsMaterial.ior = ior;
				plane.material.lightProjMatrix = camera.projectionMatrix;
				plane.material.lightViewMatrix = camera.matrixWorldInverse;
				causticsMaterial.normalTexture = normalTarget().texture;
				causticsMaterial.depthTexture = normalTarget().depthTexture;
				gl.setRenderTarget(causticsTarget);
				gl.clear();
				causticsQuad.render(gl);

				// Render back face caustics, if enabled
				causticsMaterial.ior = backsideIOR;
				causticsMaterial.normalTexture = normalTargetB().texture;
				causticsMaterial.depthTexture = normalTargetB().depthTexture;
				gl.setRenderTarget(causticsTargetB);
				gl.clear();
				if (backside) causticsQuad.render(gl);

				// Reset render target
				gl.setRenderTarget(null);

				// Switch the scene off if caustics is all that's wanted
				if (causticsOnly) scene.visible = false;
			}
		});
	}
}
