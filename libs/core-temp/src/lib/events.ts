import type { NgtCameraManual, NgtState } from './store';
import type { NgtProperties } from './types';
import type { NgtSignalStore } from './utils';

export const supportedDomEvents = [
	'click',
	'contextmenu',
	'dblclick',
	'pointerup',
	'pointerdown',
	'pointerover',
	'pointerout',
	'pointerenter',
	'pointerleave',
	'pointermove',
	'pointermissed',
	'pointercancel',
	'wheel',
] as const;

export type NgtIntersection = THREE.Intersection & {
	/** The event source (the object which registered the handler) */
	eventObject: THREE.Object3D;
};

export type NgtIntersectionEvent<TSourceEvent> = NgtIntersection & {
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
	camera: NgtCameraManual;
	/** stopPropagation will stop underlying handlers from firing */
	stopPropagation: () => void;
	/** The original host event */
	nativeEvent: TSourceEvent;
	/** If the event was stopped by calling stopPropagation */
	stopped: boolean;
};

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

export type NgtPointerCaptureTarget = {
	intersection: NgtIntersection;
	target: Element;
};

export type NgtFilterFunction = (items: THREE.Intersection[], store: NgtSignalStore<NgtState>) => THREE.Intersection[];
export type NgtComputeFunction = (
	event: NgtDomEvent,
	store: NgtSignalStore<NgtState>,
	previous?: NgtSignalStore<NgtState>,
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
