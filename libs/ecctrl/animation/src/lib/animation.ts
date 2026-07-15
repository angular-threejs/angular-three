import { booleanAttribute, Directive, inject, input, output, signal } from '@angular/core';
import { beforeRender } from 'angular-three';
import { NgteEcctrl, type NgteEcctrlHandle, type NgteEcctrlState } from 'angular-three-ecctrl';

/** The locomotion states supplied by Ecctrl's optional animation adapter. */
export type NgteEcctrlAnimationStateValue =
	| 'IDLE'
	| 'WALK'
	| 'RUN'
	| 'JUMP_START'
	| 'JUMP_IDLE'
	| 'JUMP_FALL'
	| 'JUMP_LAND';

/** Context passed to animation-state resolvers. */
export interface NgteEcctrlAnimationStateContext {
	readonly ecctrl: NgteEcctrlHandle;
	readonly state: NgteEcctrlState;
	readonly delta: number;
	readonly previousState: NgteEcctrlAnimationStateValue | null;
	readonly isOnGround: boolean;
	readonly wasOnGround: boolean;
	readonly isFalling: boolean;
	readonly isMoving: boolean;
	readonly runActive: boolean;
	readonly jumpActive: boolean;
}

/** Resolves an animation state from the character's live movement state. */
export type NgteEcctrlAnimationStateResolver = (
	context: NgteEcctrlAnimationStateContext,
) => NgteEcctrlAnimationStateValue;

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
		if (!wasOnGround && !isMoving) return 'JUMP_LAND';
		if (!isMoving) return 'IDLE';
		return runActive ? 'RUN' : 'WALK';
	}
	return isFalling ? 'JUMP_FALL' : 'JUMP_IDLE';
};

/** Maps a mounted Ecctrl's physical state to stable animation transitions. */
@Directive({
	selector: 'ngte-ecctrl[animationState]',
	exportAs: 'animationState',
})
export class NgteEcctrlAnimationState {
	enabled = input(true, { alias: 'animationState', transform: booleanAttribute });
	resolver = input<NgteEcctrlAnimationStateResolver>(resolveEcctrlAnimationState);
	animationStateChange = output<NgteEcctrlAnimationStateValue>();

	private readonly ecctrl = inject(NgteEcctrl, { host: true });
	private previousState: NgteEcctrlAnimationStateValue | null = null;
	private previousGrounded = false;
	private initialized = false;
	readonly state = signal<NgteEcctrlAnimationStateValue>('IDLE');

	constructor() {
		beforeRender(({ delta }) => this.update(delta));
	}

	private update(delta: number) {
		if (!this.enabled()) return;
		const state = this.ecctrl.state();
		if (!state.physicsReady) return;

		const isOnGround = state.grounded;
		const wasOnGround = this.initialized ? this.previousGrounded : isOnGround;
		const nextState = this.resolver()({
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
		});

		if (nextState !== this.state()) {
			this.state.set(nextState);
			this.animationStateChange.emit(nextState);
		}
		this.previousState = nextState;
		this.previousGrounded = isOnGround;
		this.initialized = true;
	}
}
