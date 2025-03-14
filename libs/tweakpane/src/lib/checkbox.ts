import { Directive, inject, input } from '@angular/core';
import { BooleanInputParams } from 'tweakpane';
import { TweakpaneBinding, provideTweakBindingAsHost } from './binding';

@Directive({
	selector: 'tweakpane-checkbox',
	hostDirectives: [{ directive: TweakpaneBinding, inputs: ['value'], outputs: ['valueChange'] }],
	providers: [provideTweakBindingAsHost()],
})
export class TweakpaneCheckbox {
	params = input<BooleanInputParams>({});

	private binding = inject(TweakpaneBinding);

	constructor() {
		this.binding.syncBindingParams(this.params);
	}
}
