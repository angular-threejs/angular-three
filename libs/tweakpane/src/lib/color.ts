import { Directive, inject, input } from '@angular/core';
import { ColorInputParams } from 'tweakpane';
import { TweakpaneBinding, provideTweakBindingAsHost } from './binding';

/**
 * Directive for creating a color picker control in Tweakpane.
 *
 * Provides two-way binding for color values (as hex strings) with a
 * color picker UI that supports RGB, HSL, and alpha.
 *
 * @example
 * ```html
 * <tweakpane-pane>
 *   <tweakpane-color label="Background" [(value)]="backgroundColor" />
 *   <tweakpane-color label="Accent" [(value)]="accentColor" [params]="{ alpha: true }" />
 * </tweakpane-pane>
 * ```
 */
@Directive({
	selector: 'tweakpane-color',
	hostDirectives: [{ directive: TweakpaneBinding, inputs: ['value'], outputs: ['valueChange'] }],
	providers: [provideTweakBindingAsHost()],
})
export class TweakpaneColor {
	/**
	 * Additional Tweakpane color input parameters.
	 * Can include options like `alpha`, `color.type`, etc.
	 * @default {}
	 */
	params = input<ColorInputParams>({});

	private binding = inject(TweakpaneBinding);

	constructor() {
		this.binding.syncBindingParams(this.params);
	}
}
