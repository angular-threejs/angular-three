import {
	Component,
	computed,
	CUSTOM_ELEMENTS_SCHEMA,
	effect,
	forwardRef,
	Input,
	Signal,
	untracked,
} from '@angular/core';
import {
	createInjectionToken,
	extend,
	getLocalState,
	injectBeforeRender,
	injectNgtRef,
	injectNgtStore,
	signalStore,
	type NgtGroup,
} from 'angular-three';
import { SoftShadowMaterial, type NgtSoftShadowMaterialState } from 'angular-three-soba/shaders';
import { Group, Mesh, PlaneGeometry } from 'three';
import { ProgressiveLightMap } from './progressive-light-map';

extend({ Group, SoftShadowMaterial, Mesh, PlaneGeometry });

export type NgtsAccumulativeShadowsState = {
	/** How many frames it can render, more yields cleaner results but takes more time, 40 */
	frames: number;
	/** If frames === Infinity blend controls the refresh ratio, 100 */
	blend: number;
	/** Can limit the amount of frames rendered if frames === Infinity, usually to get some performance back once a movable scene has settled, Infinity */
	limit: number;
	/** Scale of the plane,  */
	scale: number;
	/** Temporal accumulates shadows over time which is more performant but has a visual regression over instant results, false  */
	temporal: boolean;
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
};

declare global {
	interface HTMLElementTagNameMap {
		/**
		 * @extends ngt-group
		 */
		'ngts-accumulative-shadows': NgtsAccumulativeShadowsState & NgtGroup;
	}
}

export type NgtsAccumulativeShadowsLightApi = { update: () => void };

export const [injectNgtsAccumulativeShadowsApi, provideNgtsAccumulativeShadowsApi] = createInjectionToken(
	(shadows: NgtsAccumulativeShadows) => shadows.api,
	{ isRoot: false, deps: [forwardRef(() => NgtsAccumulativeShadows)] },
);

@Component({
	selector: 'ngts-accumulative-shadows',
	standalone: true,
	template: `
		<ngt-group ngtCompound>
			<ngt-group [traverse]="nullTraverse" [ref]="accumulativeShadowsRef">
				<ng-content />
			</ngt-group>
			<ngt-mesh [receiveShadow]="true" [ref]="meshRef" [scale]="scale()" [rotation]="[-Math.PI / 2, 0, 0]">
				<ngt-plane-geometry />
				<ngt-soft-shadow-material
					[transparent]="true"
					[depthWrite]="false"
					[toneMapped]="toneMapped()"
					[color]="color()"
					[blend]="colorBlend()"
					[map]="map()"
				/>
			</ngt-mesh>
		</ngt-group>
	`,
	providers: [provideNgtsAccumulativeShadowsApi()],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsAccumulativeShadows {
	private inputs = signalStore<NgtsAccumulativeShadowsState>({
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
		temporal: false,
	});

	nullTraverse = () => null;
	Math = Math;

	@Input() accumulativeShadowsRef = injectNgtRef<THREE.Group>();

	/** How many frames it can render, more yields cleaner results but takes more time, 40 */
	@Input({ alias: 'frames' }) set _frames(frames: number) {
		this.inputs.set({ frames });
	}

	/** If frames === Infinity blend controls the refresh ratio, 100 */
	@Input({ alias: 'blend' }) set _blend(blend: number) {
		this.inputs.set({ blend });
	}

	/** Can limit the amount of frames rendered if frames === Infinity, usually to get some performance back once a movable scene has settled, Infinity */
	@Input({ alias: 'limit' }) set _limit(limit: number) {
		this.inputs.set({ limit });
	}

	/** Scale of the plane,  */
	@Input({ alias: 'scale' }) set _scale(scale: number) {
		this.inputs.set({ scale });
	}

	/** Temporal accumulates shadows over time which is more performant but has a visual regression over instant results, false  */
	@Input({ alias: 'temporal' }) set _temporal(temporal: boolean) {
		this.inputs.set({ temporal });
	}

	/** Opacity of the plane, 1 */
	@Input({ alias: 'opacity' }) set _opacity(opacity: number) {
		this.inputs.set({ opacity });
	}

	/** Discards alpha pixels, 0.65 */
	@Input({ alias: 'alphaTest' }) set _alphaTest(alphaTest: number) {
		this.inputs.set({ alphaTest });
	}

	/** Shadow color, black */
	@Input({ alias: 'color' }) set _color(color: string) {
		this.inputs.set({ color });
	}

	/** Colorblend, how much colors turn to black, 0 is black, 2 */
	@Input({ alias: 'colorBlend' }) set _colorBlend(colorBlend: number) {
		this.inputs.set({ colorBlend });
	}

	/** Buffer resolution, 1024 */
	@Input({ alias: 'resolution' }) set _resolution(resolution: number) {
		this.inputs.set({ resolution });
	}

	/** Texture tonemapping */
	@Input({ alias: 'toneMapped' }) set _toneMapped(toneMapped: boolean) {
		this.inputs.set({ toneMapped });
	}

	meshRef = injectNgtRef<THREE.Mesh<THREE.PlaneGeometry, NgtSoftShadowMaterialState & THREE.ShaderMaterial>>();

	private store = injectNgtStore();
	private gl = this.store.select('gl');
	private scene = this.store.select('scene');
	private camera = this.store.select('camera');
	private invalidate = this.store.select('invalidate');

	private resolution = this.inputs.select('resolution');
	private alphaTest = this.inputs.select('alphaTest');
	private opacity = this.inputs.select('opacity');
	private temporal = this.inputs.select('temporal');
	private blend = this.inputs.select('blend');
	private frames = this.inputs.select('frames');

	pLM = computed(() => new ProgressiveLightMap(untracked(this.gl), untracked(this.scene), this.resolution()));

	scale = this.inputs.select('scale');
	toneMapped = this.inputs.select('toneMapped');
	color = this.inputs.select('color');
	colorBlend = this.inputs.select('colorBlend');
	map = computed(() => this.pLM().progressiveLightMap2.texture);

	api = computed(() => {
		const [pLM, alphaTest, opacity, camera, temporal, blend, frames] = [
			this.pLM(),
			this.alphaTest(),
			this.opacity(),
			this.camera(),
			this.temporal(),
			this.blend(),
			this.frames(),
		];
		const api = {
			lights: new Map<string, Signal<NgtsAccumulativeShadowsLightApi>>(),
			temporal,
			frames: Math.max(2, frames),
			blend: Math.max(2, frames === Infinity ? blend : frames),
			count: 0,
			getMesh: () => this.meshRef.nativeElement,
			reset: () => {
				if (!this.meshRef.nativeElement) return;
				// Clear buffers, reset opacities, set frame count to 0
				pLM.clear();
				const material = this.meshRef.nativeElement.material;
				material.opacity = 0;
				material.alphaTest = 0;
				api.count = 0;
			},
			update: (frames = 1) => {
				if (!this.meshRef.nativeElement) return;
				// Adapt the opacity-blend ratio to the number of frames
				const material = this.meshRef.nativeElement.material;
				if (!api.temporal) {
					material.opacity = opacity;
					material.alphaTest = alphaTest;
				} else {
					material.opacity = Math.min(opacity, material.opacity + opacity / api.blend);
					material.alphaTest = Math.min(alphaTest, material.alphaTest + alphaTest / api.blend);
				}

				// Switch accumulative lights on
				this.accumulativeShadowsRef.nativeElement.visible = true;
				// Collect scene lights and meshes
				pLM.prepare();

				// Update the lightmap and the accumulative lights
				for (let i = 0; i < frames; i++) {
					api.lights.forEach((light) => light().update());
					pLM.update(camera, api.blend);
				}

				// Switch lights off
				this.accumulativeShadowsRef.nativeElement.visible = false;
				// Restore lights and meshes
				pLM.finish();
			},
		};

		return api;
	});

	constructor() {
		this.configure();
		this.resetAndUpdate();
		this.beforeRender();
	}

	private configure() {
		effect(() => {
			const [pLM, mesh] = [this.pLM(), this.meshRef.nativeElement];
			if (!mesh) return;
			pLM.configure(mesh);
		});
	}

	private resetAndUpdate() {
		effect(() => {
			const [, , mesh] = [
				this.inputs.state(),
				getLocalState(untracked(this.scene)).objects(),
				this.meshRef.nativeElement,
			];
			if (!mesh) return;
			const api = untracked(this.api);
			// Reset internals, buffers, ...
			api.reset();
			// Update lightmap
			if (!api.temporal && api.frames !== Infinity) api.update(api.blend);
		});
	}

	private beforeRender() {
		injectBeforeRender(() => {
			const [api, limit] = [this.api(), this.inputs.get('limit')];
			if ((api.temporal || api.frames === Infinity) && api.count < api.frames && api.count < limit) {
				this.invalidate();
				api.update();
				api.count++;
			}
		});
	}
}
