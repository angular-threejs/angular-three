import { Component, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
	createKeyboardControls,
	injectKeyboardControls,
	NgtsKeyboardControls,
	NgtsKeyboardControlsChangeEvent,
	NgtsKeyboardControlsEntry,
} from './keyboard-controls';

const map: NgtsKeyboardControlsEntry[] = [
	{ name: 'forward', keys: ['ArrowUp', 'KeyW'] },
	{ name: 'back', keys: ['ArrowDown', 'KeyS'] },
	{ name: 'jump', keys: ['Space'], up: false },
	{ name: 'torch', keys: ['KeyT'], toggle: true },
];

@Component({
	template: `
		<div [keyboardControls]="map" (keyChange)="events.push($event)"></div>
	`,
	imports: [NgtsKeyboardControls],
})
class Host {
	map = map;
	events: NgtsKeyboardControlsChangeEvent[] = [];
	keyboardControls = viewChild.required(NgtsKeyboardControls);
}

function dispatch(type: 'keydown' | 'keyup', init: KeyboardEventInit) {
	window.dispatchEvent(new KeyboardEvent(type, init));
}

describe(NgtsKeyboardControls.name, () => {
	function setup() {
		const fixture = TestBed.createComponent(Host);
		fixture.detectChanges();
		const host = fixture.componentInstance;
		return { fixture, host, keyboardControls: host.keyboardControls() };
	}

	it('should seed state with every action unpressed', () => {
		const { keyboardControls } = setup();
		expect(keyboardControls.state()).toEqual({ forward: false, back: false, jump: false, torch: false });
	});

	it('should transition on keydown/keyup matched by event.code', () => {
		const { host, keyboardControls } = setup();

		dispatch('keydown', { code: 'KeyW' });
		expect(keyboardControls.state()['forward']).toBe(true);
		expect(host.events).toEqual([
			{ name: 'forward', pressed: true, state: { forward: true, back: false, jump: false, torch: false } },
		]);

		dispatch('keyup', { code: 'KeyW' });
		expect(keyboardControls.state()['forward']).toBe(false);
		expect(host.events.length).toEqual(2);
		expect(host.events[1]).toEqual({
			name: 'forward',
			pressed: false,
			state: { forward: false, back: false, jump: false, torch: false },
		});
	});

	it('should match event.key as well', () => {
		const { keyboardControls } = setup();

		dispatch('keydown', { key: 'ArrowUp' });
		expect(keyboardControls.state()['forward']).toBe(true);

		dispatch('keyup', { key: 'ArrowUp' });
		expect(keyboardControls.state()['forward']).toBe(false);
	});

	it('should ignore keys that are not in the map', () => {
		const { host, keyboardControls } = setup();

		dispatch('keydown', { code: 'KeyX' });
		expect(keyboardControls.state()).toEqual({ forward: false, back: false, jump: false, torch: false });
		expect(host.events.length).toEqual(0);
	});

	it('should reference-count multiple held keys of the same action', () => {
		const { host, keyboardControls } = setup();

		dispatch('keydown', { code: 'KeyW' });
		dispatch('keydown', { key: 'ArrowUp' });
		expect(keyboardControls.state()['forward']).toBe(true);
		expect(host.events.length).toEqual(1);

		// releasing one key while the sibling key is still held keeps the action pressed
		dispatch('keyup', { code: 'KeyW' });
		expect(keyboardControls.state()['forward']).toBe(true);
		expect(host.events.length).toEqual(1);

		dispatch('keyup', { key: 'ArrowUp' });
		expect(keyboardControls.state()['forward']).toBe(false);
		expect(host.events.length).toEqual(2);
	});

	it('should not re-emit on OS auto-repeat keydown', () => {
		const { host } = setup();

		dispatch('keydown', { code: 'KeyW' });
		dispatch('keydown', { code: 'KeyW', repeat: true });
		dispatch('keydown', { code: 'KeyW', repeat: true });
		expect(host.events.length).toEqual(1);
	});

	it('should latch up:false actions true and emit on each press edge', () => {
		const { host, keyboardControls } = setup();

		dispatch('keydown', { code: 'Space' });
		expect(keyboardControls.state()['jump']).toBe(true);
		expect(host.events.length).toEqual(1);

		// keyup does not reset the latched state and emits nothing
		dispatch('keyup', { code: 'Space' });
		expect(keyboardControls.state()['jump']).toBe(true);
		expect(host.events.length).toEqual(1);

		// but the next physical press is a fresh edge
		dispatch('keydown', { code: 'Space' });
		expect(host.events.length).toEqual(2);
		expect(host.events[1].pressed).toBe(true);
	});

	it('should flip toggle actions on each press edge and ignore keyup', () => {
		const { host, keyboardControls } = setup();

		dispatch('keydown', { code: 'KeyT' });
		expect(keyboardControls.state()['torch']).toBe(true);
		expect(host.events.length).toEqual(1);
		expect(host.events[0]).toEqual(expect.objectContaining({ name: 'torch', pressed: true }));

		// keyup is a no-op for toggle actions
		dispatch('keyup', { code: 'KeyT' });
		expect(keyboardControls.state()['torch']).toBe(true);
		expect(host.events.length).toEqual(1);

		// next press edge flips it back off
		dispatch('keydown', { code: 'KeyT' });
		expect(keyboardControls.state()['torch']).toBe(false);
		expect(host.events.length).toEqual(2);
		expect(host.events[1]).toEqual(expect.objectContaining({ name: 'torch', pressed: false }));
		dispatch('keyup', { code: 'KeyT' });

		dispatch('keydown', { code: 'KeyT' });
		expect(keyboardControls.state()['torch']).toBe(true);
	});

	it('should not flip toggle actions on OS auto-repeat keydown', () => {
		const { host, keyboardControls } = setup();

		dispatch('keydown', { code: 'KeyT' });
		dispatch('keydown', { code: 'KeyT', repeat: true });
		dispatch('keydown', { code: 'KeyT', repeat: true });
		expect(keyboardControls.state()['torch']).toBe(true);
		expect(host.events.length).toEqual(1);
	});

	it('should expose a memoized per-action signal via select()', () => {
		const { keyboardControls } = setup();

		const forward = keyboardControls.select('forward');
		expect(forward).toBe(keyboardControls.select('forward'));
		expect(forward()).toBe(false);

		dispatch('keydown', { code: 'KeyW' });
		expect(forward()).toBe(true);
	});

	it('should remove listeners on destroy', () => {
		const { fixture, host } = setup();

		fixture.destroy();
		dispatch('keydown', { code: 'KeyW' });
		expect(host.events.length).toEqual(0);
	});

	describe(injectKeyboardControls.name, () => {
		it('should throw outside of a keyboardControls context', () => {
			TestBed.runInInjectionContext(() => {
				expect(() => injectKeyboardControls()).toThrowError(/keyboardControls directive/);
			});
		});
	});

	describe(createKeyboardControls.name, () => {
		it('should return the entries as-is with a typed inject function', () => {
			const entries = [
				{ name: 'forward', keys: ['KeyW'] },
				{ name: 'jump', keys: ['Space'], up: false },
			] as const;
			const { controlsMap, injectKeyboardControls: injectTyped } = createKeyboardControls(entries);
			expect(controlsMap).toBe(entries);
			expect(typeof injectTyped).toBe('function');
		});
	});
});
