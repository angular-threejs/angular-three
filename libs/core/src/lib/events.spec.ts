import { Subject } from 'rxjs';
import { Mesh, PerspectiveCamera, Vector2, Vector3 } from 'three';
import { describe, expect, it, vi } from 'vitest';
import { createEvents } from './events';
import { getInstanceState, prepare } from './instance';
import type { NgtComputeFunction, NgtDomEvent, NgtState } from './types';
import type { SignalState } from './utils/signal-state';

function createEventStore(previousRoot: SignalState<NgtState> | null = null) {
	const camera = new PerspectiveCamera();
	const raycaster = {
		camera: undefined as PerspectiveCamera | null | undefined,
		ray: {},
		intersectObjects: vi.fn(() => []),
	};
	let store: SignalState<NgtState>;
	const compute = vi.fn<NgtComputeFunction>(() => {
		raycaster.camera = camera;
	});
	store = {
		snapshot: {
			previousRoot,
			camera,
			pointer: new Vector2(),
			raycaster,
			events: { enabled: true, priority: previousRoot ? 2 : 1, compute },
			internal: {
				interaction: [],
				hovered: new Map(),
				capturedMap: new Map(),
				initialClick: [0, 0],
				initialHits: [],
				lastEvent: { nativeElement: null },
			},
		} as unknown as NgtState,
	} as SignalState<NgtState>;
	Object.assign(store, { __pointerMissed$: new Subject<MouseEvent>() });
	return { store, raycaster, compute };
}

function interactiveMesh(store: SignalState<NgtState>) {
	const mesh = prepare(new Mesh(), 'ngt-mesh', { store });
	const state = getInstanceState(mesh)!;
	state.eventCount = 1;
	state.handlers.pointermove = vi.fn();
	return mesh;
}

function pointerMove() {
	return {
		offsetX: 1,
		offsetY: 1,
		pointerId: 1,
		target: document.createElement('canvas'),
	} as unknown as NgtDomEvent;
}

describe('createEvents', () => {
	it('computes and raycasts each event layer once for all of its interactive objects', () => {
		const root = createEventStore();
		const portal = createEventStore(root.store);
		const rootA = interactiveMesh(root.store);
		const rootB = interactiveMesh(root.store);
		const portalA = interactiveMesh(portal.store);
		const portalB = interactiveMesh(portal.store);
		root.store.snapshot.internal.interaction.push(rootA, rootB, portalA, portalB);

		createEvents(root.store).handlePointer('pointermove')(pointerMove());

		expect(root.compute).toHaveBeenCalledOnce();
		expect(portal.compute).toHaveBeenCalledOnce();
		expect(root.raycaster.intersectObjects).toHaveBeenCalledOnce();
		expect(root.raycaster.intersectObjects).toHaveBeenCalledWith([rootA, rootB], true);
		expect(portal.raycaster.intersectObjects).toHaveBeenCalledOnce();
		expect(portal.raycaster.intersectObjects).toHaveBeenCalledWith([portalA, portalB], true);
	});

	it('computes nested layers once in root-to-leaf order regardless of interaction order', () => {
		const root = createEventStore();
		const portal = createEventStore(root.store);
		const nested = createEventStore(portal.store);
		const order: string[] = [];
		const configureCompute = (
			name: string,
			layer: ReturnType<typeof createEventStore>,
			previous?: ReturnType<typeof createEventStore>,
		) => {
			layer.compute.mockImplementation((event, currentStore) => {
				if (previous && !previous.raycaster.camera) {
					previous.store.snapshot.events.compute?.(
						event,
						previous.store,
						previous.store.snapshot.previousRoot,
					);
				}
				order.push(name);
				layer.raycaster.camera = currentStore.snapshot.camera;
			});
		};
		configureCompute('root', root);
		configureCompute('portal', portal, root);
		configureCompute('nested', nested, portal);

		const nestedObject = interactiveMesh(nested.store);
		const portalObject = interactiveMesh(portal.store);
		root.store.snapshot.internal.interaction.push(nestedObject, portalObject);

		createEvents(root.store).handlePointer('pointermove')(pointerMove());

		expect(order).toEqual(['root', 'portal', 'nested']);
		expect(root.compute).toHaveBeenCalledOnce();
		expect(portal.compute).toHaveBeenCalledOnce();
		expect(nested.compute).toHaveBeenCalledOnce();
	});

	it('still computes the root pointer state when no object is interactive', () => {
		const root = createEventStore();

		createEvents(root.store).handlePointer('pointermove')(pointerMove());

		expect(root.compute).toHaveBeenCalledOnce();
		expect(root.raycaster.intersectObjects).not.toHaveBeenCalled();
	});

	it('preserves layer priority for hits on unmanaged descendants', () => {
		const root = createEventStore();
		const portal = createEventStore(root.store);
		const rootParent = interactiveMesh(root.store);
		const portalParent = interactiveMesh(portal.store);
		const rootChild = new Mesh();
		const portalChild = new Mesh();
		rootParent.add(rootChild);
		portalParent.add(portalChild);
		const calls: string[] = [];
		getInstanceState(rootParent)!.handlers.pointermove = () => calls.push('root');
		getInstanceState(portalParent)!.handlers.pointermove = () => calls.push('portal');
		(root.raycaster.intersectObjects as ReturnType<typeof vi.fn>).mockReturnValue([
			{ object: rootChild, distance: 1, point: new Vector3() },
		]);
		(portal.raycaster.intersectObjects as ReturnType<typeof vi.fn>).mockReturnValue([
			{ object: portalChild, distance: 100, point: new Vector3() },
		]);
		root.store.snapshot.internal.interaction.push(rootParent, portalParent);

		createEvents(root.store).handlePointer('pointermove')(pointerMove());

		expect(calls).toEqual(['portal', 'root']);
	});

	it('notifies missed objects once when a click bubbles through multiple hits', () => {
		const root = createEventStore();
		const first = interactiveMesh(root.store);
		const second = interactiveMesh(root.store);
		const missed = interactiveMesh(root.store);
		getInstanceState(first)!.handlers.click = vi.fn();
		getInstanceState(second)!.handlers.click = vi.fn();
		const pointerMissed = vi.fn();
		getInstanceState(missed)!.handlers.pointermissed = pointerMissed;
		(root.raycaster.intersectObjects as ReturnType<typeof vi.fn>).mockReturnValue([
			{ object: first, distance: 1, point: new Vector3() },
			{ object: second, distance: 2, point: new Vector3() },
		]);
		root.store.snapshot.internal.interaction.push(first, second, missed);
		const events = createEvents(root.store);

		events.handlePointer('pointerdown')(pointerMove());
		events.handlePointer('click')(pointerMove());

		expect(pointerMissed).toHaveBeenCalledOnce();
	});
});
