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
	depthBuffer: true,
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

/**
 * Configuration options for the NgtsCaustics component.
 * Extends the standard ngt-group element options.
 */
export interface NgtsCausticsOptions extends Partial<NgtThreeElements['ngt-group']> {
	/**
	 * How many frames to render. Set to Infinity for continuous runtime rendering.
	 * @default 1
	 */
	frames: number;
	/**
	 * Enables visual debugging cues including camera helper to help stage the scene.
	 * @default false
	 */
	debug: boolean;
	/**
	 * When enabled, displays only caustics and hides the models.
	 * @default false
	 */
	causticsOnly: boolean;
	/**
	 * When enabled, includes back face rendering and enables the backsideIOR property.
	 * @default false
	 */
	backside: boolean;
	/**
	 * The Index of Refraction (IOR) value for front faces.
	 * @default 1.1
	 */
	ior: number;
	/**
	 * The Index of Refraction (IOR) value for back faces.
	 * Only used when backside is enabled.
	 * @default 1.1
	 */
	backsideIOR: number;
	/**
	 * The world-space texel size for caustic calculations.
	 * @default 0.3125
	 */
	worldRadius: number;
	/**
	 * Intensity of the projected caustics effect.
	 * @default 0.05
	 */
	intensity: number;
	/**
	 * Color of the caustics effect.
	 * @default 'white'
	 */
	color: THREE.ColorRepresentation;
	/**
	 * Buffer resolution for caustic texture rendering.
	 * @default 2024
	 */
	resolution: number;
	/**
	 * Light source position or object. Can be a coordinate array or a reference to a Three.js object.
	 * The light will point towards the contents' bounding box center.
	 * @default [5, 5, 5]
	 */
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

/**
 * A component that renders realistic caustic light patterns on surfaces.
 * Caustics are the light patterns created when light is refracted or reflected
 * by curved transparent surfaces (like water or glass).
 *
 * The component renders the scene from a light's perspective to calculate
 * where light rays converge, then projects these patterns onto a plane.
 *
 * @example
 * ```html
 * <ngts-caustics [options]="{ frames: Infinity, intensity: 0.05, color: 'white' }">
 *   <ngt-mesh>
 *     <ngt-sphere-geometry />
 *     <ngt-mesh-physical-material [transmission]="1" [roughness]="0" />
 *   </ngt-mesh>
 * </ngts-caustics>
 * ```
 */
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

	/** Configuration options for the caustics effect. */
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

	/** Reference to the main group element containing the caustics setup. */
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
