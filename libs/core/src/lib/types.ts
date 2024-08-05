import { ElementRef, Signal } from '@angular/core';
import { Observable } from 'rxjs';
import {
	Camera,
	Clock,
	EventDispatcher,
	Intersection,
	Object3D,
	OrthographicCamera,
	PerspectiveCamera,
	Ray,
	Raycaster,
	Scene,
	Vector2,
	Vector3,
	WebGLRenderer,
	WebGLRendererParameters,
	WebGLShadowMap,
} from 'three';
import { NgtObject3DNode } from './three-types';
import { NgtSignalStore } from './utils/signal-store';

export type NgtProperties<T> = Pick<T, { [K in keyof T]: T[K] extends (_: any) => any ? never : K }[keyof T]>;
export type NgtAnyRecord = Record<string, any>;

export type NgtEquConfig = {
	/** Compare arrays by reference equality a === b (default), or by shallow equality */
	arrays?: 'reference' | 'shallow';
	/** Compare objects by reference equality a === b (default), or by shallow equality */
	objects?: 'reference' | 'shallow';
	/** If true the keys in both a and b must match 1:1 (default), if false a's keys must intersect b's */
	strict?: boolean;
};

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

export interface NgtIntersection extends Intersection {
	/** The event source (the object which registered the handler) */
	eventObject: Object3D;
}

export interface NgtIntersectionEvent<TSourceEvent> extends NgtIntersection {
	/** The event source (the object which registered the handler) */
	eventObject: Object3D;
	/** An array of intersections */
	intersections: NgtIntersection[];
	/** vec3.set(pointer.x, pointer.y, 0).unproject(camera) */
	unprojectedPoint: Vector3;
	/** Normalized event coordinates */
	pointer: Vector2;
	/** Delta between first click and this event */
	delta: number;
	/** The ray that pierced it */
	ray: Ray;
	/** The camera that was used by the raycaster */
	camera: NgtCamera;
	/** stopPropagation will stop underlying handlers from firing */
	stopPropagation: () => void;
	/** The original host event */
	nativeEvent: TSourceEvent;
	/** If the event was stopped by calling stopPropagation */
	stopped: boolean;
}

export type NgtCamera = OrthographicCamera | PerspectiveCamera;
export type NgtThreeEvent<TEvent> = NgtIntersectionEvent<TEvent> & NgtProperties<TEvent>;
export type NgtDomEvent = PointerEvent | MouseEvent | WheelEvent;

export type NgtEventHandlers = {
	click?: (event: NgtThreeEvent<MouseEvent>) => void;
	contextmenu?: (event: NgtThreeEvent<MouseEvent>) => void;
	dblclick?: (event: NgtThreeEvent<MouseEvent>) => void;
	pointerup?: (event: NgtThreeEvent<PointerEvent>) => void;
	pointerdown?: (event: NgtThreeEvent<PointerEvent>) => void;
	pointerover?: (event: NgtThreeEvent<PointerEvent>) => void;
	pointerout?: (event: NgtThreeEvent<PointerEvent>) => void;
	pointerenter?: (event: NgtThreeEvent<PointerEvent>) => void;
	pointerleave?: (event: NgtThreeEvent<PointerEvent>) => void;
	pointermove?: (event: NgtThreeEvent<PointerEvent>) => void;
	pointermissed?: (event: MouseEvent) => void;
	pointercancel?: (event: NgtThreeEvent<PointerEvent>) => void;
	wheel?: (event: NgtThreeEvent<WheelEvent>) => void;
};

export type NgtEvents = {
	[TEvent in keyof NgtEventHandlers]-?: EventListener;
};

export type NgtFilterFunction = (items: Intersection[], store: NgtSignalStore<NgtState>) => Intersection[];
export type NgtComputeFunction = (
	event: NgtDomEvent,
	root: NgtSignalStore<NgtState>,
	previous: NgtSignalStore<NgtState> | null,
) => void;

export type NgtEventManager<TTarget> = {
	/** Determines if the event layer is active */
	enabled: boolean;
	/** Event layer priority, higher prioritized layers come first and may stop(-propagate) lower layer  */
	priority: number;
	/** The compute function needs to set up the raycaster and an xy- pointer  */
	compute?: NgtComputeFunction;
	/** The filter can re-order or re-structure the intersections  */
	filter?: NgtFilterFunction;
	/** The target node the event layer is tied to */
	connected?: TTarget;
	/** All the pointer event handlers through which the host forwards native events */
	handlers?: NgtEvents;
	/** Allows re-connecting to another target */
	connect?: (target: TTarget) => void;
	/** Removes all existing events handlers from the target */
	disconnect?: () => void;
	/** Triggers a onPointerMove with the last known event. This can be useful to enable raycasting without
	 *  explicit user interaction, for instance when the camera moves a hoverable object underneath the cursor.
	 */
	update?: () => void;
};

export interface NgtPointerCaptureTarget {
	intersection: NgtIntersection;
	target: Element;
}

export type NgtAttachFunction<TChild = any, TParent = any> = (
	parent: TParent,
	child: TChild,
	store: NgtSignalStore<NgtState>,
) => void | (() => void);

export type NgtAttachable<TChild = any, TParent = any> = NgtAttachFunction<TChild, TParent> | string | string[];

export interface NgtAfterAttach<
	TChild extends NgtInstanceNode = NgtInstanceNode,
	TParent extends NgtInstanceNode = NgtInstanceNode,
> {
	parent: TParent;
	node: TChild;
}

export interface NgtLocalInstanceState {
	objects: NgtInstanceNode[];
	nonObjects: NgtInstanceNode[];
	parent: NgtInstanceNode | null;
}

export interface NgtLocalState {
	/** the store of the canvas that the instance is being rendered to */
	store: NgtSignalStore<NgtState>;
	// objects related to this instance
	instanceStore: NgtSignalStore<NgtLocalInstanceState>;
	// shortcut to signals
	parent: Signal<NgtLocalInstanceState['parent']>;
	objects: Signal<NgtLocalInstanceState['objects']>;
	nonObjects: Signal<NgtLocalInstanceState['nonObjects']>;
	// shortcut to add/remove object to list
	add: (instance: NgtInstanceNode, type: 'objects' | 'nonObjects') => void;
	remove: (instance: NgtInstanceNode, type: 'objects' | 'nonObjects') => void;
	setParent: (parent: NgtInstanceNode | null) => void;
	// if this THREE instance is a ngt-primitive
	primitive?: boolean;
	// if this THREE object has any events bound to it
	eventCount: number;
	// list of handlers to handle the events
	handlers: Partial<NgtEventHandlers>;
	// attach information so that we can detach as well as reset
	attach?: string[] | NgtAttachFunction;
	// previously attach information so we can reset as well as clean up
	previousAttach?: unknown | (() => void);
	// is raw value
	isRaw?: boolean;
	// priority for before render
	priority?: number;
	onUpdate?: (node: NgtInstanceNode) => void;
	onAttach?: (afterAttach: NgtAfterAttach) => void;
}

export type NgtInstanceNode<TNode = any> = { __ngt__: NgtLocalState } & NgtAnyRecord & TNode;

export type NgtCanvasElement = HTMLCanvasElement | OffscreenCanvas;
export type NgtGlobalRenderCallback = (timeStamp: number) => void;

export type NgtRendererLike = { render: (scene: Scene, camera: Camera) => any };
export type NgtCameraManual = NgtCamera & { manual?: boolean };
export type NgtDpr = number | [min: number, max: number];
export type NgtSize = { width: number; height: number; top: number; left: number };

export type NgtViewport = NgtSize & {
	/** The initial pixel ratio */
	initialDpr: number;
	/** Current pixel ratio */
	dpr: number;
	/** size.width / viewport.width */
	factor: number;
	/** Camera distance */
	distance: number;
	/** Camera aspect ratio: width / height */
	aspect: number;
};

export type NgtPerformance = {
	/** Current performance normal, between min and max */
	current: number;
	/** How low the performance can go, between 0 and max */
	min: number;
	/** How high the performance can go, between min and max */
	max: number;
	/** Time until current returns to max in ms */
	debounce: number;
	/** Sets current to min, puts the system in regression */
	regress: () => void;
};

export type NgtRenderState = NgtState & { delta: number; frame?: XRFrame };

export type NgtBeforeRenderEvent<TObject extends NgtInstanceNode = NgtInstanceNode> = {
	state: NgtRenderState;
	object: TObject;
};

export type NgtBeforeRenderRecord = {
	callback: (state: NgtRenderState) => void;
	store: NgtSignalStore<NgtState>;
	priority?: number;
};

export type NgtInternalState = {
	active: boolean;
	priority: number;
	frames: number;
	lastEvent: ElementRef<NgtDomEvent | null>;
	interaction: Object3D[];
	hovered: Map<string, NgtThreeEvent<NgtDomEvent>>;
	capturedMap: Map<number, Map<Object3D, NgtPointerCaptureTarget>>;
	initialClick: [x: number, y: number];
	initialHits: Object3D[];
	subscribers: NgtBeforeRenderRecord[];
	subscribe: (
		callback: NgtBeforeRenderRecord['callback'],
		priority?: number,
		store?: NgtSignalStore<NgtState>,
	) => () => void;
};

export type NgtState = {
	/** The instance of the renderer */
	gl: WebGLRenderer;
	/** Default camera */
	camera: NgtCameraManual;
	/** Default scene */
	scene: Scene;
	/** Default raycaster */
	raycaster: Raycaster;
	/** Default clock */
	clock: Clock;
	/** Event layer interface, contains the event handler and the node they're connected to */
	events: NgtEventManager<any>;
	/** XR interface */
	xr: { connect: () => void; disconnect: () => void };
	/** Currently used controls */
	controls: EventDispatcher | null;
	/** Normalized event coordinates */
	pointer: Vector2;
	/* Whether to enable r139's ColorManagement */
	legacy: boolean;
	/** Shortcut to gl.outputColorSpace = LinearSRGBColorSpace */
	linear: boolean;
	/** Shortcut to gl.toneMapping = NoTonemapping */
	flat: boolean;
	/** Render loop flags */
	frameloop: 'always' | 'demand' | 'never';
	/** Adaptive performance interface */
	performance: NgtPerformance;
	/** Reactive pixel-size of the canvas */
	size: NgtSize;
	/** Reactive size of the viewport in threejs units */
	viewport: NgtViewport & {
		getCurrentViewport: (
			camera?: NgtCamera,
			target?: Vector3 | Parameters<Vector3['set']>,
			size?: NgtSize,
		) => Omit<NgtViewport, 'dpr' | 'initialDpr'>;
	};
	/** Flags the canvas for render, but doesn't render in itself */
	invalidate: (frames?: number) => void;
	/** Advance (render) one step */
	advance: (timestamp: number, runGlobalEffects?: boolean) => void;
	/** Shortcut to setting the event layer */
	setEvents: (events: Partial<NgtEventManager<any>>) => void;
	/**
	 * Shortcut to manual sizing
	 */
	setSize: (width: number, height: number, top?: number, left?: number) => void;
	/** Shortcut to manual setting the pixel ratio */
	setDpr: (dpr: NgtDpr) => void;
	/** Shortcut to frameloop flags */
	setFrameloop: (frameloop?: 'always' | 'demand' | 'never') => void;
	/** When the canvas was clicked but nothing was hit */
	/** PointerMissed Observable */
	pointerMissed$: Observable<MouseEvent>;
	/** If this state model is layered (via createPortal) then this contains the previous layer */
	previousRoot: NgtSignalStore<NgtState> | null;
	/** Internals */
	internal: NgtInternalState;
};
