import { booleanAttribute, ChangeDetectionStrategy, Component, effect, input, model } from '@angular/core';

/** An accessible momentary button for jump, run, brake, or vehicle actions. */
@Component({
	selector: 'ngte-ecctrl-virtual-button',
	template: `
		<button
			type="button"
			class="ngte-ecctrl-virtual-button__button"
			[disabled]="disabled()"
			[attr.aria-label]="ariaLabel() || null"
			[attr.aria-pressed]="pressed()"
			(pointerdown)="onPointerDown($event)"
			(pointerup)="onPointerEnd($event)"
			(pointercancel)="onPointerEnd($event)"
			(lostpointercapture)="onPointerEnd($event)"
			(keydown)="onKeyDown($event)"
			(keyup)="onKeyUp($event)"
			(blur)="release()"
		>
			<ng-content />
		</button>
	`,
	styles: `
		:host {
			display: inline-block;
		}

		.ngte-ecctrl-virtual-button__button {
			align-items: center;
			background: color-mix(in srgb, var(--ngte-ecctrl-input-background, #0f172a) 78%, transparent);
			border: 1px solid var(--ngte-ecctrl-input-border, rgb(255 255 255 / 0.35));
			border-radius: 999px;
			color: var(--ngte-ecctrl-input-foreground, #fff);
			display: flex;
			font: inherit;
			font-weight: 700;
			height: var(--ngte-ecctrl-button-size, 72px);
			justify-content: center;
			touch-action: none;
			user-select: none;
			width: var(--ngte-ecctrl-button-size, 72px);
		}

		.ngte-ecctrl-virtual-button__button[aria-pressed='true'] {
			background: var(--ngte-ecctrl-input-active, #0891b2);
			border-color: var(--ngte-ecctrl-input-active-border, #a5f3fc);
			transform: scale(0.94);
		}

		.ngte-ecctrl-virtual-button__button:disabled {
			opacity: 0.45;
		}
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgteEcctrlVirtualButton {
	pressed = model(false);
	disabled = input(false, { transform: booleanAttribute });
	ariaLabel = input<string>();

	private pointerId: number | null = null;
	private pointerTarget: HTMLElement | null = null;

	constructor() {
		effect(() => {
			if (this.disabled()) this.release();
		});
	}

	protected onPointerDown(event: PointerEvent) {
		if (this.disabled() || this.pointerId !== null || (event.pointerType === 'mouse' && event.button !== 0)) return;
		event.preventDefault();
		event.stopPropagation();
		this.pointerId = event.pointerId;
		this.pointerTarget = event.currentTarget as HTMLElement;
		this.pointerTarget.setPointerCapture?.(event.pointerId);
		this.pressed.set(true);
	}

	protected onPointerEnd(event: PointerEvent) {
		if (event.pointerId !== this.pointerId) return;
		event.preventDefault();
		event.stopPropagation();
		this.release();
	}

	protected onKeyDown(event: KeyboardEvent) {
		if (this.disabled() || (event.key !== ' ' && event.key !== 'Enter')) return;
		event.preventDefault();
		this.pressed.set(true);
	}

	protected onKeyUp(event: KeyboardEvent) {
		if (event.key !== ' ' && event.key !== 'Enter') return;
		event.preventDefault();
		this.pressed.set(false);
	}

	protected release() {
		const pointerId = this.pointerId;
		const target = this.pointerTarget;
		this.pointerId = null;
		this.pointerTarget = null;
		if (pointerId !== null && target?.hasPointerCapture?.(pointerId)) target.releasePointerCapture?.(pointerId);
		this.pressed.set(false);
	}
}
