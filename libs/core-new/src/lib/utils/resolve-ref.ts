import { ElementRef } from '@angular/core';
import { is } from './is';

export function resolveRef<TObject>(ref: ElementRef<TObject | undefined> | TObject | undefined): TObject | undefined {
	if (is.ref(ref)) {
		return ref.nativeElement;
	}

	return ref;
}
