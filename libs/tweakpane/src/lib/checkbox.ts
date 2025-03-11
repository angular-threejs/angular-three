import { Directive, inject, input } from '@angular/core';
import { BooleanInputParams } from 'tweakpane';
import { NgtTweakBinding, provideTweakBindingAsHost } from './binding';

@Directive({
	selector: 'ngt-tweak-checkbox',
	hostDirectives: [{ directive: NgtTweakBinding, inputs: ['value'], outputs: ['valueChange'] }],
	providers: [provideTweakBindingAsHost()],
})
export class NgtTweakCheckbox {
	params = input<BooleanInputParams>({});

	private binding = inject(NgtTweakBinding);

	constructor() {
		this.binding.syncBindingParams(this.params);
	}
}
