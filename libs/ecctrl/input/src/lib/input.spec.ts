import { ChangeDetectionStrategy, Component, forwardRef, model, signal, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgteEcctrl, type NgteEcctrlMovementInput } from 'angular-three-ecctrl';
import { NgteEcctrlJoystick } from './joystick';
import { NgteEcctrlMovementBinding } from './movement-input';
import { NgteEcctrlVirtualButton } from './virtual-button';

const setMovement = vi.fn();

@Component({
	selector: 'ngte-ecctrl',
	template: '',
	providers: [{ provide: NgteEcctrl, useValue: { setMovement } }],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
class MockEcctrl {}

@Component({
	selector: 'ngte-ecctrl',
	template: '',
	providers: [{ provide: NgteEcctrl, useExisting: forwardRef(() => ModelBackedMockEcctrl) }],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
class ModelBackedMockEcctrl {
	readonly movement = model<NgteEcctrlMovementInput>({});
	readonly updates: Partial<NgteEcctrlMovementInput>[] = [];

	setMovement(input: Partial<NgteEcctrlMovementInput>) {
		this.updates.push(input);
		this.movement.update((current) => ({ ...current, ...input }));
	}
}

@Component({
	template: `
		<ngte-ecctrl [ecctrlMovementInput]="movement()" />
	`,
	imports: [MockEcctrl, NgteEcctrlMovementBinding],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
class MovementBindingHarness {
	readonly movement = signal<Partial<NgteEcctrlMovementInput>>({ forward: true, jump: true });
}

@Component({
	template: `
		<ngte-ecctrl [ecctrlMovementInput]="movement()" />
	`,
	imports: [ModelBackedMockEcctrl, NgteEcctrlMovementBinding],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
class ModelBackedMovementBindingHarness {
	readonly movement = signal<Partial<NgteEcctrlMovementInput>>({ forward: true });
	readonly controller = viewChild.required(ModelBackedMockEcctrl);
}

@Component({
	template: `
		@if (visible()) {
			<ngte-ecctrl-joystick [value]="joystick()" (valueChange)="joystick.set($event)" />
			<ngte-ecctrl-virtual-button [pressed]="pressed()" (pressedChange)="pressed.set($event)" />
		}
	`,
	imports: [NgteEcctrlJoystick, NgteEcctrlVirtualButton],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
class BoundInputsHarness {
	readonly visible = signal(true);
	readonly joystick = signal({ x: 0, y: 0 });
	readonly pressed = signal(false);

	clearAndHide() {
		this.joystick.set({ x: 0, y: 0 });
		this.pressed.set(false);
		this.visible.set(false);
	}
}

function pointerEvent(type: string, init: Partial<PointerEvent>) {
	const event = new Event(type, { bubbles: true, cancelable: true }) as PointerEvent;
	for (const [key, value] of Object.entries(init)) Object.defineProperty(event, key, { value });
	return event;
}

describe(NgteEcctrlJoystick.name, () => {
	let fixture: ComponentFixture<NgteEcctrlJoystick>;

	beforeEach(() => {
		fixture = TestBed.createComponent(NgteEcctrlJoystick);
		vi.spyOn(fixture.nativeElement, 'getBoundingClientRect').mockReturnValue({
			left: 0,
			top: 0,
			width: 100,
			height: 100,
			right: 100,
			bottom: 100,
			x: 0,
			y: 0,
			toJSON: () => ({}),
		});
		fixture.detectChanges();
	});

	it('normalizes, clamps, and releases one captured pointer', () => {
		fixture.nativeElement.dispatchEvent(
			pointerEvent('pointerdown', { pointerId: 7, pointerType: 'touch', button: 0, clientX: 100, clientY: 50 }),
		);
		expect(fixture.componentInstance.active()).toBe(true);
		expect(fixture.componentInstance.value()).toEqual({ x: 1, y: -0 });

		fixture.nativeElement.dispatchEvent(
			pointerEvent('pointermove', { pointerId: 8, pointerType: 'touch', clientX: 0, clientY: 50 }),
		);
		expect(fixture.componentInstance.value().x).toBe(1);

		fixture.nativeElement.dispatchEvent(pointerEvent('pointerup', { pointerId: 7, pointerType: 'touch' }));
		expect(fixture.componentInstance.active()).toBe(false);
		expect(fixture.componentInstance.value()).toEqual({ x: 0, y: 0 });
	});

	it('applies a radial deadzone', () => {
		fixture.componentRef.setInput('deadzone', 0.08);
		fixture.detectChanges();
		fixture.nativeElement.dispatchEvent(
			pointerEvent('pointerdown', { pointerId: 1, pointerType: 'touch', clientX: 52, clientY: 50 }),
		);
		expect(fixture.componentInstance.value()).toEqual({ x: 0, y: 0 });
	});

	it('resets when disabled and emits nothing while being destroyed', () => {
		fixture.nativeElement.dispatchEvent(
			pointerEvent('pointerdown', { pointerId: 11, pointerType: 'touch', button: 0, clientX: 100, clientY: 50 }),
		);
		fixture.componentRef.setInput('disabled', true);
		fixture.detectChanges();
		expect(fixture.componentInstance.active()).toBe(false);
		expect(fixture.componentInstance.value()).toEqual({ x: 0, y: 0 });

		fixture.componentRef.setInput('disabled', false);
		fixture.detectChanges();
		fixture.nativeElement.dispatchEvent(
			pointerEvent('pointerdown', { pointerId: 12, pointerType: 'touch', button: 0, clientX: 100, clientY: 50 }),
		);
		const valueChange = vi.fn();
		const activeChange = vi.fn();
		fixture.componentInstance.value.subscribe(valueChange);
		fixture.componentInstance.active.subscribe(activeChange);
		fixture.destroy();
		expect(valueChange).not.toHaveBeenCalled();
		expect(activeChange).not.toHaveBeenCalled();
	});
});

describe(NgteEcctrlVirtualButton.name, () => {
	it('uses momentary pointer and keyboard semantics', () => {
		const fixture = TestBed.createComponent(NgteEcctrlVirtualButton);
		fixture.detectChanges();
		const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');

		button.dispatchEvent(pointerEvent('pointerdown', { pointerId: 3, pointerType: 'touch', button: 0 }));
		expect(fixture.componentInstance.pressed()).toBe(true);
		button.dispatchEvent(pointerEvent('pointercancel', { pointerId: 3, pointerType: 'touch' }));
		expect(fixture.componentInstance.pressed()).toBe(false);

		button.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true }));
		expect(fixture.componentInstance.pressed()).toBe(true);
		button.dispatchEvent(new KeyboardEvent('keyup', { key: ' ', bubbles: true, cancelable: true }));
		expect(fixture.componentInstance.pressed()).toBe(false);
	});

	it('releases a press when disabled and emits nothing while being destroyed', () => {
		const fixture = TestBed.createComponent(NgteEcctrlVirtualButton);
		fixture.detectChanges();
		const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');

		button.dispatchEvent(pointerEvent('pointerdown', { pointerId: 5, pointerType: 'touch', button: 0 }));
		fixture.componentRef.setInput('disabled', true);
		fixture.detectChanges();
		expect(fixture.componentInstance.pressed()).toBe(false);

		fixture.componentRef.setInput('disabled', false);
		fixture.detectChanges();
		button.dispatchEvent(pointerEvent('pointerdown', { pointerId: 6, pointerType: 'touch', button: 0 }));
		const pressedChange = vi.fn();
		fixture.componentInstance.pressed.subscribe(pressedChange);
		fixture.destroy();
		expect(pressedChange).not.toHaveBeenCalled();
	});
});

describe('Ecctrl virtual input teardown', () => {
	it('lets the consumer clear owned binding state before controls are removed', () => {
		const fixture = TestBed.createComponent(BoundInputsHarness);
		fixture.detectChanges();
		const joystick: HTMLElement = fixture.nativeElement.querySelector('ngte-ecctrl-joystick');
		vi.spyOn(joystick, 'getBoundingClientRect').mockReturnValue({
			left: 0,
			top: 0,
			width: 100,
			height: 100,
			right: 100,
			bottom: 100,
			x: 0,
			y: 0,
			toJSON: () => ({}),
		});
		const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');

		joystick.dispatchEvent(
			pointerEvent('pointerdown', { pointerId: 13, pointerType: 'touch', button: 0, clientX: 100, clientY: 50 }),
		);
		button.dispatchEvent(pointerEvent('pointerdown', { pointerId: 14, pointerType: 'touch', button: 0 }));
		expect(fixture.componentInstance.joystick().x).toBe(1);
		expect(fixture.componentInstance.pressed()).toBe(true);

		const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
		fixture.componentInstance.clearAndHide();
		fixture.detectChanges();

		expect(fixture.componentInstance.joystick()).toEqual({ x: 0, y: 0 });
		expect(fixture.componentInstance.pressed()).toBe(false);
		expect(warn.mock.calls.flat().join(' ')).not.toContain('NG0953');
		warn.mockRestore();
	});
});

describe(NgteEcctrlMovementBinding.name, () => {
	beforeEach(() => setMovement.mockClear());

	it('merges current movement and clears keys removed while alive', () => {
		const fixture = TestBed.createComponent(MovementBindingHarness);
		fixture.detectChanges();
		expect(setMovement).toHaveBeenLastCalledWith({ forward: true, jump: true });

		fixture.componentInstance.movement.set({ forward: true, joystick: { x: 0.5, y: -0.25 } });
		fixture.detectChanges();
		expect(setMovement).toHaveBeenLastCalledWith({ jump: false, forward: true, joystick: { x: 0.5, y: -0.25 } });

		fixture.destroy();
		expect(setMovement).toHaveBeenCalledTimes(2);
	});

	it('does not update the controller model after its output is destroyed', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
		const fixture = TestBed.createComponent(ModelBackedMovementBindingHarness);
		fixture.detectChanges();
		const controller = fixture.componentInstance.controller();
		expect(controller.updates).toEqual([{ forward: true }]);

		fixture.destroy();

		expect(controller.updates).toEqual([{ forward: true }]);
		expect(warn.mock.calls.flat().join(' ')).not.toContain('NG0953');
		warn.mockRestore();
	});
});
