import { Directive, inject, input } from '@angular/core';
import { NumberInputParams } from 'tweakpane';
import { TweakpaneBinding, provideTweakBindingAsHost } from './binding';

/**
 * Directive for creating a numeric input control in Tweakpane.
 *
 * Provides two-way binding for number values with optional min/max/step
 * constraints. Displays as a text input with increment buttons, or as
 * a slider if min and max are specified.
 *
 * @example
 * ```html
 * <tweakpane-pane>
 *   <!-- Simple number input -->
 *   <tweakpane-number label="Count" [(value)]="count" />
 *
 *   <!-- With slider (min/max defined) -->
 *   <tweakpane-number
 *     label="Speed"
 *     [(value)]="speed"
 *     [params]="{ min: 0, max: 100, step: 0.1 }"
 *   />
 *
 *   <!-- With custom format -->
 *   <tweakpane-number
 *     label="Angle"
 *     [(value)]="angle"
 *     [params]="{ min: 0, max: 360, format: (v) => v.toFixed(0) + '°' }"
 *   />
 * </tweakpane-pane>
 * ```
 */
@Directive({
	selector: 'tweakpane-number',
	hostDirectives: [{ directive: TweakpaneBinding, inputs: ['value'], outputs: ['valueChange'] }],
	providers: [provideTweakBindingAsHost()],
})
export class TweakpaneNumber {
	/**
	 * Additional Tweakpane number input parameters.
	 * Can include `min`, `max`, `step`, `format`, etc.
	 * @default {}
	 */
	params = input<NumberInputParams>({});

	private binding = inject(TweakpaneBinding);

	constructor() {
		this.binding.syncBindingParams(this.params);
	}
}
