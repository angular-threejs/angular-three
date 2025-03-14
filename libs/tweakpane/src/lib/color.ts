import { Directive, inject, input } from '@angular/core';
import { ColorInputParams } from 'tweakpane';
import { TweakpaneBinding, provideTweakBindingAsHost } from './binding';

@Directive({
	selector: 'tweakpane-color',
	hostDirectives: [{ directive: TweakpaneBinding, inputs: ['value'], outputs: ['valueChange'] }],
	providers: [provideTweakBindingAsHost()],
})
export class TweakpaneColor {
	params = input<ColorInputParams>({});

	private binding = inject(TweakpaneBinding);

	constructor() {
		this.binding.syncBindingParams(this.params);
	}
}
