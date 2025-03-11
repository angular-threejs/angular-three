import { Directive, inject, input } from '@angular/core';
import { ColorInputParams } from 'tweakpane';
import { NgtTweakBinding, provideTweakBindingAsHost } from './binding';

@Directive({
	selector: 'ngt-tweak-color',
	hostDirectives: [{ directive: NgtTweakBinding, inputs: ['value'], outputs: ['valueChange'] }],
	providers: [provideTweakBindingAsHost()],
})
export class NgtTweakColor {
	params = input<ColorInputParams>({});

	private binding = inject(NgtTweakBinding);

	constructor() {
		this.binding.syncBindingParams(this.params);
	}
}
