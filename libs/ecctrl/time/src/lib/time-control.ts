import {
	booleanAttribute,
	ChangeDetectionStrategy,
	Component,
	inject,
	input,
	numberAttribute,
	output,
	signal,
} from '@angular/core';
import { beforeRender, injectStore } from 'angular-three';
import { NgtrPhysics } from 'angular-three-rapier';

/** Drives a paused Rapier world from the Angular Three render loop. */
@Component({
	selector: 'ngte-time-control',
	exportAs: 'timeControl',
	template: '',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgteTimeControl {
	enabled = input(true, { transform: booleanAttribute });
	/** Pauses render-loop stepping without changing the parent physics configuration. */
	paused = input(false, { transform: booleanAttribute });
	/** Non-negative simulation-time multiplier. */
	timeScale = input(1, { transform: numberAttribute });
	/** Maximum unscaled render delta accepted per frame. */
	maxDelta = input(1 / 30, { transform: numberAttribute });
	/** Render-loop priority. Physics should remain paused while this control is enabled. */
	priority = input(0, { transform: numberAttribute });
	stepped = output<number>();

	/** Total simulation time advanced through this controller. */
	readonly elapsed = signal(0);

	private readonly physics = inject(NgtrPhysics);
	private readonly store = injectStore();
	private warnedAboutUnpausedPhysics = false;

	constructor() {
		beforeRender(
			({ delta }) => {
				if (this.enabled() && !this.paused()) this.advance(delta);
			},
			{ priority: this.priority },
		);
	}

	/** Advances once even while playback is stopped. The parent physics world must be paused. */
	stepOnce(delta = 1 / 60) {
		return this.advance(delta);
	}

	/** Resets the exposed elapsed-time counter without rewinding the physics world. */
	resetElapsed() {
		this.elapsed.set(0);
	}

	private advance(delta: number) {
		if (!this.physics.paused()) {
			if (!this.warnedAboutUnpausedPhysics) {
				console.warn('[NGTE Ecctrl] NgteTimeControl requires its parent NgtrPhysics to be paused.');
				this.warnedAboutUnpausedPhysics = true;
			}
			return false;
		}
		this.warnedAboutUnpausedPhysics = false;

		const timeScale = Math.max(0, this.timeScale());
		const maxDelta = Math.max(0, this.maxDelta());
		if (!Number.isFinite(delta) || delta <= 0 || !Number.isFinite(timeScale) || timeScale === 0 || maxDelta === 0) {
			return false;
		}

		const step = Math.min(delta, maxDelta) * timeScale;
		if (!Number.isFinite(step) || step <= 0) return false;
		this.physics.step(step);
		this.elapsed.update((elapsed) => elapsed + step);
		this.stepped.emit(step);
		this.store.snapshot.invalidate();
		return true;
	}
}
