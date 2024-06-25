import { Directive, input } from '@angular/core';
import { NgtCommonDirective, provideNodeType } from './common';

@Directive({ selector: 'ng-template[args]', standalone: true, providers: [provideNodeType('args')] })
export class NgtArgs<TArgs extends any[] = any[]> extends NgtCommonDirective<TArgs> {
	args = input.required<TArgs | null>();

	protected override inputValue = this.args;

	protected override shouldSkipCreateView(value: TArgs | null): boolean {
		return value == null || !Array.isArray(value) || (value.length === 1 && value[0] === null);
	}

	validate() {
		return !this.injected && !!this.injectedValue?.length;
	}
}
