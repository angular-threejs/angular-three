import { Directive, inject, input } from '@angular/core';
import { StringInputParams } from 'tweakpane';
import { TweakpaneBinding, provideTweakBindingAsHost } from './binding';

/**
 * Directive for creating a text input control in Tweakpane.
 *
 * Provides two-way binding for string values with a text input UI.
 *
 * @example
 * ```html
 * <tweakpane-pane>
 *   <tweakpane-text label="Name" [(value)]="objectName" />
 *   <tweakpane-text label="Description" [(value)]="description" />
 * </tweakpane-pane>
 * ```
 */
@Directive({
	selector: 'tweakpane-text',
	hostDirectives: [{ directive: TweakpaneBinding, inputs: ['value'], outputs: ['valueChange'] }],
	providers: [provideTweakBindingAsHost()],
})
export class TweakpaneText {
	/**
	 * Additional Tweakpane string input parameters.
	 * @default {}
	 */
	params = input<StringInputParams>({});

	private binding = inject(TweakpaneBinding);

	constructor() {
		this.binding.syncBindingParams(this.params);
	}
}
