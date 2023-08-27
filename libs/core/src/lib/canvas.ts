import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
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
	computed,
	createEnvironmentInjector,
	effect,
	inject,
	type ComponentRef,
	type EffectRef,
	type OnChanges,
	type OnInit,
	type SimpleChanges,
	type Type,
} from '@angular/core';
import { NgxResize, provideNgxResizeOptions, type NgxResizeResult } from 'ngx-resize';
import * as THREE from 'three';
import { createPointerEvents } from './dom/events';
import type { NgtCamera, NgtDomEvent, NgtEventManager } from './events';
import { injectNgtLoader } from './loader';
import { provideNgtRenderer } from './renderer';
import { injectCanvasRootInitializer, type NgtCanvasConfigurator } from './roots';
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
import { is } from './utils/is';
import { safeDetectChanges } from './utils/safe-detect-changes';
import { signalStore, type NgtSignalStore } from './utils/signal-store';

export type NgtGLOptions =
	| NgtRenderer
	| ((canvas: HTMLCanvasElement) => NgtRenderer)
	| Partial<NgtProperties<THREE.WebGLRenderer> | THREE.WebGLRendererParameters>
	| undefined;

export type NgtCanvasInputs = {
	/** A threejs renderer instance or props that go into the default renderer */
	gl?: NgtGLOptions;
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
	/** Switch off automatic sRGB encoding and gamma correction */
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
		<div (ngxResize)="onResize($event)" style="height: 100%; width: 100%;">
			<canvas #glCanvas style="display: block;"></canvas>
		</div>
	`,
	imports: [NgxResize],
	providers: [provideNgxResizeOptions({ emitInZone: false, emitInitialResult: true }), provideNgtStore()],
	host: {
		style: 'display: block;position: relative;width: 100%;height: 100%;overflow: hidden;',
		'[style.pointerEvents]': 'hbPointerEvents()',
	},
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgtCanvas implements OnInit, OnChanges {
	private store = injectNgtStore();
	private initRoot = injectCanvasRootInitializer();

	private host = inject<ElementRef<HTMLElement>>(ElementRef);
	private viewContainerRef = inject(ViewContainerRef);
	private injector = inject(Injector);
	private environmentInjector = inject(EnvironmentInjector);
	private zone = inject(NgZone);
	private destroyRef = inject(DestroyRef);
	private cdr = inject(ChangeDetectorRef);

	private inputs = signalStore<NgtCanvasInputs>({
		shadows: false,
		linear: false,
		flat: false,
		legacy: false,
		orthographic: false,
		frameloop: 'always',
		dpr: [1, 2],
		events: createPointerEvents,
	});

	@Input({ required: true }) sceneGraph!: Type<unknown>;
	@Input() sceneGraphInputs: NgtAnyRecord = {};
	@Input() compoundPrefixes: string[] = [];

	@Input() set linear(linear: boolean) {
		this.inputs.set({ linear });
	}

	@Input() set legacy(legacy: boolean) {
		this.inputs.set({ legacy });
	}

	@Input() set flat(flat: boolean) {
		this.inputs.set({ flat });
	}

	@Input() set orthographic(orthographic: boolean) {
		this.inputs.set({ orthographic });
	}

	@Input() set frameloop(frameloop: NgtCanvasInputs['frameloop']) {
		this.inputs.set({ frameloop });
	}

	@Input() set dpr(dpr: NgtDpr) {
		this.inputs.set({ dpr });
	}

	@Input() set raycaster(raycaster: Partial<THREE.Raycaster>) {
		this.inputs.set({ raycaster });
	}

	@Input() set shadows(shadows: boolean | Partial<THREE.WebGLShadowMap>) {
		this.inputs.set({ shadows });
	}

	@Input() set camera(camera: NgtCanvasInputs['camera']) {
		this.inputs.set({ camera });
	}

	@Input() set scene(scene: NgtCanvasInputs['scene']) {
		this.inputs.set({ scene });
	}

	@Input() set gl(gl: NgtCanvasInputs['gl']) {
		this.inputs.set({ gl });
	}

	@Input() set eventSource(eventSource: NgtCanvasInputs['eventSource']) {
		this.inputs.set({ eventSource });
	}

	@Input() set eventPrefix(eventPrefix: NgtCanvasInputs['eventPrefix']) {
		this.inputs.set({ eventPrefix });
	}

	@Input() set lookAt(lookAt: NgtCanvasInputs['lookAt']) {
		this.inputs.set({ lookAt });
	}

	@Input() set performance(performance: NgtCanvasInputs['performance']) {
		this.inputs.set({ performance });
	}

	@Output() created = new EventEmitter<NgtState>();

	private inputsEventSource = this.inputs.select('eventSource');
	protected hbPointerEvents = computed(() => (!!this.inputsEventSource() ? 'none' : 'auto'));

	@ViewChild('glCanvas', { static: true }) glCanvas!: ElementRef<HTMLCanvasElement>;

	private resizeEffectRef?: EffectRef;
	private configurator?: NgtCanvasConfigurator;
	private glEnvironmentInjector?: EnvironmentInjector;
	private glRef?: ComponentRef<unknown>;

	ngOnChanges(changes: SimpleChanges): void {
		if (changes['sceneGraphInputs'] && !changes['sceneGraphInputs'].firstChange && this.glRef) {
			this.setSceneGraphInputs();
		}
	}

	ngOnInit() {
		// NOTE: we resolve glCanvas at this point, setup the configurator
		this.configurator = this.initRoot(this.glCanvas.nativeElement);

		this.destroyRef.onDestroy(() => {
			this.glEnvironmentInjector?.destroy();
			this.glRef?.destroy();
			this.resizeEffectRef?.destroy();
			injectNgtLoader.destroy();
			this.configurator?.destroy();
		});
	}

	// NOTE: runs outside of Zone due to emitInZone: false
	onResize(result: NgxResizeResult) {
		if (result.width > 0 && result.height > 0) {
			this.resizeEffectRef?.destroy();

			const inputs = this.inputs.select();
			// NOTE: go back into zone so that effect runs
			// TODO: Double-check when effect is made not depended on zone
			this.resizeEffectRef = this.zone.run(() =>
				effect(
					() => {
						this.zone.runOutsideAngular(() => {
							if (!this.configurator) this.configurator = this.initRoot(this.glCanvas.nativeElement);
							this.configurator.configure({ ...inputs(), size: result });

							if (this.glRef) {
								this.cdr.detectChanges();
							} else {
								this.render();
							}
						});
					},
					{ manualCleanup: true, injector: this.injector },
				),
			);
		}
	}

	private render() {
		this.glEnvironmentInjector?.destroy();
		this.glRef?.destroy();

		// Flag the canvas active, rendering will now begin
		this.store.set((state) => ({ internal: { ...state.internal, active: true } }));

		const inputs = this.inputs.get();
		const state = this.store.get();

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
					const innerState = store.get();
					const x = event[(inputs.eventPrefix + 'X') as keyof NgtDomEvent] as number;
					const y = event[(inputs.eventPrefix + 'Y') as keyof NgtDomEvent] as number;
					innerState.pointer.set((x / innerState.size.width) * 2 - 1, -(y / innerState.size.height) * 2 + 1);
					innerState.raycaster.setFromCamera(innerState.pointer, innerState.camera);
				},
			});
		}

		// emit created event if observed
		if (this.created.observed) {
			// but go back into zone to do so
			this.zone.run(() => {
				this.created.emit(this.store.get());
			});
		}

		if (!this.store.get('events', 'connected')) {
			this.store.get('events').connect?.(this.glCanvas.nativeElement);
		}

		this.glEnvironmentInjector = createEnvironmentInjector(
			[provideNgtRenderer(this.store, this.compoundPrefixes, this.cdr)],
			this.environmentInjector,
		);
		this.glRef = this.viewContainerRef.createComponent(this.sceneGraph, {
			environmentInjector: this.glEnvironmentInjector,
			injector: this.injector,
		});
		this.overrideChangeDetectorRef();
		this.setSceneGraphInputs();
	}

	private overrideChangeDetectorRef() {
		const originalDetectChanges = this.cdr.detectChanges.bind(this.cdr);
		this.cdr.detectChanges = () => {
			originalDetectChanges();
			safeDetectChanges(this.glRef?.changeDetectorRef);
		};
	}

	private setSceneGraphInputs() {
		this.zone.run(() => {
			if (this.glRef) {
				for (const [key, value] of Object.entries(this.sceneGraphInputs)) {
					this.glRef.setInput(key, value);
				}
				this.glRef.changeDetectorRef.detectChanges();
			}
		});
	}
}
