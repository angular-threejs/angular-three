import { TestBed } from '@angular/core/testing';
import * as THREE from 'three';
import { NGT_LOOP, roots } from './loop';
import type { NgtState } from './types';
import type { SignalState } from './utils/signal-state';

describe('render loop', () => {
	afterEach(() => roots.clear());

	it('keeps manual frameloop timestamps in milliseconds and frame deltas in seconds', () => {
		const callback = vi.fn();
		const clock = new THREE.Clock();
		clock.stop();
		clock.oldTime = 0;
		clock.elapsedTime = 0;

		const state = {
			clock,
			frameloop: 'never',
			gl: { render: vi.fn() },
			scene: new THREE.Scene(),
			camera: new THREE.PerspectiveCamera(),
			internal: {
				priority: 0,
				frames: 2,
				subscribers: [] as NgtState['internal']['subscribers'],
			},
		} as unknown as NgtState;
		const store = { snapshot: state } as SignalState<NgtState>;
		state.internal.subscribers.push({ callback, priority: 0, store });

		const loop = TestBed.inject(NGT_LOOP);
		loop.advance(1000, false, store);
		loop.advance(1016, false, store);

		expect(callback).toHaveBeenCalledTimes(2);
		expect(callback.mock.calls[0][0].delta).toBeCloseTo(1);
		expect(callback.mock.calls[1][0].delta).toBeCloseTo(0.016);
		expect(clock.oldTime).toBe(1016);
		expect(clock.elapsedTime).toBeCloseTo(1.016);
	});

	it('gives each subscriber fresh store state while preserving a stable callback list', () => {
		const clock = new THREE.Clock();
		clock.stop();
		let snapshotReads = 0;
		const initialCamera = new THREE.PerspectiveCamera(45);
		const nextCamera = new THREE.PerspectiveCamera(60);
		let currentCamera = initialCamera;
		const first = vi.fn();
		const second = vi.fn();
		const added = vi.fn();
		const state = {
			clock,
			frameloop: 'never',
			gl: { render: vi.fn() },
			scene: new THREE.Scene(),
			camera: new THREE.PerspectiveCamera(),
			internal: {
				priority: 0,
				frames: 2,
				subscribers: [] as NgtState['internal']['subscribers'],
			},
		} as unknown as NgtState;
		const store = {
			get snapshot() {
				snapshotReads++;
				return { ...state, camera: currentCamera };
			},
		} as SignalState<NgtState>;
		const addedRecord = { callback: added, priority: 0, store };
		const firstRecord = {
			callback: vi.fn((frameState) => {
				first(frameState);
				currentCamera = nextCamera;
				state.internal.subscribers = [firstRecord, addedRecord];
			}),
			priority: 0,
			store,
		};
		const secondRecord = { callback: second, priority: 0, store };
		state.internal.subscribers = [firstRecord, secondRecord];

		const loop = TestBed.inject(NGT_LOOP);
		loop.advance(1000, false, store);

		expect(first).toHaveBeenCalledOnce();
		expect(second).toHaveBeenCalledOnce();
		expect(added).not.toHaveBeenCalled();
		const firstState = first.mock.calls[0][0];
		const secondState = second.mock.calls[0][0];
		expect(snapshotReads).toBe(3);
		expect(firstState.camera).toBe(initialCamera);
		expect(secondState.camera).toBe(nextCamera);
		expect(firstState).not.toBe(secondState);
		expect(Object.isFrozen(firstState)).toBe(false);
		expect(Reflect.set(firstState, 'delta', 99)).toBe(true);
		expect(secondState.delta).not.toBe(99);

		loop.advance(1016, false, store);
		expect(snapshotReads).toBe(6);
		expect(second).toHaveBeenCalledOnce();
		expect(added).toHaveBeenCalledOnce();
	});
});
