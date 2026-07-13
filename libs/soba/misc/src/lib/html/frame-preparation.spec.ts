import type { NgtBeforeRenderRecord, NgtRenderState, NgtState, SignalState } from 'angular-three';
import { Group, PerspectiveCamera, Raycaster, Scene } from 'three';
import { describe, expect, it, vi } from 'vitest';
import { registerHTMLFrameTarget } from './frame-preparation';
import type { NgtsHTMLOcclusionStrategy, NgtsHTMLOcclusionTarget } from './occlusion';

function createStore() {
	const unsubscribe = vi.fn();
	let callback: NgtBeforeRenderRecord['callback'] | undefined;
	const subscribe = vi.fn((next: NgtBeforeRenderRecord['callback']) => {
		callback = next;
		return unsubscribe;
	});
	const store = {
		snapshot: { internal: { subscribe } },
	} as unknown as SignalState<NgtState>;
	return { callback: () => callback, store, subscribe, unsubscribe };
}

function createFrame(scene: Scene, camera: PerspectiveCamera): NgtRenderState {
	return { scene, camera, raycaster: new Raycaster(), delta: 0.016 } as NgtRenderState;
}

function createTarget(anchor: Group): NgtsHTMLOcclusionTarget {
	return { anchor, element: document.createElement('div') };
}

describe(registerHTMLFrameTarget.name, () => {
	it('begins each shared strategy once per store frame and reference-counts targets', () => {
		const scene = new Scene();
		const camera = new PerspectiveCamera();
		camera.position.z = 5;
		const firstTarget = createTarget(new Group());
		const secondTarget = createTarget(new Group());
		scene.add(firstTarget.anchor, secondTarget.anchor);
		const updateScene = vi.spyOn(scene, 'updateWorldMatrix');
		const updateCamera = vi.spyOn(camera, 'updateWorldMatrix');
		const releases = new Map<NgtsHTMLOcclusionTarget, ReturnType<typeof vi.fn>>();
		const hidden = new Set<NgtsHTMLOcclusionTarget>([firstTarget]);
		const strategy: NgtsHTMLOcclusionStrategy = {
			setupTarget: vi.fn((target) => {
				const release = vi.fn();
				releases.set(target, release);
				return release;
			}),
			beginFrame: vi.fn(),
			isOccluded: vi.fn((target) => hidden.has(target)),
		};
		const firstOcclusionChange = vi.fn();
		const secondOcclusionChange = vi.fn();
		const firstUpdate = vi.fn();
		const secondUpdate = vi.fn();
		const { callback, store, subscribe, unsubscribe } = createStore();

		const releaseFirst = registerHTMLFrameTarget(store, {
			target: firstTarget,
			getOcclusion: () => strategy,
			onOcclusionChange: firstOcclusionChange,
			update: firstUpdate,
		});
		const releaseSecond = registerHTMLFrameTarget(store, {
			target: secondTarget,
			getOcclusion: () => strategy,
			onOcclusionChange: secondOcclusionChange,
			update: secondUpdate,
		});
		const firstFrame = createFrame(scene, camera);
		callback()?.(firstFrame);

		expect(subscribe).toHaveBeenCalledOnce();
		expect(updateScene).toHaveBeenCalledWith(true, true);
		expect(updateCamera).toHaveBeenCalledWith(true, false);
		expect(strategy.setupTarget).toHaveBeenCalledTimes(2);
		expect(strategy.beginFrame).toHaveBeenCalledOnce();
		expect(strategy.beginFrame).toHaveBeenCalledWith([firstTarget, secondTarget], {
			id: 1,
			state: firstFrame,
		});
		expect(strategy.isOccluded).toHaveBeenCalledTimes(2);
		expect(firstOcclusionChange).toHaveBeenCalledWith(true);
		expect(secondOcclusionChange).not.toHaveBeenCalled();
		expect(firstUpdate).toHaveBeenCalledWith(firstFrame);
		expect(secondUpdate).toHaveBeenCalledWith(firstFrame);

		hidden.clear();
		const secondFrame = createFrame(scene, camera);
		callback()?.(secondFrame);
		expect(strategy.setupTarget).toHaveBeenCalledTimes(2);
		expect(strategy.beginFrame).toHaveBeenNthCalledWith(2, [firstTarget, secondTarget], {
			id: 2,
			state: secondFrame,
		});
		expect(firstOcclusionChange).toHaveBeenLastCalledWith(false);

		releaseFirst();
		releaseFirst();
		expect(releases.get(firstTarget)).toHaveBeenCalledOnce();
		expect(unsubscribe).not.toHaveBeenCalled();

		releaseSecond();
		expect(releases.get(secondTarget)).toHaveBeenCalledOnce();
		expect(unsubscribe).toHaveBeenCalledOnce();

		const releaseThird = registerHTMLFrameTarget(store, {
			target: firstTarget,
			getOcclusion: () => false,
			onOcclusionChange: vi.fn(),
			update: vi.fn(),
		});
		expect(subscribe).toHaveBeenCalledTimes(2);
		releaseThird();
		expect(unsubscribe).toHaveBeenCalledTimes(2);
	});

	it('keeps target setup across ineligible frames and cleans up when the strategy changes', () => {
		const scene = new Scene();
		const camera = new PerspectiveCamera();
		camera.position.z = 5;
		const hiddenParent = new Group();
		hiddenParent.visible = false;
		const target = createTarget(new Group());
		hiddenParent.add(target.anchor);
		scene.add(hiddenParent);

		const releaseFirstStrategy = vi.fn();
		const releaseSecondStrategy = vi.fn();
		const firstStrategy: NgtsHTMLOcclusionStrategy = {
			setupTarget: vi.fn(() => releaseFirstStrategy),
			beginFrame: vi.fn(),
			isOccluded: vi.fn(() => false),
		};
		const secondStrategy: NgtsHTMLOcclusionStrategy = {
			setupTarget: vi.fn(() => releaseSecondStrategy),
			beginFrame: vi.fn(),
			isOccluded: vi.fn(() => false),
		};
		let occlusion: NgtsHTMLOcclusionStrategy = firstStrategy;
		const onOcclusionChange = vi.fn();
		const update = vi.fn();
		const { callback, store } = createStore();
		const release = registerHTMLFrameTarget(store, {
			target,
			getOcclusion: () => occlusion,
			onOcclusionChange,
			update,
		});

		callback()?.(createFrame(scene, camera));
		expect(firstStrategy.setupTarget).toHaveBeenCalledWith(target);
		expect(firstStrategy.beginFrame).not.toHaveBeenCalled();
		expect(firstStrategy.isOccluded).not.toHaveBeenCalled();
		expect(onOcclusionChange).toHaveBeenCalledWith(true);
		expect(update).not.toHaveBeenCalled();

		hiddenParent.visible = true;
		callback()?.(createFrame(scene, camera));
		expect(firstStrategy.setupTarget).toHaveBeenCalledOnce();
		expect(firstStrategy.beginFrame).toHaveBeenCalledWith([target], expect.objectContaining({ id: 2 }));
		expect(firstStrategy.isOccluded).toHaveBeenCalledOnce();
		expect(onOcclusionChange).toHaveBeenLastCalledWith(false);
		expect(update).toHaveBeenCalledOnce();

		occlusion = secondStrategy;
		callback()?.(createFrame(scene, camera));
		expect(releaseFirstStrategy).toHaveBeenCalledOnce();
		expect(secondStrategy.setupTarget).toHaveBeenCalledWith(target);
		expect(secondStrategy.beginFrame).toHaveBeenCalledWith([target], expect.objectContaining({ id: 3 }));
		expect(secondStrategy.isOccluded).toHaveBeenCalledOnce();
		expect(onOcclusionChange).toHaveBeenLastCalledWith(false);
		expect(update).toHaveBeenCalledTimes(2);

		release();
		expect(releaseSecondStrategy).toHaveBeenCalledOnce();
	});

	it('runs one default scene raycast for each eligible target', () => {
		const scene = new Scene();
		const camera = new PerspectiveCamera();
		camera.position.z = 5;
		const firstTarget = createTarget(new Group());
		const secondTarget = createTarget(new Group());
		scene.add(firstTarget.anchor, secondTarget.anchor);
		const frame = createFrame(scene, camera);
		const intersectObjects = vi.spyOn(frame.raycaster, 'intersectObjects');
		const { callback, store } = createStore();
		const releaseFirst = registerHTMLFrameTarget(store, {
			target: firstTarget,
			getOcclusion: () => true,
			onOcclusionChange: vi.fn(),
			update: vi.fn(),
		});
		const releaseSecond = registerHTMLFrameTarget(store, {
			target: secondTarget,
			getOcclusion: () => true,
			onOcclusionChange: vi.fn(),
			update: vi.fn(),
		});

		callback()?.(frame);

		expect(intersectObjects).toHaveBeenCalledTimes(2);
		expect(intersectObjects).toHaveBeenNthCalledWith(1, [scene], true);
		expect(intersectObjects).toHaveBeenNthCalledWith(2, [scene], true);

		releaseFirst();
		releaseSecond();
	});
});
