import { vi } from 'vitest';
import { startIndependentFrameLoop } from './frame-stepper';

describe(startIndependentFrameLoop.name, () => {
	it('skips the unbounded first frame and supplies later RAF deltas in seconds', () => {
		const callbacks: FrameRequestCallback[] = [];
		let nextId = 0;
		const requestFrame = vi.fn((callback: FrameRequestCallback) => {
			callbacks.push(callback);
			return ++nextId;
		});
		const cancelFrame = vi.fn();
		const step = vi.fn();

		const cleanup = startIndependentFrameLoop(step, requestFrame, cancelFrame);
		callbacks.shift()!(1000);
		expect(step).not.toHaveBeenCalled();
		callbacks.shift()!(1016.667);
		expect(step).toHaveBeenCalledOnce();
		expect(step).toHaveBeenCalledWith(expect.closeTo(0.016667, 6));

		cleanup();
		expect(cancelFrame).toHaveBeenCalledWith(nextId);
	});

	it('does not step for duplicate or backwards timestamps', () => {
		const callbacks: FrameRequestCallback[] = [];
		const requestFrame = (callback: FrameRequestCallback) => {
			callbacks.push(callback);
			return callbacks.length;
		};
		const step = vi.fn();

		startIndependentFrameLoop(step, requestFrame, vi.fn());
		callbacks.shift()!(50);
		callbacks.shift()!(50);
		callbacks.shift()!(40);
		expect(step).not.toHaveBeenCalled();
	});
});
