import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EffectRef,
	ElementRef,
	EventEmitter,
	Input,
	NgZone,
	OnChanges,
	OnInit,
	Output,
	Type,
	ViewChild,
	ViewContainerRef,
	computed,
	effect,
	inject,
} from '@angular/core';
import { NgxResize, provideNgxResizeOptions, type NgxResizeResult } from 'ngx-resize';
import * as THREE from 'three';
import { injectNgtRoots } from './di';
import { createPointerEvents } from './dom-events';
import type { NgtCamera, NgtEventManager } from './events';
import { provideNgtLoop } from './loop';
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
import { signalStore, type NgtSignalStore } from './utils';

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
			<canvas #glCanvas style="display: block;"> </canvas>
		</div>
	`,
	imports: [NgxResize],
	providers: [
		provideNgtLoop(),
		provideNgtStore(),
		provideNgxResizeOptions({ emitInZone: false, emitInitialResult: true }),
	],
	host: {
		style: 'display: block;position: relative;width: 100%;height: 100%;overflow: hidden;',
		'[style.pointerEvents]': 'hbPointerEvents()',
	},
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgtCanvas implements OnInit, OnChanges {
	private roots = injectNgtRoots();
	private store = injectNgtStore();
	private host = inject<ElementRef<HTMLElement>>(ElementRef);
	private cdr = inject(ChangeDetectorRef);
	private zone = inject(NgZone);

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

	private resizeRef: EffectRef;

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

	@ViewChild('glCanvas', { static: true }) glCanvas!: ElementRef<HTMLCanvasElement>;
	@ViewChild('glCanvas', { static: true, read: ViewContainerRef }) glAnchor!: ViewContainerRef;

	protected hbPointerEvents = computed(() =>
		this.inputs.select('eventSource')() !== this.host.nativeElement ? 'none' : 'auto',
	);

	ngOnInit() {
		// NOTE: set roots
		this.roots.set(this.glCanvas.nativeElement, this.store);
	}

	// NOTE: invoked outside of Zone due to emitInZone
	onResize({ width, height }: NgxResizeResult) {
		if (this.resizeRef) {
			this.resizeRef.destroy();
		}

		if (width > 0 && height > 0) {
			const inputs = this.inputs.select();
			this.resizeRef = this.zone.run(() => effect(() => {}, { manualCleanup: true, allowSignalWrites: true }));
		}
	}
}
