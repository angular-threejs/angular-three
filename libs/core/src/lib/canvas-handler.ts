import {
	booleanAttribute,
	ComponentRef,
	computed,
	DestroyRef,
	Directive,
	ElementRef,
	EnvironmentInjector,
	inject,
	Injector,
	input,
	NgZone,
	output,
	Type,
	viewChild,
	ViewContainerRef,
} from '@angular/core';
import { outputFromObservable } from '@angular/core/rxjs-interop';
import { injectAutoEffect } from 'ngxtension/auto-effect';
import {
	Camera,
	OrthographicCamera,
	PerspectiveCamera,
	Raycaster,
	Scene,
	Vector3,
	WebGLRenderer,
	WebGLRendererParameters,
	WebGLShadowMap,
} from 'three';
import { createPointerEvents } from './dom/events';
import { NgtCamera, NgtEventManager } from './events';
import { injectCanvasRootInitializer, NgtCanvasConfigurator, NgtCanvasElement } from './roots';
import { NgtRoutedScene } from './routed-scene';
import { injectStore, NgtDpr, NgtPerformance, NgtRendererLike, NgtSize, NgtState } from './store';
import { NgtObject3DNode } from './three-types';
import { NgtProperties } from './types';
import { NgtSignalStore } from './utils/signal-store';

export type NgtGLOptions =
	| NgtRendererLike
	| ((canvas: NgtCanvasElement) => NgtRendererLike)
	| Partial<NgtProperties<WebGLRenderer> | WebGLRendererParameters>
	| undefined;

export interface NgtCanvasOptions {
	/** A threejs renderer instance or props that go into the default renderer */
	gl?: NgtGLOptions;
	/** Dimensions to fit the renderer to. Will measure canvas dimensions if omitted */
	size?: NgtSize;
	/**
	 * Enables shadows (by default PCFsoft). Can accept `gl.shadowMap` options for fine-tuning,
	 * but also strings: 'basic' | 'percentage' | 'soft' | 'variance'.
	 * @see https://threejs.org/docs/#api/en/renderers/WebGLRenderer.shadowMap
	 */
	shadows?: boolean | 'basic' | 'percentage' | 'soft' | 'variance' | Partial<WebGLShadowMap>;
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
	raycaster?: Partial<Raycaster>;
	/** A `Scene` instance or props that go into the default scene */
	scene?: Scene | Partial<Scene>;
	/** A `Camera` instance or props that go into the default camera */
	camera?: (
		| NgtCamera
		| Partial<
				NgtObject3DNode<Camera, typeof Camera> &
					NgtObject3DNode<PerspectiveCamera, typeof PerspectiveCamera> &
					NgtObject3DNode<OrthographicCamera, typeof OrthographicCamera>
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
	lookAt?: Vector3 | Parameters<Vector3['set']>;
}

@Directive()
export abstract class NgtCanvasHandler {
	protected store = injectStore();
	protected initRoot = injectCanvasRootInitializer();
	protected autoEffect = injectAutoEffect();

	protected host = inject<ElementRef<HTMLElement>>(ElementRef);
	protected viewContainerRef = inject(ViewContainerRef);
	protected zone = inject(NgZone);
	protected environmentInjector = inject(EnvironmentInjector);
	protected injector = inject(Injector);

	sceneGraph = input.required<Type<any>, Type<any> | 'routed'>({
		transform: (value) => {
			if (value === 'routed') return NgtRoutedScene;
			return value;
		},
	});
	gl = input<NgtGLOptions>();
	size = input<NgtSize>();
	shadows = input(false, {
		transform: (value) => {
			if (value === '') return booleanAttribute(value);
			return value as NonNullable<NgtCanvasOptions['shadows']>;
		},
	});
	legacy = input(false, { transform: booleanAttribute });
	linear = input(false, { transform: booleanAttribute });
	flat = input(false, { transform: booleanAttribute });
	orthographic = input(false, { transform: booleanAttribute });
	frameloop = input<NonNullable<NgtCanvasOptions['frameloop']>>('always');
	performance = input<Partial<Omit<NgtPerformance, 'regress'>>>();
	dpr = input<NgtDpr>([1, 2]);
	raycaster = input<Partial<Raycaster>>();
	scene = input<Scene | Partial<Scene>>();
	camera = input<NonNullable<NgtCanvasOptions['camera']>>();
	events = input(createPointerEvents);
	eventSource = input<HTMLElement | ElementRef<HTMLElement>>();
	eventPrefix = input<NonNullable<NgtCanvasOptions['eventPrefix']>>('offset');
	lookAt = input<Vector3 | Parameters<Vector3['set']>>();
	created = output<NgtState>();
	pointerMissed = outputFromObservable(this.store.get('pointerMissed$'));

	glCanvas = viewChild.required<ElementRef<HTMLCanvasElement>>('glCanvas');
	glCanvasViewContainerRef = viewChild.required('glCanvas', { read: ViewContainerRef });

	protected hbPointerEvents = computed(() => (this.eventSource() ? 'none' : 'auto'));

	protected configurator?: NgtCanvasConfigurator;
	protected glEnvironmentInjector?: EnvironmentInjector;
	protected glRef?: ComponentRef<unknown>;

	protected constructor() {
		inject(DestroyRef).onDestroy(() => {
			this.glRef?.destroy();
			this.glEnvironmentInjector?.destroy();
			this.configurator?.destroy();
		});
	}
}
