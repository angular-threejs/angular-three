import {
	ChangeDetectionStrategy,
	Component,
	contentChild,
	CUSTOM_ELEMENTS_SCHEMA,
	Directive,
	effect,
	ElementRef,
	EmbeddedViewRef,
	inject,
	Injector,
	input,
	numberAttribute,
	signal,
	SkipSelf,
	TemplateRef,
	untracked,
	ViewContainerRef,
} from '@angular/core';
import * as THREE from 'three';
import { Group } from 'three';
import { getInstanceState, prepare } from './instance';
import { extend } from './renderer/catalogue';
import { NGT_DOM_PARENT_FLAG, NGT_INTERNAL_ADD_COMMENT_FLAG, NGT_PORTAL_CONTENT_FLAG } from './renderer/constants';
import { injectStore, NGT_STORE } from './store';
import type { NgtComputeFunction, NgtEventManager, NgtSize, NgtState, NgtViewport } from './types';
import { is } from './utils/is';
import { makeId } from './utils/make';
import { omit, pick } from './utils/parameters';
import { signalState, SignalState } from './utils/signal-state';
import { updateCamera } from './utils/update';

@Directive({ selector: 'ngt-portal[autoRender]' })
export class NgtPortalAutoRender {
	private portalStore = injectStore({ host: true });
	private parentStore = injectStore({ skipSelf: true });
	private portal = inject(NgtPortal, { host: true });

	renderPriority = input(1, { alias: 'autoRender', transform: (value) => numberAttribute(value, 1) });

	constructor() {
		effect(() => {
			// this.portalStore.update((state) => ({ events: { ...state.events, priority: this.renderPriority() + 1 } }));
		});

		effect((onCleanup) => {
			const portalRendered = this.portal.portalRendered();
			if (!portalRendered) return;

			// track state
			const [renderPriority, { internal }] = [this.renderPriority(), this.portalStore()];

			let oldClean: boolean;

			const cleanup = internal.subscribe(
				({ gl, scene, camera }) => {
					const [parentScene, parentCamera] = [this.parentStore.snapshot.scene, this.parentStore.snapshot.camera];
					oldClean = gl.autoClear;
					if (renderPriority === 1) {
						// clear scene and render with default
						gl.autoClear = true;
						gl.render(parentScene, parentCamera);
					}

					// disable cleaning
					gl.autoClear = false;
					gl.clearDepth();
					gl.render(scene, camera);
					// restore
					gl.autoClear = oldClean;
				},
				renderPriority,
				this.portalStore,
			);

			onCleanup(() => cleanup());
		});
	}
}

@Directive({ selector: 'ng-template[portalContent]' })
export class NgtPortalContent {
	static ngTemplateContextGuard(_: NgtPortalContent, ctx: unknown): ctx is { injector: Injector } {
		return true;
	}

	constructor() {
		const host = inject<ElementRef<HTMLElement>>(ElementRef, { skipSelf: true });
		const { element } = inject(ViewContainerRef);
		const injector = inject(Injector);
		const commentNode = element.nativeElement;
		const store = injectStore();

		commentNode.data = NGT_PORTAL_CONTENT_FLAG;
		commentNode[NGT_PORTAL_CONTENT_FLAG] = store;
		commentNode[NGT_DOM_PARENT_FLAG] = host.nativeElement;

		if (commentNode[NGT_INTERNAL_ADD_COMMENT_FLAG]) {
			commentNode[NGT_INTERNAL_ADD_COMMENT_FLAG]('portal', injector);
			delete commentNode[NGT_INTERNAL_ADD_COMMENT_FLAG];
		}
	}
}

export interface NgtPortalState extends Omit<NgtState, 'events'> {
	events: {
		enabled?: boolean;
		priority?: number;
		compute?: NgtComputeFunction;
		connected?: any;
	};
}

function mergeState(
	previousRoot: SignalState<NgtState>,
	store: SignalState<NgtState>,
	container: THREE.Object3D,
	pointer: THREE.Vector2,
	raycaster: THREE.Raycaster,
	events?: NgtPortalState['events'],
	size?: NgtSize,
) {
	// we never want to spread the id
	const { id: _, ...previousState } = previousRoot.snapshot;
	const state = store.snapshot;

	let viewport: Omit<NgtViewport, 'dpr' | 'initialDpr'> | undefined = undefined;

	if (state.camera && size) {
		const camera = state.camera;
		// calculate the override viewport, if present
		viewport = previousState.viewport.getCurrentViewport(camera, new THREE.Vector3(), size);
		// update the portal camera, if it differs from the previous layer
		if (camera !== previousState.camera) updateCamera(camera, size);
	}

	return {
		// the intersect consists of the previous root state
		...previousState,
		...state,
		// portals have their own scene, which forms the root, a raycaster and a pointer
		scene: container as THREE.Scene,
		pointer,
		raycaster,
		// their previous root is the layer before it
		previousRoot,
		events: { ...previousState.events, ...state.events, ...events },
		size: { ...previousState.size, ...size },
		viewport: { ...previousState.viewport, ...viewport },
		// layers are allowed to override events
		setEvents: (events: Partial<NgtEventManager<any>>) =>
			store.update((state) => ({ ...state, events: { ...state.events, ...events } })),
	} as NgtState;
}

@Component({
	selector: 'ngt-portal',
	template: `
		@if (portalRendered()) {
			<!-- Without an element that receives pointer events state.pointer will always be 0/0 -->
			<ngt-group (pointerover)="(undefined)" attach="none" />
		}
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	providers: [
		{
			provide: NGT_STORE,
			useFactory: (previousStore: SignalState<NgtState>) => {
				const pointer = new THREE.Vector2();
				const raycaster = new THREE.Raycaster();

				const { id: _skipId, ...previousState } = previousStore.snapshot;

				const store = signalState<NgtState>({
					id: makeId(),
					...previousState,
					scene: null as unknown as THREE.Scene,
					previousRoot: previousStore,
					pointer,
					raycaster,
				});
				store.update(mergeState(previousStore, store, null!, pointer, raycaster));
				return store;
			},
			deps: [[new SkipSelf(), NGT_STORE]],
		},
	],
})
export class NgtPortal {
	container = input.required<THREE.Object3D>();
	state = input<Partial<NgtPortalState>>({});

	private contentRef = contentChild.required(NgtPortalContent, { read: TemplateRef });
	private anchorRef = contentChild.required(NgtPortalContent, { read: ViewContainerRef });

	private previousStore = injectStore({ skipSelf: true });
	private portalStore = injectStore();
	private injector = inject(Injector);

	private size = pick(this.state, 'size');
	private events = pick(this.state, 'events');
	private restState = omit(this.state, ['size', 'events']);

	private portalContentRendered = signal(false);
	portalRendered = this.portalContentRendered.asReadonly();

	private portalViewRef?: EmbeddedViewRef<unknown>;

	constructor() {
		extend({ Group });

		effect(() => {
			let [container, anchor, content] = [this.container(), this.anchorRef(), this.contentRef(), this.previousStore()];

			const [size, events, restState] = [untracked(this.size), untracked(this.events), untracked(this.restState)];

			if (!is.instance(container)) {
				container = prepare(container, 'ngt-portal', { store: this.portalStore });
			}

			const instanceState = getInstanceState(container);
			if (instanceState && instanceState.store !== this.portalStore) {
				instanceState.store = this.portalStore;
			}

			this.portalStore.update(
				restState,
				mergeState(
					this.previousStore,
					this.portalStore,
					container,
					this.portalStore.snapshot.pointer,
					this.portalStore.snapshot.raycaster,
					events,
					size,
				),
			);

			if (this.portalViewRef) {
				this.portalViewRef.detectChanges();
				return;
			}

			this.portalViewRef = anchor.createEmbeddedView(content, { injector: this.injector }, { injector: this.injector });
			this.portalViewRef.detectChanges();
			this.portalContentRendered.set(true);
		});
	}
}

export const NgtPortalDeclarations = [NgtPortal, NgtPortalContent] as const;
