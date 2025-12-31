import { Directive, inject, input } from '@angular/core';
import { BooleanInputParams } from 'tweakpane';
import { TweakpaneBinding, provideTweakBindingAsHost } from './binding';

/**
 * Directive for creating a boolean checkbox control in Tweakpane.
 *
 * Provides two-way binding for boolean values with a checkbox UI.
 *
 * @example
 * ```html
 * <tweakpane-pane>
 *   <tweakpane-checkbox label="Debug Mode" [(value)]="debugMode" />
 *   <tweakpane-checkbox label="Wireframe" [(value)]="showWireframe" [disabled]="!debugMode()" />
 * </tweakpane-pane>
 * ```
 */
@Directive({
	selector: 'tweakpane-checkbox',
	hostDirectives: [{ directive: TweakpaneBinding, inputs: ['value'], outputs: ['valueChange'] }],
	providers: [provideTweakBindingAsHost()],
})
export class TweakpaneCheckbox {
	/**
	 * Additional Tweakpane boolean input parameters.
	 * @default {}
	 */
	params = input<BooleanInputParams>({});

	private binding = inject(TweakpaneBinding);

	constructor() {
		this.binding.syncBindingParams(this.params);
	}
}
