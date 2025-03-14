import { Directive, inject, input } from '@angular/core';
import { NumberInputParams } from 'tweakpane';
import { TweakpaneBinding, provideTweakBindingAsHost } from './binding';

@Directive({
	selector: 'tweakpane-number',
	hostDirectives: [{ directive: TweakpaneBinding, inputs: ['value'], outputs: ['valueChange'] }],
	providers: [provideTweakBindingAsHost()],
})
export class TweakpaneNumber {
	params = input<NumberInputParams>({});

	private binding = inject(TweakpaneBinding);

	constructor() {
		this.binding.syncBindingParams(this.params);
	}
}
