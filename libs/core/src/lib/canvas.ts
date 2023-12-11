import {
	ChangeDetectionStrategy,
	Component,
	DestroyRef,
	ElementRef,
	EnvironmentInjector,
	EventEmitter,
	Injector,
	Input,
	NgZone,
	Output,
	ViewChild,
	ViewContainerRef,
	afterNextRender,
	computed,
	createEnvironmentInjector,
	inject,
	signal,
	untracked,
	type ComponentRef,
	type Type,
} from '@angular/core';
import { injectAutoEffect } from 'ngxtension/auto-effect';
import { NgxResize, provideResizeOptions, type ResizeOptions, type ResizeResult } from 'ngxtension/resize';
import * as THREE from 'three';
import { createPointerEvents } from './dom/events';
import type { NgtCamera, NgtDomEvent, NgtEventManager } from './events';
import { provideNgtRenderer } from './renderer';
import { injectCanvasRootInitializer, type NgtCanvasConfigurator, type NgtCanvasElement } from './roots';
import {
	injectNgtStore,
	provideNgtStore,
	type NgtDpr,
	type NgtPerformance,
	type NgtRendererLike,
	type NgtSize,
	type NgtState,
} from './store';
import type { NgtObject3DNode } from './three-types';
import type { NgtAnyRecord, NgtProperties } from './types';
import { is } from './utils/is';
import { signalStore, type NgtSignalStore } from './utils/signal-store';

export type NgtGLOptions =
	| NgtRendererLike
	| ((canvas: NgtCanvasElement) => NgtRendererLike)
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
	providers: [
		provideResizeOptions({ emitInZone: false, emitInitialResult: true, debounce: 250 } as ResizeOptions),
		provideNgtStore(),
	],
	host: {
		style: 'display: block;position: relative;width: 100%;height: 100%;overflow: hidden;',
		'[style.pointerEvents]': 'hbPointerEvents()',
	},
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgtCanvas {
	private store = injectNgtStore();
	private initRoot = injectCanvasRootInitializer();
	private autoEffect = injectAutoEffect();

	private host = inject<ElementRef<HTMLElement>>(ElementRef);
	private viewContainerRef = inject(ViewContainerRef);
	private zone = inject(NgZone);
	private environmentInjector = inject(EnvironmentInjector);
	private injector = inject(Injector);

	@Input({ required: true }) sceneGraph!: Type<unknown>;
	@Input() compoundPrefixes: string[] = [];

	private sceneGraphInputs = signal<NgtAnyRecord>({}, { equal: Object.is });
	@Input({ alias: 'sceneGraphInputs' }) set _sceneGraphInputs(value: NgtAnyRecord) {
		this.sceneGraphInputs.set(value);
	}

	private canvasInputs = signalStore<NgtCanvasInputs>({
		shadows: false,
		linear: false,
		flat: false,
		legacy: false,
		orthographic: false,
		frameloop: 'always',
		dpr: [1, 2],
		events: createPointerEvents,
	});
	@Input({ alias: 'options' }) set _canvasInputs(value: Partial<NgtCanvasInputs>) {
		this.canvasInputs.update(value);
	}

	@Output() created = new EventEmitter<NgtState>();

	@ViewChild('glCanvas', { static: true }) glCanvas!: ElementRef<HTMLCanvasElement>;

	// NOTE: this signal is updated outside of Zone
	protected resizeResult = signal<ResizeResult>({} as ResizeResult, { equal: Object.is });

	private eventSource = this.canvasInputs.select('eventSource');
	protected hbPointerEvents = computed(() => (!!this.eventSource() ? 'none' : 'auto'));

	private configurator?: NgtCanvasConfigurator;
	private glEnvironmentInjector?: EnvironmentInjector;
	private glRef?: ComponentRef<unknown>;

	constructor() {
		afterNextRender(() => {
			this.zone.runOutsideAngular(() => {
				this.configurator = this.initRoot(this.glCanvas.nativeElement);
				this.noZoneResizeEffect();
				this.noZoneSceneGraphInputsEffect();
			});
		});

		inject(DestroyRef).onDestroy(() => {
			this.glRef?.destroy();
			this.glEnvironmentInjector?.destroy();
			this.configurator?.destroy();
		});
	}

	private noZoneResizeEffect() {
		this.autoEffect(() => {
			const resizeResult = this.resizeResult();
			if (resizeResult.width > 0 && resizeResult.height > 0) {
				if (!this.configurator) this.configurator = this.initRoot(this.glCanvas.nativeElement);
				this.configurator.configure({ ...this.canvasInputs.state(), size: resizeResult });

				untracked(() => {
					if (this.glRef) {
						this.glRef.changeDetectorRef.detectChanges();
					} else {
						this.noZoneRender();
					}
				});
			}
		});
	}

	private noZoneRender() {
		// NOTE: destroy previous instances if existed
		this.glEnvironmentInjector?.destroy();
		this.glRef?.destroy();

		// NOTE: Flag the canvas active, rendering will now begin
		this.store.update((state) => ({ internal: { ...state.internal, active: true } }));

		const [inputs, state] = [this.canvasInputs.snapshot, this.store.snapshot];

		// connect to event source
		state.events.connect?.(
			inputs.eventSource
				? is.ref(inputs.eventSource)
					? inputs.eventSource.nativeElement
					: inputs.eventSource
				: this.host.nativeElement,
		);

		// setup compute for eventPrefix
		if (inputs.eventPrefix) {
			state.setEvents({
				compute: (event, store) => {
					const { pointer, raycaster, camera, size } = store.snapshot;
					const x = event[(inputs.eventPrefix + 'X') as keyof NgtDomEvent] as number;
					const y = event[(inputs.eventPrefix + 'Y') as keyof NgtDomEvent] as number;
					pointer.set((x / size.width) * 2 - 1, -(y / size.height) * 2 + 1);
					raycaster.setFromCamera(pointer, camera);
				},
			});
		}

		// emit created event if observed
		if (this.created.observed) {
			this.created.emit(this.store.snapshot);
		}

		if (!this.store.get('events', 'connected')) {
			this.store.get('events').connect?.(this.glCanvas.nativeElement);
		}

		this.glEnvironmentInjector = createEnvironmentInjector(
			[provideNgtRenderer(this.store, this.compoundPrefixes)],
			this.environmentInjector,
		);
		this.glRef = this.viewContainerRef.createComponent(this.sceneGraph, {
			environmentInjector: this.glEnvironmentInjector,
			injector: this.injector,
		});

		this.glRef.changeDetectorRef.detectChanges();
		this.setSceneGraphInputs(untracked(this.sceneGraphInputs));
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
