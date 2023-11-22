import {
	ChangeDetectionStrategy,
	Component,
	DestroyRef,
	ElementRef,
	EnvironmentInjector,
	Injector,
	Input,
	NgZone,
	Type,
	ViewChild,
	afterNextRender,
	inject,
	signal,
	type ComponentRef,
} from '@angular/core';
import { injectAutoEffect } from 'ngxtension/auto-effect';
import { NgxResize, provideResizeOptions, type ResizeOptions, type ResizeResult } from 'ngxtension/resize';
import * as THREE from 'three';
import type { NgtCamera, NgtEventManager } from './events';
import { injectCanvasRootInitializer, type NgtCanvasConfigurator, type NgtCanvasElement } from './roots';
import {
	injectNgtStore,
	provideNgtStore,
	type NgtDpr,
	type NgtPerformance,
	type NgtRenderer,
	type NgtSize,
	type NgtState,
} from './store';
import type { NgtObject3DNode } from './three-types';
import type { NgtAnyRecord, NgtProperties } from './types';
import type { NgtSignalStore } from './utils/signal-store';

export type NgtGLOptions =
	| NgtRenderer
	| ((canvas: NgtCanvasElement) => NgtRenderer)
	| Partial<NgtProperties<THREE.WebGLRenderer> | THREE.WebGLRendererParameters>
	| undefined;

export type NgtCanvasInputs = {
	/** A threejs renderer instance or props that go into the default renderer */
	gl?: NgtGLOptions;
	/** Dimensions to fit the renderer to. Will measure canvas dimensions if omitted */
	size?: NgtSize;
	/**
	 * Enables shadows (by default PCFsoft). Can accept `gl.shadowMap` options for fine-tuning,
	 * but also strings: 'basic' | 'percentage' | 'soft' | 'variance'.
	 * @see https://threejs.org/docs/#api/en/renderers/WebGLRenderer.shadowMap
	 */
	shadows?: boolean | 'basic' | 'percentage' | 'soft' | 'variance' | Partial<THREE.WebGLShadowMap>;
	/**
	 * Disables three r139 color management.
	 * @see https://threejs.org/docs/#manual/en/introduction/Color-management
	 */
	legacy?: boolean;
	/** Switch off automatic sRGB color space and gamma correction */
	linear?: boolean;
	/** Use `THREE.NoToneMapping` instead of `THREE.ACESFilmicToneMapping` */
	flat?: boolean;
	/** Creates an orthographic camera */
	orthographic?: boolean;
	/**
	 * R3F's render mode. Set to `demand` to only render on state change or `never` to take control.
	 * @see https://docs.pmnd.rs/react-three-fiber/advanced/scaling-performance#on-demand-rendering
	 */
	frameloop?: 'always' | 'demand' | 'never';
	/**
	 * R3F performance options for adaptive performance.
	 * @see https://docs.pmnd.rs/react-three-fiber/advanced/scaling-performance#movement-regression
	 */
	performance?: Partial<Omit<NgtPerformance, 'regress'>>;
	/** Target pixel ratio. Can clamp between a range: `[min, max]` */
	dpr?: NgtDpr;
	/** Props that go into the default raycaster */
	raycaster?: Partial<THREE.Raycaster>;
	/** A `THREE.Scene` instance or props that go into the default scene */
	scene?: THREE.Scene | Partial<THREE.Scene>;
	/** A `Camera` instance or props that go into the default camera */
	camera?: (
		| NgtCamera
		| Partial<
				NgtObject3DNode<THREE.Camera, typeof THREE.Camera> &
					NgtObject3DNode<THREE.PerspectiveCamera, typeof THREE.PerspectiveCamera> &
					NgtObject3DNode<THREE.OrthographicCamera, typeof THREE.OrthographicCamera>
		  >
	) & {
		/** Flags the camera as manual, putting projection into your own hands */
		manual?: boolean;
	};
	/** An R3F event manager to manage elements' pointer events */
	events?: (store: NgtSignalStore<NgtState>) => NgtEventManager<HTMLElement>;
	/** The target where events are being subscribed to, default: the div that wraps canvas */
	eventSource?: HTMLElement | ElementRef<HTMLElement>;
	/** The event prefix that is cast into canvas pointer x/y events, default: "offset" */
	eventPrefix?: 'offset' | 'client' | 'page' | 'layer' | 'screen';
	/** Default coordinate for the camera to look at */
	lookAt?: THREE.Vector3 | Parameters<THREE.Vector3['set']>;
};

@Component({
	selector: 'ngt-canvas',
	standalone: true,
	template: `
		<div (ngxResize)="resizeResult.set($event)" style="height: 100%; width: 100%;">
			<canvas #glCanvas style="display: block;"></canvas>
		</div>
	`,
	imports: [NgxResize],
	providers: [provideResizeOptions({ emitInZone: false, emitInitialResult: true } as ResizeOptions), provideNgtStore()],
	host: {
		style: 'display: block;position: relative;width: 100%;height: 100%;overflow: hidden;',
		// '[style.pointerEvents]': 'hbPointerEvents()',
	},
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgtCanvas {
	private store = injectNgtStore();
	private initRoot = injectCanvasRootInitializer();
	private autoEffect = injectAutoEffect();

	private zone = inject(NgZone);
	private environmentInjector = inject(EnvironmentInjector);
	private injector = inject(Injector);

	@Input({ required: true }) sceneGraph!: Type<unknown>;

	private sceneGraphInputs = signal<NgtAnyRecord>({});
	@Input({ alias: 'sceneGraphInputs' }) set _sceneGraphInputs(value: NgtAnyRecord) {
		this.sceneGraphInputs.set(value);
	}

	@ViewChild('glCanvas', { static: true }) glCanvas!: ElementRef<HTMLCanvasElement>;

	// NOTE: this signal is updated outside of Zone
	protected resizeResult = signal<ResizeResult>({} as ResizeResult);

	private configurator?: NgtCanvasConfigurator;
	private glEnvironmentInjector?: EnvironmentInjector;
	private glRef?: ComponentRef<unknown>;

	constructor() {
		afterNextRender(() => {
			this.configurator = this.initRoot(this.glCanvas.nativeElement);

			this.zone.runOutsideAngular(() => {
				this.noZoneResizeEffect();
				this.noZoneSceneGraphInputsEffect();
			});
		});

		inject(DestroyRef).onDestroy(() => {
			this.glEnvironmentInjector?.destroy();
			this.glRef?.destroy();
			this.configurator?.destroy();
		});
	}

	private noZoneResizeEffect() {
		this.autoEffect(() => {
			const resizeResult = this.resizeResult();
			if (resizeResult.width > 0 && resizeResult.height > 0) {
				if (!this.configurator) this.configurator = this.initRoot(this.glCanvas.nativeElement);
				// this.configurator.configure({ ...inputs(), size: result });

				if (this.glRef) {
				} else {
					this.noZoneRender();
				}
			}
		});
	}

	private noZoneRender() {
		// NOTE: destroy previous instances if existed
		this.glEnvironmentInjector?.destroy();
		this.glRef?.destroy();

		// NOTE: Flag the canvas active, rendering will now begin
		this.store.update((state) => ({ internal: { ...state.internal, active: true } }));
	}

	private noZoneSceneGraphInputsEffect() {
		this.autoEffect(() => {
			this.setSceneGraphInputs(this.sceneGraphInputs());
		});
	}

	private setSceneGraphInputs(sceneGraphInputs: NgtAnyRecord) {
		if (this.glRef) {
			for (const [key, value] of Object.entries(sceneGraphInputs)) {
				this.glRef.setInput(key, value);
			}
		}
	}
}
