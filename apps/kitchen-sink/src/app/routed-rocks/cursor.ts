import { DOCUMENT } from '@angular/common';
import { Directive, ElementRef, inject } from '@angular/core';
import { getLocalState, injectObjectEvents } from 'angular-three';
import { Object3D } from 'three';

@Directive({ selector: '[cursor]' })
export class Cursor {
	constructor() {
		const elementRef = inject<ElementRef<Object3D>>(ElementRef);
		const nativeElement = elementRef.nativeElement;

		if (!nativeElement.isObject3D) return;

		const localState = getLocalState(nativeElement);
		if (!localState) return;

		const document = inject(DOCUMENT);

		injectObjectEvents(() => nativeElement, {
			pointerover: () => {
				document.body.style.cursor = 'pointer';
			},
			pointerout: () => {
				document.body.style.cursor = 'default';
			},
		});
	}
}
