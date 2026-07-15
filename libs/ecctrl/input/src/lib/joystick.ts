import {
	booleanAttribute,
	ChangeDetectionStrategy,
	Component,
	computed,
	effect,
	ElementRef,
	inject,
	input,
	model,
	numberAttribute,
} from '@angular/core';

export interface NgteEcctrlJoystickValue {
	x: number;
	y: number;
}

/** A source-agnostic, multi-touch-safe virtual joystick for Ecctrl input. */
@Component({
	selector: 'ngte-ecctrl-joystick',
	template: `
		<span class="ngte-ecctrl-joystick__knob" [style.transform]="knobTransform()"></span>
	`,
	host: {
		role: 'application',
		'[attr.aria-label]': 'ariaLabel()',
		'[attr.aria-disabled]': 'disabled()',
		'[class.ngte-ecctrl-joystick--active]': 'active()',
		'[class.ngte-ecctrl-joystick--disabled]': 'disabled()',
		'[style.width.px]': 'size()',
		'[style.height.px]': 'size()',
		'(pointerdown)': 'onPointerDown($event)',
		'(pointermove)': 'onPointerMove($event)',
		'(pointerup)': 'onPointerEnd($event)',
		'(pointercancel)': 'onPointerEnd($event)',
		'(lostpointercapture)': 'onPointerEnd($event)',
	},
	styles: `
		:host {
			align-items: center;
			background: color-mix(in srgb, var(--ngte-ecctrl-input-background, #0f172a) 72%, transparent);
			border: 1px solid var(--ngte-ecctrl-input-border, rgb(255 255 255 / 0.35));
			border-radius: 999px;
			box-sizing: border-box;
			display: flex;
			justify-content: center;
			position: relative;
			touch-action: none;
			user-select: none;
			-webkit-user-select: none;
		}

		:host(.ngte-ecctrl-joystick--active) {
			border-color: var(--ngte-ecctrl-input-active, #67e8f9);
		}

		:host(.ngte-ecctrl-joystick--disabled) {
			opacity: 0.45;
			pointer-events: none;
		}

		.ngte-ecctrl-joystick__knob {
			background: var(--ngte-ecctrl-input-foreground, rgb(255 255 255 / 0.82));
			border-radius: 999px;
			display: block;
			height: var(--ngte-ecctrl-joystick-knob-size, 42%);
			pointer-events: none;
			transition: transform 60ms linear;
			width: var(--ngte-ecctrl-joystick-knob-size, 42%);
		}
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgteEcctrlJoystick {
	value = model<NgteEcctrlJoystickValue>({ x: 0, y: 0 });
	active = model(false);
	disabled = input(false, { transform: booleanAttribute });
	deadzone = input(0, { transform: numberAttribute });
	/** Diameter in CSS pixels; the upstream joystick uses a 50px radius. */
	size = input(100, { transform: numberAttribute });
	ariaLabel = input('Movement joystick');

	private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
	private pointerId: number | null = null;

	protected readonly knobTransform = computed(() => {
		const value = this.value();
		const travel = Math.max(0, this.size() * 0.29);
		return `translate3d(${value.x * travel}px, ${-value.y * travel}px, 0)`;
	});

	constructor() {
		effect(() => {
			if (this.disabled()) this.reset();
		});
	}

	protected onPointerDown(event: PointerEvent) {
		if (this.disabled() || this.pointerId !== null || (event.pointerType === 'mouse' && event.button !== 0)) return;
		this.pointerId = event.pointerId;
		this.active.set(true);
		this.element.setPointerCapture?.(event.pointerId);
		this.updateValue(event);
	}

	protected onPointerMove(event: PointerEvent) {
		if (event.pointerId !== this.pointerId) return;
		this.updateValue(event);
	}

	protected onPointerEnd(event: PointerEvent) {
		if (event.pointerId !== this.pointerId) return;
		event.preventDefault();
		event.stopPropagation();
		this.reset();
	}

	private reset() {
		const pointerId = this.pointerId;
		this.pointerId = null;
		if (pointerId !== null && this.element.hasPointerCapture?.(pointerId)) {
			this.element.releasePointerCapture?.(pointerId);
		}
		this.active.set(false);
		this.value.set({ x: 0, y: 0 });
	}

	private updateValue(event: PointerEvent) {
		event.preventDefault();
		event.stopPropagation();
		const rect = this.element.getBoundingClientRect();
		const radius = Math.max(1, Math.min(rect.width, rect.height) / 2);
		const x = (event.clientX - (rect.left + rect.width / 2)) / radius;
		const y = -(event.clientY - (rect.top + rect.height / 2)) / radius;
		const magnitude = Math.hypot(x, y);
		const clampedMagnitude = Math.min(1, magnitude);
		const deadzone = Math.min(0.99, Math.max(0, this.deadzone()));

		if (clampedMagnitude <= deadzone || magnitude === 0) {
			this.value.set({ x: 0, y: 0 });
			return;
		}

		const scaledMagnitude = (clampedMagnitude - deadzone) / (1 - deadzone);
		this.value.set({
			x: (x / magnitude) * scaledMagnitude,
			y: (y / magnitude) * scaledMagnitude,
		});
	}
}
