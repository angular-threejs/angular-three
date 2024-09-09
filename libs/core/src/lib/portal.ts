import {
	afterNextRender,
	ChangeDetectionStrategy,
	Component,
	computed,
	contentChild,
	CUSTOM_ELEMENTS_SCHEMA,
	DestroyRef,
	Directive,
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
import { getLocalState, prepare } from './instance';
import { SPECIAL_INTERNAL_ADD_COMMENT } from './renderer/constants';
import { injectStore, provideStore } from './store';
import { NgtComputeFunction, NgtSize, NgtState } from './types';
import { injectBeforeRender } from './utils/before-render';
import { is } from './utils/is';
import { signalStore } from './utils/signal-store';
import { updateCamera } from './utils/update';

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
	private portalStore = injectStore();

	renderPriority = input(1);
	parentScene = input.required<Scene>();
	parentCamera = input.required<Camera>();

	constructor() {
		injectAutoEffect()((injector) => {
			// track state
			this.portalStore.state();
			const priority = this.renderPriority();

			let oldClear: boolean;
			return injectBeforeRender(
				() => {
					const { gl, scene, camera } = this.portalStore.snapshot;
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
				{ priority, injector },
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

	static ngTemplateContextGuard(_: NgtPortalContent, ctx: unknown): ctx is { container: Object3D; injector: Injector } {
		return true;
	}
}
// Keys that shouldn't be copied between stores
export const privateKeys = [
	'setSize',
	'setFrameloop',
	'setDpr',
	'events',
	'setEvents',
	'invalidate',
	'advance',
	'size',
	'viewport',
] as const;

export type NgtPortalPrivateKeys = (typeof privateKeys)[number];

export type NgtPortalInjectableState = Partial<
	Omit<NgtState, NgtPortalPrivateKeys> & {
		events?: {
			enabled?: boolean;
			priority?: number;
			compute?: NgtComputeFunction;
			connected?: any;
		};
		size?: NgtSize;
	}
>;

@Component({
	selector: 'ngt-portal',
	standalone: true,
	template: `
		<ng-container #anchor />

		@if (renderAutoBeforeRender()) {
			<ngt-portal-before-render
				[renderPriority]="autoRenderPriority()"
				[parentScene]="parentScene()"
				[parentCamera]="parentCamera()"
			/>
		}
	`,
	imports: [NgtPortalBeforeRender],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	providers: [provideStore(() => signalStore({}))],
})
export class NgtPortal {
	container = input.required<Object3D>();
	state = input<NgtPortalInjectableState>({});

	/**
	 * @decsription turn this on to enable "HUD" like rendering
	 */
	autoRender = input(false);
	autoRenderPriority = input(1);

	private portalContent = contentChild.required(NgtPortalContent, { read: TemplateRef });
	private portalAnchor = viewChild.required('anchor', { read: ViewContainerRef });

	private injector = inject(Injector);
	private portalStore = injectStore({ self: true });
	private parentStore = injectStore({ skipSelf: true });
	protected parentScene = this.parentStore.select('scene');
	protected parentCamera = this.parentStore.select('camera');

	private raycaster = new Raycaster();
	private pointer = new Vector2();
	private portalRendered = signal(false);

	protected renderAutoBeforeRender = computed(() => this.portalRendered() && this.autoRender());

	private portalView?: EmbeddedViewRef<unknown>;

	constructor() {
		const autoEffect = injectAutoEffect();

		const parentState = this.parentStore.select();

		afterNextRender(() => {
			const previousState = this.parentStore.snapshot;

			const { events = {}, size = {}, ...rest } = this.state();
			let container = this.container();

			if (!is.instance(container)) {
				container = prepare(container, { store: this.portalStore });
			}

			const localState = getLocalState(container);
			if (localState && !localState.store) {
				localState.store = this.portalStore;
			}

			this.portalStore.update({
				...previousState,
				scene: container as Scene,
				raycaster: this.raycaster,
				pointer: this.pointer,
				events: { ...previousState.events, ...events },
				size: { ...previousState.size, ...size },
				previousRoot: this.parentStore,
				...rest,
				setEvents: (events) =>
					this.portalStore.update((state) => ({ ...state, events: { ...state.events, ...events } })),
			});

			autoEffect(() => {
				const state = this.state();
				const _parentState = parentState();
				this.portalStore.update((prev) => this.inject(_parentState, prev, state, untracked(this.container)));
				untracked(() => {
					if (this.portalView) {
						this.portalView.detectChanges();
						return;
					}

					this.portalView = this.portalAnchor().createEmbeddedView(
						this.portalContent(),
						{ container: this.container(), injector: this.injector },
						{ injector: this.injector },
					);
					this.portalView.detectChanges();
					this.portalRendered.set(true);
				});
			});
		});

		inject(DestroyRef).onDestroy(() => {
			this.portalView?.destroy();
		});
	}

	private inject(
		parentState: NgtState,
		portalState: NgtState,
		injectedState: NgtPortalInjectableState,
		container: Object3D,
	) {
		const { events = {}, size, ...rest } = injectedState;
		const intersect: Partial<NgtState> = { ...parentState }; // all prev state props

		Object.keys(parentState).forEach((key) => {
			if (
				privateKeys.includes(key as NgtPortalPrivateKeys) ||
				(parentState[key as keyof NgtState] !== portalState[key as keyof NgtState] &&
					portalState[key as keyof NgtState])
			) {
				delete intersect[key as keyof NgtState];
			}
		});

		let viewport = undefined;
		if (portalState && size) {
			const camera = portalState.camera;
			// Calculate the override viewport, if present
			viewport = parentState.viewport.getCurrentViewport(camera, new Vector3(), size);
			// Update the portal camera, if it differs from the previous layer
			if (camera !== parentState.camera) {
				updateCamera(camera, size);
			}
		}

		return {
			...intersect,
			scene: container as Scene,
			raycaster: this.raycaster,
			pointer: this.pointer,
			events: { ...parentState.events, ...(portalState.events || {}), ...(events || {}) },
			size: { ...parentState.size, ...(size || {}) },
			viewport: { ...parentState.viewport, ...(viewport || {}) },
			...rest,
		};
	}
}
