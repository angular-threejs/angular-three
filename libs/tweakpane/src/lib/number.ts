import { Directive, inject, input } from '@angular/core';
import { NumberInputParams } from 'tweakpane';
import { NgtTweakBinding, provideTweakBindingAsHost } from './binding';

@Directive({
	selector: 'ngt-tweak-number',
	hostDirectives: [{ directive: NgtTweakBinding, inputs: ['value'], outputs: ['valueChange'] }],
	providers: [provideTweakBindingAsHost()],
})
export class NgtTweakNumber {
	params = input<NumberInputParams>({});

	private binding = inject(NgtTweakBinding);

	constructor() {
		this.binding.createBindingEffect(this.params);
	}
}
