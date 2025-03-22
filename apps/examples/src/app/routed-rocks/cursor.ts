import { DOCUMENT } from '@angular/common';
import { Directive, ElementRef, inject } from '@angular/core';
import { getInstanceState, objectEvents } from 'angular-three';
import { Object3D } from 'three';

@Directive({ selector: '[cursor]' })
export class Cursor {
	constructor() {
		const elementRef = inject<ElementRef<Object3D>>(ElementRef);
		const nativeElement = elementRef.nativeElement;

		if (!nativeElement.isObject3D) return;

		const instanceState = getInstanceState(nativeElement);
		if (!instanceState) return;

		const document = inject(DOCUMENT);

		objectEvents(() => nativeElement, {
			pointerover: () => {
				document.body.style.cursor = 'pointer';
			},
			pointerout: () => {
				document.body.style.cursor = 'default';
			},
		});
	}
}
