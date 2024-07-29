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
import { CausticsProjectionMaterial, createCausticsUpdate } from 'angular-three-soba/vanilla-exports';
import { injectAutoEffect } from 'ngxtension/auto-effect';
import { mergeInputs } from 'ngxtension/inject-inputs';
import {
	CameraHelper,
	ColorRepresentation,
	CustomBlending,
	FloatType,
	Group,
	LinearFilter,
	LinearMipmapLinearFilter,
	LineBasicMaterial,
	Mesh,
	Object3D,
	OneFactor,
	OrthographicCamera,
	PlaneGeometry,
	Scene,
	SrcAlphaFactor,
	UnsignedByteType,
	Vector3,
} from 'three';

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
					[transparent]="true"
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

	groupRef = viewChild.required<ElementRef<Group>>('group');
	private sceneRef = viewChild.required<ElementRef<Scene>>('scene');
	private cameraRef = viewChild.required<ElementRef<OrthographicCamera>>('camera');
	private planeRef =
		viewChild.required<ElementRef<Mesh<PlaneGeometry, InstanceType<typeof CausticsProjectionMaterial>>>>('plane');

	private normalTargetParams = computed(() => ({
		width: this.resolution(),
		height: this.resolution(),
		settings: NORMAL_OPTIONS,
	}));

	// Buffers for front and back faces
	private normalTarget = injectFBO(this.normalTargetParams);
	private normalTargetB = injectFBO(this.normalTargetParams);

	private causticsTargetParams = computed(() => ({
		width: this.resolution(),
		height: this.resolution(),
		settings: CAUSTIC_OPTIONS,
	}));
	causticsTarget = injectFBO(this.causticsTargetParams);
	causticsTargetB = injectFBO(this.causticsTargetParams);

	private cameraHelper = injectHelper(
		() => (this.debug() ? this.cameraRef().nativeElement : null),
		() => CameraHelper,
	);

	constructor() {
		extend({ CausticsProjectionMaterial, Group, Scene, Mesh, PlaneGeometry, LineBasicMaterial, OrthographicCamera });

		const autoEffect = injectAutoEffect();

		const update = createCausticsUpdate(() => {
			const { lightSource, ...rest } = this.options();

			return {
				params: Object.assign(rest, {
					lightSource: Array.isArray(lightSource) ? new Vector3(...lightSource) : resolveRef(lightSource),
				}),
				normalTarget: this.normalTarget(),
				normalTargetB: this.normalTargetB(),
				causticsTarget: this.causticsTarget(),
				causticsTargetB: this.causticsTargetB(),
				camera: this.cameraRef().nativeElement,
				scene: this.sceneRef().nativeElement,
				group: this.groupRef().nativeElement,
				plane: this.planeRef().nativeElement,
				helper: this.cameraHelper(),
			};
		});

		injectBeforeRender(({ gl }) => update(gl));

		afterNextRender(() => {
			autoEffect(() => {
				// track all changes
				this.options();
				const [group, scene, plane] = [
					this.groupRef().nativeElement,
					this.sceneRef().nativeElement,
					this.planeRef().nativeElement,
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
	}
}
