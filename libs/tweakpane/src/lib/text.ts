import { Directive, inject, input } from '@angular/core';
import { StringInputParams } from 'tweakpane';
import { TweakpaneBinding, provideTweakBindingAsHost } from './binding';

@Directive({
	selector: 'tweakpane-text',
	hostDirectives: [{ directive: TweakpaneBinding, inputs: ['value'], outputs: ['valueChange'] }],
	providers: [provideTweakBindingAsHost()],
})
export class TweakpaneText {
	params = input<StringInputParams>({});

	private binding = inject(TweakpaneBinding);

	constructor() {
		this.binding.syncBindingParams(this.params);
	}
}
