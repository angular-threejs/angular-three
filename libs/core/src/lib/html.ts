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
//
// const NGT_HTML_DOM_ELEMENT = new InjectionToken<'gl' | HTMLElement>('NGT_HTML_DOM_ELEMENT');
//
// export function provideHTMLDomElement(): Provider;
// export function provideHTMLDomElement(factory: () => HTMLElement): Provider;
// export function provideHTMLDomElement<
// 	TDeps extends Array<ProviderToken<any>>,
// 	TValues extends {
// 		[K in keyof TDeps]: TDeps[K] extends Type<infer T> | AbstractType<infer T> | InjectionToken<infer T> ? T : never;
// 	},
// >(deps: TDeps, factory: (...args: TValues) => HTMLElement): Provider;
// export function provideHTMLDomElement(...args: any[]) {
// 	if (args.length === 0) {
// 		return { provide: NGT_HTML_DOM_ELEMENT, useFactory: () => 'gl' };
// 	}
//
// 	if (args.length === 1) {
// 		return { provide: NGT_HTML_DOM_ELEMENT, useFactory: args[0] };
// 	}
//
// 	return { provide: NGT_HTML_DOM_ELEMENT, useFactory: args.pop(), deps: args };
// }
//
// @Directive()
// export abstract class NgtHTML {
// 	static [HTML] = true;
//
// 	protected store = injectStore();
// 	protected destroyRef = inject(DestroyRef);
// 	protected host = inject<ElementRef<HTMLElement>>(ElementRef);
// 	protected domElement = inject(NGT_HTML_DOM_ELEMENT, { self: true, optional: true });
//
// 	constructor() {
// 		if (this.domElement === 'gl') {
// 			Object.assign(this.host.nativeElement, {
// 				[DOM_PARENT]: this.store.snapshot.gl.domElement.parentElement,
// 			});
// 		} else if (this.domElement) {
// 			Object.assign(this.host.nativeElement, { [DOM_PARENT]: this.domElement });
// 		}
//
// 		this.destroyRef.onDestroy(() => {
// 			(this.host.nativeElement as NgtAnyRecord)[DOM_PARENT] = null;
// 			delete (this.host.nativeElement as NgtAnyRecord)[DOM_PARENT];
// 		});
// 	}
// }
