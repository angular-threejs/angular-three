import {
	CUSTOM_ELEMENTS_SCHEMA,
	ChangeDetectionStrategy,
	Component,
	DestroyRef,
	ElementRef,
	afterNextRender,
	computed,
	inject,
	input,
	untracked,
	viewChild,
} from '@angular/core';
import { NgtGroup, extend, getLocalState, injectBeforeRender, injectStore, omit, pick } from 'angular-three';
import { ProgressiveLightMap, SoftShadowMaterial } from 'angular-three-soba/vanilla-exports';
import { injectAutoEffect } from 'ngxtension/auto-effect';
import { mergeInputs } from 'ngxtension/inject-inputs';
import { Group, Mesh, PlaneGeometry } from 'three';

export interface NgtsAccumulativeShadowsOptions extends Partial<NgtGroup> {
	/** How many frames it can render, more yields cleaner results but takes more time, 40 */
	frames: number;
	/** If frames === Infinity blend controls the refresh ratio, 100 */
	blend: number;
	/** Can limit the amount of frames rendered if frames === Infinity, usually to get some performance back once a movable scene has settled, Infinity */
	limit: number;
	/** Scale of the plane,  */
	scale: number;
	/** Temporal accumulates shadows over time which is more performant but has a visual regression over instant results, false  */
	temporal?: boolean;
	/** Opacity of the plane, 1 */
	opacity: number;
	/** Discards alpha pixels, 0.65 */
	alphaTest: number;
	/** Shadow color, black */
	color: string;
	/** Colorblend, how much colors turn to black, 0 is black, 2 */
	colorBlend: number;
	/** Buffer resolution, 1024 */
	resolution: number;
	/** Texture tonemapping */
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

@Component({
	selector: 'ngts-accumulative-shadows',
	standalone: true,
	template: `
		<ngt-group [parameters]="parameters()">
			<ngt-group #lights [traverse]="nullTraversal">
				<ng-content />
			</ngt-group>

			<ngt-mesh #plane [scale]="scale()" [rotation]="[-Math.PI / 2, 0, 0]" [receiveShadow]="true">
				<ngt-plane-geometry />
				<ngt-soft-shadow-material
					[depthWrite]="false"
					[toneMapped]="toneMapped()"
					[color]="color()"
					[blend]="colorBlend()"
					[map]="map()"
					[transparent]="true"
				/>
			</ngt-mesh>
		</ngt-group>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgtsAccumulativeShadows {
	nullTraversal = () => null;
	Math = Math;

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

	lightsRef = viewChild.required<ElementRef<Group>>('lights');
	planeRef = viewChild.required<ElementRef<Mesh<PlaneGeometry, InstanceType<typeof SoftShadowMaterial>>>>('plane');

	private store = injectStore();
	private gl = this.store.select('gl');
	private camera = this.store.select('camera');
	private scene = this.store.select('scene');
	private invalidate = this.store.select('invalidate');

	private opacity = pick(this.options, 'opacity');
	private alphaTest = pick(this.options, 'alphaTest');
	private limit = pick(this.options, 'limit');
	private resolution = pick(this.options, 'resolution');

	private previousPLM: ProgressiveLightMap | undefined;
	private pLM = computed(() => {
		if (this.previousPLM) {
			this.previousPLM.clear();
		}
		return (this.previousPLM = new ProgressiveLightMap(this.gl(), this.scene(), this.resolution()));
	});

	scale = pick(this.options, 'scale');
	toneMapped = pick(this.options, 'toneMapped');
	color = pick(this.options, 'color');
	colorBlend = pick(this.options, 'colorBlend');
	map = computed(() => this.pLM().progressiveLightMap2.texture);

	lightsMap = new Map<string, () => void>();
	temporal = computed(() => !!this.options().temporal);
	frames = computed(() => Math.max(2, this.options().frames));
	blend = computed(() =>
		Math.max(2, this.options().frames === Infinity ? this.options().blend : this.options().frames),
	);
	count = 0;

	constructor() {
		extend({ Group, SoftShadowMaterial, Mesh, PlaneGeometry });

		const autoEffect = injectAutoEffect();

		afterNextRender(() => {
			this.pLM().configure(this.planeRef().nativeElement);

			autoEffect(() => {
				const sceneLS = getLocalState(this.scene());
				if (!sceneLS) return;
				// track deps
				this.planeRef();
				this.options();
				sceneLS.objects();

				// Reset internals, buffers, ...
				this.reset();
				// Update lightmap
				if (!this.temporal() && this.frames() !== Infinity) this.update(this.blend());
			});
		});

		injectBeforeRender(() => {
			const [frames, temporal, invalidate, limit] = [this.frames(), !!this.temporal(), this.invalidate(), this.limit()];
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

	getMesh() {
		return this.planeRef().nativeElement;
	}

	reset() {
		// Clear buffers, reset opacities, set frame count to 0
		untracked(this.pLM).clear();
		const material = untracked(this.planeRef).nativeElement.material;
		material.opacity = 0;
		material.alphaTest = 0;
		this.count = 0;
	}

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
			this.pLM().update(this.camera(), this.blend());
		}
		// Switch lights off
		this.lightsRef().nativeElement.visible = false;
		// Restore lights and meshes
		this.pLM().finish();
	}
}
