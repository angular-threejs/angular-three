import { describe, expect, it, vi } from 'vitest';
import { acquireCanvasStyleLease } from './canvas-style-lease';

describe(acquireCanvasStyleLease.name, () => {
	it('keeps shared blending styles until the final independent lease is released', () => {
		const canvas = document.createElement('canvas');
		const first = acquireCanvasStyleLease(canvas, 10);
		const second = acquireCanvasStyleLease(canvas, 20);

		expect(canvas.style.zIndex).toBe('20');
		expect(canvas.style.position).toBe('absolute');
		expect(canvas.style.pointerEvents).toBe('none');

		second.release();
		expect(canvas.style.zIndex).toBe('10');
		expect(canvas.style.position).toBe('absolute');
		expect(canvas.style.pointerEvents).toBe('none');

		first.release();
		expect(canvas.getAttribute('style')).toBe('');
	});

	it('updates a claim deterministically without disturbing other owners', () => {
		const canvas = document.createElement('canvas');
		const first = acquireCanvasStyleLease(canvas, 10);
		const second = acquireCanvasStyleLease(canvas, 20);

		first.update(30);
		expect(canvas.style.zIndex).toBe('30');

		first.release();
		expect(canvas.style.zIndex).toBe('20');
		second.release();
	});

	it('restores exact prior inline values and treats cleanup as idempotent', () => {
		const canvas = document.createElement('canvas');
		canvas.style.setProperty('z-index', '7', 'important');
		canvas.style.position = 'relative';
		canvas.style.pointerEvents = 'auto';
		const lease = acquireCanvasStyleLease(canvas, 100);

		lease.release();
		lease.release();

		expect(canvas.style.getPropertyValue('z-index')).toBe('7');
		expect(canvas.style.position).toBe('relative');
		expect(canvas.style.pointerEvents).toBe('auto');
	});

	it('passes captured priorities back to the CSS declaration on restoration', () => {
		const values: Record<string, string> = {
			'z-index': '7',
			position: 'relative',
			'pointer-events': 'auto',
		};
		const priorities: Record<string, string> = { 'z-index': 'important' };
		const setProperty = vi.fn();
		const element = {
			style: {
				getPropertyValue: (property: string) => values[property] || '',
				getPropertyPriority: (property: string) => priorities[property] || '',
				setProperty,
				removeProperty: vi.fn(),
			},
		} as unknown as HTMLElement;

		const lease = acquireCanvasStyleLease(element, 100);
		lease.release();

		expect(setProperty).toHaveBeenCalledWith('z-index', '7', 'important');
	});
});
