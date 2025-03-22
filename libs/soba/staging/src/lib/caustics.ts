import {
	ChangeDetectionStrategy,
	Component,
	computed,
	CUSTOM_ELEMENTS_SCHEMA,
	effect,
	ElementRef,
	input,
	viewChild,
} from '@angular/core';
import { beforeRender, extend, getInstanceState, NgtThreeElements, omit, pick, resolveRef } from 'angular-three';
import { helper, NgtsEdges } from 'angular-three-soba/abstractions';
import { fbo } from 'angular-three-soba/misc';
import { CausticsProjectionMaterial, createCausticsUpdate } from 'angular-three-soba/vanilla-exports';
import { mergeInputs } from 'ngxtension/inject-inputs';
import * as THREE from 'three';
import { Group, LineBasicMaterial, Mesh, OrthographicCamera, PlaneGeometry, Scene } from 'three';

const NORMAL_OPTIONS = {
	depth: true,
	minFilter: THREE.LinearFilter,
	magFilter: THREE.LinearFilter,
	type: THREE.UnsignedByteType,
};

const CAUSTIC_OPTIONS = {
	minFilter: THREE.LinearMipmapLinearFilter,
	magFilter: THREE.LinearFilter,
	type: THREE.FloatType,
	generateMipmaps: true,
};

export interface NgtsCausticsOptions extends Partial<NgtThreeElements['ngt-group']> {
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
	lightSource:
		| [x: number, y: number, z: number]
		| ElementRef<THREE.Object3D | NgtThreeElements['ngt-object3D']>
		| THREE.Object3D
		| NgtThreeElements['ngt-object3D'];
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
	template: `
		<ngt-group #group [parameters]="parameters()">
			<ngt-scene #scene>
				<ngt-orthographic-camera #camera [up]="[0, 1, 0]" />
				<ng-content />
			</ngt-scene>

			<ngt-mesh #plane [renderOrder]="2" [rotation]="[-Math.PI / 2, 0, 0]">
				<ngt-plane-geometry />
				<ngt-caustics-projection-material
					transparent
					[color]="color()"
					[causticsTexture]="causticsTarget.texture"
					[causticsTextureB]="causticsTargetB.texture"
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
	protected readonly CustomBlending = THREE.CustomBlending;
	protected readonly OneFactor = THREE.OneFactor;
	protected readonly SrcAlphaFactor = THREE.SrcAlphaFactor;

	options = input(defaultOptions, { transform: mergeInputs(defaultOptions) });
	protected parameters = omit(this.options, [
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

	protected debug = pick(this.options, 'debug');
	protected color = pick(this.options, 'color');
	private resolution = pick(this.options, 'resolution');

	groupRef = viewChild.required<ElementRef<THREE.Group>>('group');
	private sceneRef = viewChild.required<ElementRef<THREE.Scene>>('scene');
	private cameraRef = viewChild.required<ElementRef<THREE.OrthographicCamera>>('camera');
	private planeRef =
		viewChild.required<
			ElementRef<THREE.Mesh<THREE.PlaneGeometry, InstanceType<typeof CausticsProjectionMaterial>>>
		>('plane');

	private normalTargetParams = computed(() => ({
		width: this.resolution(),
		height: this.resolution(),
		settings: NORMAL_OPTIONS,
	}));

	// Buffers for front and back faces
	private normalTarget = fbo(this.normalTargetParams);
	private normalTargetB = fbo(this.normalTargetParams);

	private causticsTargetParams = computed(() => ({
		width: this.resolution(),
		height: this.resolution(),
		settings: CAUSTIC_OPTIONS,
	}));
	protected causticsTarget = fbo(this.causticsTargetParams);
	protected causticsTargetB = fbo(this.causticsTargetParams);

	private cameraHelper = helper(
		() => (this.debug() ? this.cameraRef().nativeElement : null),
		() => THREE.CameraHelper,
	);

	constructor() {
		extend({
			CausticsProjectionMaterial,
			Group,
			Scene,
			Mesh,
			PlaneGeometry,
			LineBasicMaterial,
			OrthographicCamera,
		});

		effect(() => {
			// track all changes
			const [group, scene, plane] = [
				this.groupRef().nativeElement,
				this.sceneRef().nativeElement,
				this.planeRef().nativeElement,
				this.options(),
			];
			const groupInstanceState = getInstanceState(group);
			const sceneInstanceState = getInstanceState(scene);
			const planeInstanceState = getInstanceState(plane);

			if (!groupInstanceState || !sceneInstanceState || !planeInstanceState) return;

			groupInstanceState.objects();
			sceneInstanceState.objects();
			planeInstanceState.objects();
			planeInstanceState.nonObjects();

			group.updateWorldMatrix(false, true);
		});

		const update = createCausticsUpdate(() => {
			const { lightSource, ...rest } = this.options();

			return {
				params: Object.assign(rest, {
					lightSource: Array.isArray(lightSource)
						? new THREE.Vector3(...lightSource)
						: (resolveRef(lightSource) as THREE.Object3D),
				}),
				normalTarget: this.normalTarget,
				normalTargetB: this.normalTargetB,
				causticsTarget: this.causticsTarget,
				causticsTargetB: this.causticsTargetB,
				camera: this.cameraRef().nativeElement,
				scene: this.sceneRef().nativeElement,
				group: this.groupRef().nativeElement,
				plane: this.planeRef().nativeElement,
				helper: this.cameraHelper(),
			};
		});

		beforeRender(({ gl }) => update(gl));
	}
}
