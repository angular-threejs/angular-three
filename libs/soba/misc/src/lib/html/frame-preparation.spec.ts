import type { NgtBeforeRenderRecord, NgtState, SignalState } from 'angular-three';
import { PerspectiveCamera, Scene } from 'three';
import { describe, expect, it, vi } from 'vitest';
import { acquireHTMLFramePreparation } from './frame-preparation';

describe(acquireHTMLFramePreparation.name, () => {
	it('subscribes once per store and reference-counts independent labels', () => {
		const scene = new Scene();
		const camera = new PerspectiveCamera();
		const updateScene = vi.spyOn(scene, 'updateWorldMatrix');
		const updateCamera = vi.spyOn(camera, 'updateWorldMatrix');
		const unsubscribe = vi.fn();
		let callback: NgtBeforeRenderRecord['callback'] | undefined;
		const subscribe = vi.fn((next: NgtBeforeRenderRecord['callback']) => {
			callback = next;
			return unsubscribe;
		});
		const store = {
			snapshot: { internal: { subscribe } },
		} as unknown as SignalState<NgtState>;

		const releaseFirst = acquireHTMLFramePreparation(store);
		const releaseSecond = acquireHTMLFramePreparation(store);
		callback?.({ scene, camera } as NgtState & { delta: number });

		expect(subscribe).toHaveBeenCalledOnce();
		expect(updateScene).toHaveBeenCalledWith(true, true);
		expect(updateCamera).toHaveBeenCalledWith(true, false);

		releaseFirst();
		releaseFirst();
		expect(unsubscribe).not.toHaveBeenCalled();

		releaseSecond();
		expect(unsubscribe).toHaveBeenCalledOnce();

		const releaseThird = acquireHTMLFramePreparation(store);
		expect(subscribe).toHaveBeenCalledTimes(2);
		releaseThird();
		expect(unsubscribe).toHaveBeenCalledTimes(2);
	});
});
