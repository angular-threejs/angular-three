// import {
// 	AbstractType,
// 	DestroyRef,
// 	Directive,
// 	ElementRef,
// 	inject,
// 	InjectionToken,
// 	Provider,
// 	ProviderToken,
// 	Type,
// } from '@angular/core';
// import { HTML } from './renderer-old';
// import { DOM_PARENT } from './renderer-old/constants';
// import { injectStore } from './store';
// import { NgtAnyRecord } from './types';

import {
	AbstractType,
	DestroyRef,
	Directive,
	ElementRef,
	inject,
	InjectionToken,
	Provider,
	ProviderToken,
	Type,
} from '@angular/core';
import { NGT_DOM_PARENT_FLAG, NGT_HTML_FLAG } from './renderer/constants';
import { injectStore } from './store';
import { NgtAnyRecord } from './types';

//
const NGT_HTML_DOM_ELEMENT = new InjectionToken<'gl' | HTMLElement>('NGT_HTML_DOM_ELEMENT');

export function provideHTMLDomElement(): Provider;
export function provideHTMLDomElement(factory: () => HTMLElement): Provider;
export function provideHTMLDomElement<
	TDeps extends Array<ProviderToken<any>>,
	TValues extends {
		[K in keyof TDeps]: TDeps[K] extends Type<infer T> | AbstractType<infer T> | InjectionToken<infer T>
			? T
			: never;
	},
>(deps: TDeps, factory: (...args: TValues) => HTMLElement): Provider;
export function provideHTMLDomElement(...args: any[]) {
	if (args.length === 0) {
		return { provide: NGT_HTML_DOM_ELEMENT, useFactory: () => 'gl' };
	}

	if (args.length === 1) {
		return { provide: NGT_HTML_DOM_ELEMENT, useFactory: args[0] };
	}

	return { provide: NGT_HTML_DOM_ELEMENT, useFactory: args.pop(), deps: args };
}

@Directive()
export abstract class NgtHTML {
	static [NGT_HTML_FLAG] = true;

	protected domElement = inject(NGT_HTML_DOM_ELEMENT, { self: true, optional: true });

	constructor() {
		const host = inject<ElementRef<HTMLElement>>(ElementRef);
		const store = injectStore();

		if (this.domElement === 'gl') {
			Object.assign(host.nativeElement, {
				[NGT_DOM_PARENT_FLAG]: store.snapshot.gl.domElement.parentElement,
			});
		} else if (this.domElement) {
			Object.assign(host.nativeElement, { [NGT_DOM_PARENT_FLAG]: this.domElement });
		}

		inject(DestroyRef).onDestroy(() => {
			(host.nativeElement as NgtAnyRecord)[NGT_DOM_PARENT_FLAG] = null;
			delete (host.nativeElement as NgtAnyRecord)[NGT_DOM_PARENT_FLAG];
		});
	}
}
