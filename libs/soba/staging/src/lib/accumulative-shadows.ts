import {
	CUSTOM_ELEMENTS_SCHEMA,
	ChangeDetectionStrategy,
	Component,
	DestroyRef,
	ElementRef,
	computed,
	effect,
	inject,
	input,
	untracked,
	viewChild,
} from '@angular/core';
import { NgtThreeElements, beforeRender, extend, getInstanceState, injectStore, omit, pick } from 'angular-three';
import { ProgressiveLightMap, SoftShadowMaterial } from 'angular-three-soba/vanilla-exports';
import { mergeInputs } from 'ngxtension/inject-inputs';
import * as THREE from 'three';
import { Group, Mesh, PlaneGeometry } from 'three';

/**
 * Configuration options for the NgtsAccumulativeShadows component.
 * Extends the standard ngt-group element options.
 */
export interface NgtsAccumulativeShadowsOptions extends Partial<NgtThreeElements['ngt-group']> {
	/**
	 * How many frames it can render. More frames yield cleaner results but take more time.
	 * @default 40
	 */
	frames: number;
	/**
	 * If frames === Infinity, blend controls the refresh ratio.
	 * @default 20
	 */
	blend: number;
	/**
	 * Limits the amount of frames rendered when frames === Infinity.
	 * Useful for getting performance back once a movable scene has settled.
	 * @default Infinity
	 */
	limit: number;
	/**
	 * Scale of the shadow plane.
	 * @default 10
	 */
	scale: number;
	/**
	 * When enabled, accumulates shadows over time which is more performant
	 * but has visual regression compared to instant results.
	 * @default false
	 */
	temporal?: boolean;
	/**
	 * Opacity of the shadow plane.
	 * @default 1
	 */
	opacity: number;
	/**
	 * Alpha test threshold for discarding pixels.
	 * @default 0.75
	 */
	alphaTest: number;
	/**
	 * Shadow color.
	 * @default 'black'
	 */
	color: string;
	/**
	 * Color blend factor. Controls how much colors turn to black (0 is fully black).
	 * @default 2
	 */
	colorBlend: number;
	/**
	 * Buffer resolution for shadow rendering.
	 * @default 1024
	 */
	resolution: number;
	/**
	 * Whether the texture is tone mapped.
	 * @default true
	 */
	toneMapped: boolean;
}

const defaultOptions: NgtsAccumulativeShadowsOptions = {
	temporal: false,
	frames: 40,
	limit: Infinity,
	blend: 20,
	scale: 10,
	opacity: 1,
	alphaTest: 0.75,
	color: 'black',
	colorBlend: 2,
	resolution: 1024,
	toneMapped: true,
};

/**
 * A component that renders soft, accumulative shadows by rendering the scene
 * multiple times from the light's perspective and blending the results.
 *
 * This creates high-quality soft shadows that can be accumulated over multiple
 * frames for better visual quality.
 *
 * @example
 * ```html
 * <ngts-accumulative-shadows [options]="{ temporal: true, frames: 100 }">
 *   <ngts-randomized-lights [options]="{ amount: 8, position: [5, 5, -10] }" />
 * </ngts-accumulative-shadows>
 * ```
 */
@Component({
	selector: 'ngts-accumulative-shadows',
	template: `
		<ngt-group [parameters]="parameters()">
			<ngt-group #lights [traverse]="nullTraversal">
				<ng-content />
			</ngt-group>

			<ngt-mesh #plane [scale]="scale()" [rotation]="[-Math.PI / 2, 0, 0]" receiveShadow>
				<ngt-plane-geometry />
				<ngt-soft-shadow-material
					[depthWrite]="false"
					[toneMapped]="toneMapped()"
					[color]="color()"
					[blend]="colorBlend()"
					[map]="map()"
					transparent
				/>
			</ngt-mesh>
		</ngt-group>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgtsAccumulativeShadows {
	protected readonly nullTraversal = () => null;
	protected readonly Math = Math;

	options = input(defaultOptions, { transform: mergeInputs(defaultOptions) });
	parameters = omit(this.options, [
		'temporal',
		'frames',
		'limit',
		'blend',
		'scale',
		'opacity',
		'alphaTest',
		'color',
		'colorBlend',
		'resolution',
		'toneMapped',
	]);

	lightsRef = viewChild.required<ElementRef<THREE.Group>>('lights');
	planeRef =
		viewChild.required<ElementRef<THREE.Mesh<THREE.PlaneGeometry, InstanceType<typeof SoftShadowMaterial>>>>(
			'plane',
		);

	private store = injectStore();

	private opacity = pick(this.options, 'opacity');
	private alphaTest = pick(this.options, 'alphaTest');
	private limit = pick(this.options, 'limit');
	private resolution = pick(this.options, 'resolution');

	private previousPLM: ProgressiveLightMap | undefined;
	private pLM = computed(() => {
		if (this.previousPLM) {
			this.previousPLM.clear();
		}
		return (this.previousPLM = new ProgressiveLightMap(this.store.gl(), this.store.scene(), this.resolution()));
	});

	protected scale = pick(this.options, 'scale');
	protected toneMapped = pick(this.options, 'toneMapped');
	protected color = pick(this.options, 'color');
	protected colorBlend = pick(this.options, 'colorBlend');
	protected map = computed(() => this.pLM().progressiveLightMap2.texture);

	lightsMap = new Map<string, () => void>();
	private temporal = computed(() => !!this.options().temporal);
	private frames = computed(() => Math.max(2, this.options().frames));
	private blend = computed(() =>
		Math.max(2, this.options().frames === Infinity ? this.options().blend : this.options().frames),
	);
	private count = 0;

	constructor() {
		extend({ Group, SoftShadowMaterial, Mesh, PlaneGeometry });

		effect(() => {
			this.pLM().configure(this.planeRef().nativeElement);
		});

		effect((onCleanup) => {
			const sceneInstanceState = getInstanceState(this.store.scene());
			if (!sceneInstanceState) return;

			// track deps
			this.planeRef();
			this.options();
			sceneInstanceState.objects();

			// Reset internals, buffers, ...
			this.reset();
			// Update lightmap

			// TODO: (chau) this is a hack. not sure why a timeout is needed here. if not PLM.update
			//  is erroring out on some scenes.
			let timeout: ReturnType<typeof setTimeout>;

			if (!this.temporal() && this.frames() !== Infinity) {
				const blend = this.blend();
				timeout = setTimeout(() => this.update(blend));
			}

			onCleanup(() => {
				if (timeout) clearTimeout(timeout);
			});
		});

		beforeRender(() => {
			const [frames, temporal, invalidate, limit] = [
				this.frames(),
				!!this.temporal(),
				this.store.snapshot.invalidate,
				this.limit(),
			];
			if ((temporal || frames === Infinity) && this.count < frames && this.count < limit) {
				invalidate();
				this.update();
				this.count++;
			}
		});

		inject(DestroyRef).onDestroy(() => {
			this.previousPLM?.clear();
		});
	}

	/**
	 * Gets the shadow plane mesh element.
	 *
	 * @returns The Three.js mesh element used for rendering shadows
	 */
	getMesh() {
		return this.planeRef().nativeElement;
	}

	/**
	 * Resets the accumulative shadow state.
	 * Clears buffers, resets opacities, and sets the frame count to 0.
	 */
	reset() {
		// Clear buffers, reset opacities, set frame count to 0
		untracked(this.pLM).clear();
		const material = untracked(this.planeRef).nativeElement.material;
		material.opacity = 0;
		material.alphaTest = 0;
		this.count = 0;
	}

	/**
	 * Updates the shadow accumulation by rendering additional frames.
	 *
	 * @param frames - Number of frames to render in this update cycle
	 */
	update(frames = 1) {
		// Adapt the opacity-blend ratio to the number of frames
		const material = this.planeRef().nativeElement.material;
		if (!this.temporal()) {
			material.opacity = this.opacity();
			material.alphaTest = this.alphaTest();
		} else {
			material.opacity = Math.min(this.opacity(), material.opacity + this.opacity() / this.blend());
			material.alphaTest = Math.min(this.alphaTest(), material.alphaTest + this.alphaTest() / this.blend());
		}

		// Switch accumulative lights on
		this.lightsRef().nativeElement.visible = true;
		// Collect scene lights and meshes
		this.pLM().prepare();

		// Update the lightmap and the accumulative lights
		for (let i = 0; i < frames; i++) {
			this.lightsMap.forEach((lightUpdate) => lightUpdate());
			this.pLM().update(this.store.snapshot.camera, this.blend());
		}
		// Switch lights off
		this.lightsRef().nativeElement.visible = false;
		// Restore lights and meshes
		this.pLM().finish();
	}
}
