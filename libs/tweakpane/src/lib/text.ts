import { Directive, inject, input } from '@angular/core';
import { StringInputParams } from 'tweakpane';
import { NgtTweakBinding, provideTweakBindingAsHost } from './binding';

@Directive({
	selector: 'ngt-tweak-text',
	hostDirectives: [{ directive: NgtTweakBinding, inputs: ['value'], outputs: ['valueChange'] }],
	providers: [provideTweakBindingAsHost()],
})
export class NgtTweakText {
	params = input<StringInputParams>({});

	private binding = inject(NgtTweakBinding);

	constructor() {
		this.binding.createBindingEffect(this.params);
	}
}
