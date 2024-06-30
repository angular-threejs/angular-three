import {
	CUSTOM_ELEMENTS_SCHEMA,
	ChangeDetectionStrategy,
	Component,
	DestroyRef,
	EmbeddedViewRef,
	Injector,
	TemplateRef,
	ViewContainerRef,
	afterNextRender,
	contentChild,
	inject,
	input,
	untracked,
	viewChild,
} from '@angular/core';
import { injectAutoEffect } from 'ngxtension/auto-effect';
import { Object3D, Raycaster, Scene, Vector2, Vector3 } from 'three';
import { NgtComputeFunction } from './events';
import { getLocalState, prepare } from './instance';
import { NgtSize, NgtState, injectStore, provideStore } from './store';
import { is } from './utils/is';
import { signalStore } from './utils/signal-store';
import { updateCamera } from './utils/update';

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
		<ng-content />
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	providers: [provideStore(signalStore({}))],
})
export class NgtPortal {
	container = input.required<Object3D>();
	state = input<NgtPortalInjectableState>({});

	portalContent = contentChild.required(TemplateRef);
	portalAnchor = viewChild.required('anchor', { read: ViewContainerRef });

	constructor() {
		const autoEffect = injectAutoEffect();
		const portalStore = injectStore({ self: true });
		const parentStore = injectStore({ skipSelf: true });
		const injector = inject(Injector);

		const parentState = parentStore.select();

		const raycaster = new Raycaster();
		const pointer = new Vector2();

		let portalView: EmbeddedViewRef<unknown>;

		console.log(portalStore);

		afterNextRender(() => {
			const previousState = parentStore.snapshot;

			const { events = {}, size = {}, ...rest } = this.state();
			let container = this.container();

			if (!is.instance(container)) {
				container = prepare(container);
			}

			const localState = getLocalState(container);
			if (localState && !localState.store) {
				localState.store = portalStore;
			}

			portalStore.update({
				...previousState,
				scene: container as Scene,
				raycaster,
				pointer,
				events: { ...previousState.events, ...events },
				size: { ...previousState.size, ...size },
				previousRoot: parentStore,
				...rest,
				setEvents: (events) => portalStore.update((state) => ({ ...state, events: { ...state.events, ...events } })),
			});

			autoEffect(() => {
				const state = this.state();
				portalStore.update((prev) => this.inject(parentState(), prev, state, untracked(this.container)));
			});

			// untracked(() => {
			// 	portalView = this.portalAnchor().createEmbeddedView(
			// 		this.portalContent(),
			// 		{ container: this.container() },
			// 		{ injector },
			// 	);
			// 	portalView.detectChanges();
			// });
		});

		inject(DestroyRef).onDestroy(() => {
			portalView?.destroy();
			setTimeout(() => {
				const state = portalStore.snapshot;
				state.events?.disconnect?.();
				// dispose(state);
			}, 500);
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
			if (camera !== parentState.camera) updateCamera(camera, size);
		}

		return {
			...intersect,
			scene: container as Scene,
			events: { ...parentState.events, ...(portalState.events || {}), ...(events || {}) },
			size: { ...parentState.size, ...(size || {}) },
			viewport: { ...parentState.viewport, ...(viewport || {}) },
			...rest,
		};
	}
}
