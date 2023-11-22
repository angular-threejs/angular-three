import { Directive, Input } from '@angular/core';
import { NgtCommonDirective } from './common';

@Directive({ selector: 'ng-template[key]', standalone: true })
export class NgtKey extends NgtCommonDirective {
	static override processComment = false;

	private lastKey = '';

	override validate(): boolean {
		return false;
	}

	@Input() set key(key: string | number | object) {
		const normalizedKey = JSON.stringify(key);
		if (this.lastKey !== normalizedKey) {
			this.lastKey = normalizedKey;
			this.createView();
		}
	}
}
