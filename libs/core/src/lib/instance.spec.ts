import { Group, Mesh } from 'three';
import { vi } from 'vitest';
import { flushAncestorNotifications, getInstanceState, prepare, uuidv4Fallback } from './instance';
import type { NgtInstanceHierarchyState, NgtInstanceState, NgtState } from './types';
import type { SignalState } from './utils/signal-state';

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe('uuidv4Fallback', () => {
	it('should return a valid RFC 4122 v4 UUID', () => {
		const id = uuidv4Fallback();
		expect(id).toMatch(UUID_V4_REGEX);
	});

	it('should return unique values on each call', () => {
		const ids = new Set(Array.from({ length: 100 }, () => uuidv4Fallback()));
		expect(ids.size).toBe(100);
	});
});

describe('prepare', () => {
	beforeEach(() => {
		if (typeof crypto.randomUUID !== 'function') {
			(crypto as any).randomUUID = () => '00000000-0000-4000-8000-000000000000';
		}
	});

	it('should set __ngt_id__ to a valid UUID', () => {
		const obj = {};
		prepare(obj, 'ngt-test');
		expect((obj as any).__ngt_id__).toMatch(UUID_V4_REGEX);
	});

	it('should fall back to uuidv4Fallback when crypto.randomUUID is undefined', () => {
		const original = (crypto as any).randomUUID;
		delete (crypto as any).randomUUID;

		const obj = {};
		prepare(obj, 'ngt-test');
		expect((obj as any).__ngt_id__).toMatch(UUID_V4_REGEX);

		(crypto as any).randomUUID = original;
	});

	it('should return the instance state with correct type', () => {
		const obj = {};
		const prepared = prepare(obj, 'ngt-mesh');
		const state = getInstanceState(prepared);
		expect(state?.type).toBe('ngt-mesh');
	});

	it('should not reassign __ngt_id__ for already prepared non-primitive objects', () => {
		const obj = {};
		prepare(obj, 'ngt-first');
		const firstId = (obj as any).__ngt_id__;

		prepare(obj, 'ngt-second');
		expect((obj as any).__ngt_id__).toBe(firstId);
	});

	it('should reassign __ngt_id__ for ngt-primitive objects', () => {
		const obj = {};
		prepare(obj, 'ngt-primitive', { type: 'ngt-primitive' });
		const firstId = (obj as any).__ngt_id__;

		prepare(obj, 'ngt-primitive', { type: 'ngt-primitive' });
		expect((obj as any).__ngt_id__).not.toBe(firstId);
	});

	it('keeps same-name pointer listeners independent and cleanup idempotent', () => {
		const object = prepare(new Mesh(), 'ngt-mesh');
		const state = getInstanceState(object)!;
		const releasePointerCapture = vi.fn();
		const store = {
			snapshot: {
				previousRoot: null,
				internal: {
					interaction: [object],
					initialHits: [object],
					hovered: new Map([['hover', { object, eventObject: object }]]),
					capturedMap: new Map([
						[1, new Map([[object, { target: { releasePointerCapture }, intersection: {} }]])],
					]),
				},
			},
		} as unknown as SignalState<NgtState>;
		state.store = store;
		const first = vi.fn();
		const second = vi.fn();

		const removeFirst = state.setPointerEvent!('click', first);
		const removeSecond = state.setPointerEvent!('click', second);
		state.handlers.click!({} as never);

		expect(first).toHaveBeenCalledOnce();
		expect(second).toHaveBeenCalledOnce();
		expect(state.eventCount).toBe(2);

		removeFirst();
		removeFirst();
		state.handlers.click!({} as never);
		expect(first).toHaveBeenCalledOnce();
		expect(second).toHaveBeenCalledTimes(2);
		expect(state.eventCount).toBe(1);

		removeSecond();
		removeSecond();
		expect(state.eventCount).toBe(0);
		expect(state.handlers.click).toBeUndefined();
		expect(store.snapshot.internal.interaction).toEqual([]);
		expect(store.snapshot.internal.initialHits).toEqual([]);
		expect(store.snapshot.internal.hovered.size).toBe(0);
		expect(store.snapshot.internal.capturedMap.size).toBe(0);
		expect(releasePointerCapture).toHaveBeenCalledWith(1);
	});

	it('snapshots pointer listeners so dispatch-time registration changes apply next time', () => {
		const object = prepare(new Mesh(), 'ngt-mesh');
		const state = getInstanceState(object)!;
		const calls: string[] = [];
		let removeFirst = () => undefined;
		let removeThird = () => undefined;
		removeFirst = state.setPointerEvent!('click', () => {
			calls.push('first');
			removeFirst();
			removeThird = state.setPointerEvent!('click', () => calls.push('third'));
		});
		const removeSecond = state.setPointerEvent!('click', () => calls.push('second'));

		state.handlers.click!({} as never);
		expect(calls).toEqual(['first', 'second']);

		state.handlers.click!({} as never);
		expect(calls).toEqual(['first', 'second', 'second', 'third']);

		removeSecond();
		removeThird();
		expect(state.eventCount).toBe(0);
	});

	it('batches descendant hierarchy notifications once per ancestor and renderer commit', async () => {
		const ancestorHierarchy = {
			snapshot: {
				parent: null,
				objects: [],
				nonObjects: [],
				geometryStamp: 0,
			} as NgtInstanceHierarchyState,
			parent: () => ancestorHierarchy.snapshot.parent,
			objects: () => ancestorHierarchy.snapshot.objects,
			nonObjects: () => ancestorHierarchy.snapshot.nonObjects,
			geometryStamp: () => ancestorHierarchy.snapshot.geometryStamp,
			update: vi.fn((update: Partial<NgtInstanceHierarchyState>) => {
				Object.assign(ancestorHierarchy.snapshot, update);
			}),
		} as unknown as SignalState<NgtInstanceHierarchyState>;
		const ancestor = prepare(new Group(), 'ngt-group', { hierarchyStore: ancestorHierarchy });
		const parent = prepare(new Group(), 'ngt-group');
		const first = prepare(new Group(), 'ngt-group');
		const second = prepare(new Group(), 'ngt-group');
		const parentState = getInstanceState(parent)!;
		parentState.setParent(ancestor);

		parentState.add(first, 'objects');
		parentState.add(second, 'objects');
		parentState.add({} as any, 'nonObjects');

		expect(ancestorHierarchy.update).not.toHaveBeenCalled();
		flushAncestorNotifications();
		expect(ancestorHierarchy.update).toHaveBeenCalledOnce();
		expect(ancestorHierarchy.update).toHaveBeenCalledWith({ objects: [], nonObjects: [] });
		await Promise.resolve();
		expect(ancestorHierarchy.update).toHaveBeenCalledOnce();
	});

	it('drops a queued ancestor notification when a retained primitive state is destroyed', () => {
		const primitive = prepare(new Group(), 'ngt-primitive');
		const parent = prepare(new Group(), 'ngt-group');
		getInstanceState(parent)!.setParent(primitive);
		getInstanceState(parent)!.add(prepare(new Group(), 'ngt-group'), 'objects');
		delete (getInstanceState(primitive) as Partial<NgtInstanceState>).hierarchyStore;

		expect(() => flushAncestorNotifications()).not.toThrow();
	});
});
