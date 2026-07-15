import { ChangeDetectionStrategy, Component, signal, viewChild } from '@angular/core';
import { NgtrPhysics } from 'angular-three-rapier';
import { NgtTestBed } from 'angular-three/testing';
import { vi } from 'vitest';
import { NgteTimeControl } from './time-control';

@Component({
	template: `
		<ngte-time-control [paused]="paused()" [timeScale]="timeScale()" [maxDelta]="maxDelta()" />
	`,
	imports: [NgteTimeControl],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
class TimeHarness {
	paused = signal(false);
	timeScale = signal(0.5);
	maxDelta = signal(0.05);
	readonly control = viewChild.required(NgteTimeControl);
}

describe(NgteTimeControl.name, () => {
	it('scales and clamps render deltas while the paused world is playing', async () => {
		const physics = { paused: signal(true), step: vi.fn() };
		const { advance, sceneGraphComponentRef } = NgtTestBed.create(TimeHarness, {
			providers: [{ provide: NgtrPhysics, useValue: physics }],
		});

		await advance(1, 0.2);
		expect(physics.step).toHaveBeenCalledWith(0.025);
		expect(sceneGraphComponentRef.instance.control().elapsed()).toBe(0.025);
	});

	it('supports single stepping while playback is stopped', async () => {
		const physics = { paused: signal(true), step: vi.fn() };
		const { advance, fixture, sceneGraphComponentRef } = NgtTestBed.create(TimeHarness, {
			providers: [{ provide: NgtrPhysics, useValue: physics }],
		});
		const harness = sceneGraphComponentRef.instance;
		harness.paused.set(true);
		fixture.detectChanges();
		await advance(1, 0.1);
		expect(physics.step).not.toHaveBeenCalled();

		expect(harness.control().stepOnce(0.04)).toBe(true);
		expect(physics.step).toHaveBeenCalledWith(0.02);
	});

	it('refuses to double-step an automatically advancing physics world', () => {
		const physics = { paused: signal(false), step: vi.fn() };
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
		const { sceneGraphComponentRef } = NgtTestBed.create(TimeHarness, {
			providers: [{ provide: NgtrPhysics, useValue: physics }],
		});

		expect(sceneGraphComponentRef.instance.control().stepOnce()).toBe(false);
		expect(physics.step).not.toHaveBeenCalled();
		expect(warn).toHaveBeenCalledOnce();
		warn.mockRestore();
	});
});
