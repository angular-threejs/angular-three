import {
	afterNextRender,
	ChangeDetectionStrategy,
	Component,
	computed,
	contentChild,
	CUSTOM_ELEMENTS_SCHEMA,
	DestroyRef,
	Directive,
	ElementRef,
	EmbeddedViewRef,
	inject,
	Injector,
	input,
	signal,
	TemplateRef,
	untracked,
	viewChild,
	ViewContainerRef,
} from '@angular/core';
import { injectAutoEffect } from 'ngxtension/auto-effect';
import { Camera, Object3D, Raycaster, Scene, Vector2, Vector3 } from 'three';
import { NgtEventManager } from './events';
import { getLocalState, prepare } from './instance';
import { SPECIAL_INTERNAL_ADD_COMMENT } from './renderer/constants';
import { injectNgtStore, NGT_STORE, NgtSize, NgtState, provideNgtStore } from './store';
import { injectBeforeRender } from './utils/before-render';
import { is } from './utils/is';
import { signalStore } from './utils/signal-store';
import { updateCamera } from './utils/update';

const privateKeys = [
	'get',
	'set',
	'select',
	'setSize',
	'setDpr',
	'setFrameloop',
	'events',
	'invalidate',
	'advance',
	'size',
	'viewport',
] as const;
type PrivateKeys = (typeof privateKeys)[number];

export interface NgtPortalInputs {
	container: ElementRef<Object3D> | Object3D;
	camera: ElementRef<Camera> | Camera;
	state: Partial<
		Omit<NgtState, PrivateKeys> & {
			events: Partial<Pick<NgtEventManager<any>, 'enabled' | 'priority' | 'compute' | 'connected'>>;
			size: NgtSize;
		}
	>;
}

@Component({
	selector: 'ngt-portal-before-render',
	standalone: true,
	template: `
		<!-- Without an element that receives pointer events state.pointer will always be 0/0 -->
		<ngt-group (pointerover)="onPointerOver()" attach="none" />
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtPortalBeforeRender {
	private injector = inject(Injector);

	private portalStore = injectNgtStore();
	renderPriority = input(1);
	parentScene = input.required<Scene>();
	parentCamera = input.required<Camera>();

	constructor() {
		afterNextRender(() => {
			let oldClear: boolean;
			injectBeforeRender(
				() => {
					const { gl, scene, camera } = this.portalStore.get();
					oldClear = gl.autoClear;
					if (this.renderPriority() === 1) {
						// clear scene and render with default
						gl.autoClear = true;
						gl.render(this.parentScene(), this.parentCamera());
					}
					// disable cleaning
					gl.autoClear = false;
					gl.clearDepth();
					gl.render(scene, camera);
					// restore
					gl.autoClear = oldClear;
				},
				{ priority: this.renderPriority(), injector: this.injector },
			);
		});
	}

	onPointerOver() {
		/* noop */
	}
}

@Directive({ selector: 'ng-template[portalContent]', standalone: true })
export class NgtPortalContent {
	constructor() {
		const { element: comment } = inject(ViewContainerRef);
		const { element: parentComment } = inject(ViewContainerRef, { skipSelf: true });

		const commentNode = comment.nativeElement;
		if (commentNode[SPECIAL_INTERNAL_ADD_COMMENT]) {
			commentNode[SPECIAL_INTERNAL_ADD_COMMENT](parentComment.nativeElement);
			delete commentNode[SPECIAL_INTERNAL_ADD_COMMENT];
		}
	}
}

@Component({
	selector: 'ngt-portal',
	standalone: true,
	template: `
		<ng-container #portalContentAnchor />
		@if (renderAutoBeforeRender()) {
			<ngt-portal-before-render
				[renderPriority]="autoRenderPriority()"
				[parentScene]="parentScene"
				[parentCamera]="parentCamera"
			/>
		}
	`,
	imports: [NgtPortalBeforeRender],
	providers: [provideNgtStore(signalStore({}))],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgtPortal {
	container = input.required<Object3D>();
	camera = input<ElementRef<Camera> | Camera>();
	state = input<
		Partial<
			Omit<NgtState, PrivateKeys> & {
				events: Partial<Pick<NgtEventManager<any>, 'enabled' | 'priority' | 'compute' | 'connected'>>;
				size: NgtSize;
			}
		>
	>();

	/**
	 * @decsription turn this on to enable "HUD" like rendering
	 */
	autoRender = input(false);
	autoRenderPriority = input(1);

	portalContentTemplate = contentChild.required(NgtPortalContent, { read: TemplateRef });
	portalContentAnchor = viewChild.required('portalContentAnchor', { read: ViewContainerRef });

	private injector = inject(Injector);
	private destroyRef = inject(DestroyRef);
	private autoEffect = injectAutoEffect();
	private parentStore = inject(NGT_STORE, { skipSelf: true });
	portalStore = inject(NGT_STORE, { self: true });

	private portalRendered = signal(false);

	protected renderAutoBeforeRender = computed(() => this.portalRendered() && this.autoRender());
	protected parentScene = this.parentStore.get('scene');
	protected parentCamera = this.parentStore.get('camera');

	private raycaster = new Raycaster();
	private pointer = new Vector2();

	private portalView?: EmbeddedViewRef<unknown>;

	constructor() {
		afterNextRender(() => {
			const parentState = this.parentStore.snapshot;
			let [container, state, autoRender, autoRenderPriority] = [
				this.container(),
				this.state(),
				this.autoRender(),
				this.autoRenderPriority(),
			];

			let stateFromInput = state;

			if (!stateFromInput && autoRender) {
				stateFromInput = { events: { priority: autoRenderPriority + 1 } };
			}

			const { events = {}, size = {}, ...rest } = stateFromInput || {};

			if (!is.instance(container)) {
				container = prepare(container);
			}

			const localState = getLocalState(container);
			if (localState && !localState.store) {
				localState.store = this.portalStore;
			}

			this.portalStore.update({
				...parentState,
				scene: container as Scene,
				raycaster: this.raycaster,
				pointer: this.pointer,
				events: { ...parentState.events, ...events },
				size: { ...parentState.size, ...size },
				previousRoot: this.parentStore,
				...rest,
				setEvents: (events) =>
					this.portalStore.update((state) => ({ ...state, events: { ...state.events, ...events } })),
			});

			console.log('in portal', {
				container,
				parent: this.parentStore.snapshot,
				portal: this.portalStore.snapshot,
				snapshotAtBeginning: { ...this.portalStore.snapshot },
			});

			this.autoEffect(() => {
				const previous = this.parentStore.state();
				this.portalStore.update((state) => this.inject(previous, state));
			});

			untracked(() => {
				this.portalView = this.portalContentAnchor().createEmbeddedView(this.portalContentTemplate(), {
					injector: this.injector,
					store: this.portalStore,
				});
				this.portalView.detectChanges();
			});

			this.portalRendered.set(true);
		});

		this.destroyRef.onDestroy(() => {
			this.portalView?.destroy();
			setTimeout(() => {
				const state = this.portalStore.snapshot;
				state.events?.disconnect?.();
				this.portalStore.update({});
				// dispose(state);
			}, 500);
		});
	}

	private inject(rootState: NgtState, injectState: NgtState) {
		const intersect: Partial<NgtState> = { ...rootState };

		Object.keys(intersect).forEach((key) => {
			if (
				privateKeys.includes(key as PrivateKeys) ||
				rootState[key as keyof NgtState] !== injectState[key as keyof NgtState]
			) {
				delete intersect[key as keyof NgtState];
			}
		});

		const container = untracked(this.container);
		const { size, events, ...restInputsState } = untracked(this.state) || {};

		let viewport = undefined;
		if (injectState && size) {
			const camera = injectState.camera;
			viewport = rootState.viewport.getCurrentViewport(camera, new Vector3(), size);
			if (camera !== rootState.camera) updateCamera(camera, size);
		}

		return {
			...intersect,
			scene: container,
			events: { ...rootState.events, ...(injectState?.events || {}), ...events },
			size: { ...rootState.size, ...size },
			viewport: { ...rootState.viewport, ...(viewport || {}) },
			...restInputsState,
		} as NgtState;
	}
}
