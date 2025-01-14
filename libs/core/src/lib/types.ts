import type { ElementRef, Signal } from '@angular/core';
import type { Observable } from 'rxjs';
import type * as THREE from 'three';
import type { NgtProperties, NgtThreeElement, NgtVector3 } from './three-types';
import type { SignalState } from './utils/signal-state';

// TODO: handle constructor overloads
// https://github.com/pmndrs/react-three-fiber/pull/2931
// https://github.com/microsoft/TypeScript/issues/37079
export type NgtArguments<T> = T extends NgtConstructorRepresentation
	? T extends typeof THREE.Color
		? [r: number, g: number, b: number] | [color: THREE.ColorRepresentation]
		: ConstructorParameters<T>
	: any[];
export type NgtConstructorRepresentation<T = any> = new (...args: any[]) => T;
export type NgtAnyRecord = Record<string, any>;
export type NgtNullish<T> = T | null | undefined;

export interface NgtDisposable {
	type?: string;
	dispose?: () => void;
}

export interface NgtEquConfig {
	/** Compare arrays by reference equality a === b (default), or by shallow equality */
	arrays?: 'reference' | 'shallow';
	/** Compare objects by reference equality a === b (default), or by shallow equality */
	objects?: 'reference' | 'shallow';
	/** If true the keys in both a and b must match 1:1 (default), if false a's keys must intersect b's */
	strict?: boolean;
}

export type NgtCameraLike = THREE.OrthographicCamera | THREE.PerspectiveCamera;
export type NgtCamera = NgtCameraLike & { manual?: boolean };
export type NgtCameraParameters = Partial<
	NgtThreeElement<typeof THREE.Camera> &
		NgtThreeElement<typeof THREE.PerspectiveCamera> &
		NgtThreeElement<typeof THREE.OrthographicCamera>
> & { manual?: boolean };
export interface NgtRendererLike {
	render: (scene: THREE.Scene, camera: THREE.Camera) => any;
}
export type NgtCanvasElement = HTMLCanvasElement | OffscreenCanvas;
export type NgtGlobalRenderCallback = (timeStamp: number) => void;

export type NgtGLOptions =
	| NgtRendererLike
	| ((canvas: NgtCanvasElement) => NgtRendererLike)
	| Partial<NgtProperties<THREE.WebGLRenderer> | THREE.WebGLRendererParameters>
	| undefined;
export type NgtDpr = number | [min: number, max: number];
export interface NgtSize {
	width: number;
	height: number;
	top: number;
	left: number;
}
export interface NgtViewport extends NgtSize {
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
}
export type NgtShadows = boolean | 'basic' | 'percentage' | 'soft' | 'variance' | Partial<THREE.WebGLShadowMap>;
export type NgtFrameloop = 'always' | 'demand' | 'never';
export interface NgtPerformance {
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
}
export type NgtEventPrefix = 'offset' | 'client' | 'page' | 'layer' | 'screen';

export interface NgtIntersection extends THREE.Intersection {
	/** The event source (the object which registered the handler) */
	eventObject: THREE.Object3D;
}

export interface NgtIntersectionEvent<TSourceEvent> extends NgtIntersection {
	/** The event source (the object which registered the handler) */
	eventObject: THREE.Object3D;
	/** An array of intersections */
	intersections: NgtIntersection[];
	/** vec3.set(pointer.x, pointer.y, 0).unproject(camera) */
	unprojectedPoint: THREE.Vector3;
	/** Normalized event coordinates */
	pointer: THREE.Vector2;
	/** Delta between first click and this event */
	delta: number;
	/** The ray that pierced it */
	ray: THREE.Ray;
	/** The camera that was used by the raycaster */
	camera: NgtCamera;
	/** stopPropagation will stop underlying handlers from firing */
	stopPropagation: () => void;
	/** The original host event */
	nativeEvent: TSourceEvent;
	/** If the event was stopped by calling stopPropagation */
	stopped: boolean;
}

export type NgtThreeEvent<TEvent> = NgtIntersectionEvent<TEvent> & NgtProperties<TEvent>;
export type NgtDomEvent = PointerEvent | MouseEvent | WheelEvent;

export interface NgtEventHandlers {
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
}

export type NgtEvents = {
	[TEvent in keyof NgtEventHandlers]-?: EventListener;
};

export type NgtFilterFunction = (items: THREE.Intersection[], store: SignalState<NgtState>) => THREE.Intersection[];
export type NgtComputeFunction = (
	event: NgtDomEvent,
	root: SignalState<NgtState>,
	previous: SignalState<NgtState> | null,
) => void;

export interface NgtEventManager<TTarget> {
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
}

export interface NgtPointerCaptureTarget {
	intersection: NgtIntersection;
	target: Element;
}

export interface NgtInstanceHierarchyState {
	objects: NgtInstanceNode[];
	nonObjects: NgtInstanceNode[];
	parent: NgtInstanceNode | null;
	geometryStamp: number;
}

export interface NgtInstanceState<TObject extends NgtAnyRecord = NgtAnyRecord> {
	/**
	 * The store that the intsance is being rendered with
	 */
	store: SignalState<NgtState>;
	/**
	 * hierachy store for the instance
	 */
	hierarchyStore: SignalState<NgtInstanceHierarchyState>;

	// 	// shortcut to signals
	parent: Signal<NgtInstanceHierarchyState['parent']>;
	objects: Signal<NgtInstanceHierarchyState['objects']>;
	nonObjects: Signal<NgtInstanceHierarchyState['nonObjects']>;

	/**
	 * reference back to the object
	 */
	object: TObject & { __ngt__?: NgtInstanceState<TObject> };

	// shortcut to add/remove object to list
	add: (instance: NgtInstanceNode, type: 'objects' | 'nonObjects') => void;
	remove: (instance: NgtInstanceNode, type: 'objects' | 'nonObjects') => void;
	setParent: (parent: NgtInstanceNode | null) => void;
	updateGeometryStamp: () => void;

	/**
	 * event count for the instance
	 */
	eventCount: number;
	/**
	 * handlers for the instance
	 */
	handlers: Partial<NgtEventHandlers>;
	/**
	 * attach information so that we can detach as well as reset
	 */
	attach?: string[] | NgtAttachFunction;
	/**
	 * previously attach information so we can reset as well as clean up
	 */
	previousAttach?: unknown | (() => void);
	/**
	 * the element tag used to create this instance
	 */
	type: string;

	onUpdate?: (node: NgtInstanceNode) => void;
	onAttach?: (afterAttach: NgtAfterAttach) => void;
}

export type NgtInstanceNode<TObject extends NgtAnyRecord = NgtAnyRecord> = TObject & {
	__ngt__: NgtInstanceState<TObject>;
};

export type NgtAttachFunction<TChild = any, TParent = any> = (
	parent: TParent,
	child: TChild,
	store: SignalState<NgtState>,
) => void | (() => void);

export type NgtAttachable<TChild = any, TParent = any> =
	| NgtAttachFunction<TChild, TParent>
	| string
	| (string | number)[];

export interface NgtAfterAttach<TChild = NgtInstanceNode, TParent = NgtInstanceNode> {
	parent: TParent;
	node: TChild;
}

export interface NgtRenderState extends NgtState {
	delta: number;
	frame?: XRFrame;
}

export interface NgtBeforeRenderEvent<TObject = NgtInstanceNode> {
	state: NgtRenderState;
	object: TObject;
}

export interface NgtBeforeRenderRecord {
	callback: (state: NgtRenderState) => void;
	store: SignalState<NgtState>;
	priority?: number;
}

export interface NgtXRManager {
	connect: () => void;
	disconnect: () => void;
}

export interface NgtInternalState {
	active: boolean;
	priority: number;
	frames: number;
	lastEvent: ElementRef<NgtDomEvent | null>;
	interaction: THREE.Object3D[];
	hovered: Map<string, NgtThreeEvent<NgtDomEvent>>;
	capturedMap: Map<number, Map<THREE.Object3D, NgtPointerCaptureTarget>>;
	initialClick: [x: number, y: number];
	initialHits: THREE.Object3D[];
	subscribers: NgtBeforeRenderRecord[];
	subscribe: (
		callback: NgtBeforeRenderRecord['callback'],
		priority?: number,
		store?: SignalState<NgtState>,
	) => () => void;
}

export interface NgtState {
	/** The instance of the renderer */
	gl: THREE.WebGLRenderer;
	/** Default camera */
	camera: NgtCamera;
	/** Default scene */
	scene: THREE.Scene;
	/** Default raycaster */
	raycaster: THREE.Raycaster;
	/** Default clock */
	clock: THREE.Clock;
	/** Event layer interface, contains the event handler and the node they're connected to */
	events: NgtEventManager<any>;
	/** XR interface */
	xr: NgtXRManager;
	/** Currently used controls */
	controls: THREE.EventDispatcher | null;
	/** Normalized event coordinates */
	pointer: THREE.Vector2;
	/* Whether to enable r139's ColorManagement */
	legacy: boolean;
	/** Shortcut to gl.outputColorSpace = LinearSRGBColorSpace */
	linear: boolean;
	/** Shortcut to gl.toneMapping = NoTonemapping */
	flat: boolean;
	/** Render loop flags */
	frameloop: NgtFrameloop;
	/** Adaptive performance interface */
	performance: NgtPerformance;
	/** Reactive pixel-size of the canvas */
	size: NgtSize;
	/** Reactive size of the viewport in threejs units */
	viewport: NgtViewport & {
		getCurrentViewport: (
			camera: NgtCamera,
			target?: THREE.Vector3 | Parameters<THREE.Vector3['set']>,
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
	setFrameloop: (frameloop?: NgtFrameloop) => void;
	/** When the canvas was clicked but nothing was hit */
	/** PointerMissed Observable */
	pointerMissed$: Observable<MouseEvent>;
	/** If this state model is layered (via createPortal) then this contains the previous layer */
	previousRoot: SignalState<NgtState> | null;
	/** Internals */
	internal: NgtInternalState;
}

export interface NgtCanvasOptions {
	gl?: NgtGLOptions;
	size?: NgtSize;
	shadows?: NgtShadows;
	legacy?: boolean;
	linear?: boolean;
	flat?: boolean;
	orthographic?: boolean;
	frameloop?: NgtFrameloop;
	performance?: Partial<Omit<NgtPerformance, 'regress'>>;
	dpr?: NgtDpr;
	raycaster?: Partial<THREE.Raycaster>;
	scene?: THREE.Scene | Partial<THREE.Scene>;
	camera?: NgtCamera | NgtCameraParameters;
	events?: (store: SignalState<NgtState>) => NgtEventManager<HTMLElement>;
	eventSource?: HTMLElement | ElementRef<HTMLElement>;
	eventPrefix?: NgtEventPrefix;
	lookAt?: NgtVector3;
}
