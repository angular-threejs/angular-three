import { booleanAttribute, Directive, inject, input, output, signal } from '@angular/core';
import { beforeRender } from 'angular-three';
import { NgteEcctrl } from './ecctrl';
import { NgteEcctrlAnimationState, NgteEcctrlAnimationStateContext, NgteEcctrlAnimationStateResolver } from './types';

/**
 * Resolves the same high-level locomotion states exposed by Ecctrl's optional
 * React animation controller. Consumers may replace it with a resolver that
 * maps the live controller state to their own animation graph.
 */
export const resolveEcctrlAnimationState: NgteEcctrlAnimationStateResolver = ({
	isOnGround,
	wasOnGround,
	isFalling,
	isMoving,
	runActive,
	jumpActive,
}) => {
	if (jumpActive && wasOnGround) return 'JUMP_START';

	if (isOnGround) {
		if (!wasOnGround) return 'JUMP_LAND';
		if (!isMoving) return 'IDLE';
		return runActive ? 'RUN' : 'WALK';
	}

	return isFalling ? 'JUMP_FALL' : 'JUMP_IDLE';
};

/**
 * Optional attribute directive that turns Ecctrl's physical state into stable
 * animation-state transitions. Attach it directly to an `ngte-ecctrl` host.
 *
 * ```html
 * <ngte-ecctrl animationState (animationStateChange)="play($event)" />
 * ```
 */
@Directive({
	selector: 'ngte-ecctrl[animationState]',
	exportAs: 'animationState',
})
export class NgteEcctrlAnimationStateController {
	/** Enables the controller; the attribute may be bound to `false` to pause it. */
	enabled = input(true, { alias: 'animationState', transform: booleanAttribute });
	/** Replaces the default state resolver with application-specific animation semantics. */
	resolver = input<NgteEcctrlAnimationStateResolver>(resolveEcctrlAnimationState);
	/** Emits only when a state transition occurs. */
	animationStateChange = output<NgteEcctrlAnimationState>();

	private readonly ecctrl = inject(NgteEcctrl, { host: true });
	private previousState: NgteEcctrlAnimationState | null = null;
	private previousGrounded = false;
	private initialized = false;
	/** Current animation state as an Angular signal. */
	state = signal<NgteEcctrlAnimationState>('IDLE');

	constructor() {
		beforeRender(({ delta }) => this.update(delta));
	}

	private update(delta: number) {
		if (!this.enabled()) return;

		const state = this.ecctrl.state();
		if (!state.physicsReady) return;

		const isOnGround = state.grounded;
		const wasOnGround = this.initialized ? this.previousGrounded : isOnGround;

		const context: NgteEcctrlAnimationStateContext = {
			ecctrl: this.ecctrl.handle,
			state,
			delta,
			previousState: this.previousState,
			isOnGround,
			wasOnGround,
			isFalling: state.falling,
			isMoving: state.moving,
			runActive: state.running,
			jumpActive: state.jumping,
		};
		const nextState = this.resolver()(context);
		if (nextState !== this.state()) {
			this.state.set(nextState);
			this.animationStateChange.emit(nextState);
		}
		this.previousState = nextState;
		this.previousGrounded = isOnGround;
		this.initialized = true;
	}
}
