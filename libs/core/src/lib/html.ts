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
import { HTML } from './renderer';
import { injectStore } from './store';
import { NgtAnyRecord } from './types';

const NGT_HTML_DOM_ELEMENT = new InjectionToken<'gl' | HTMLElement>('NGT_HTML_DOM_ELEMENT');

export function provideHTMLDomElement(): Provider;
export function provideHTMLDomElement<
	TDeps extends Array<ProviderToken<any>>,
	TValues extends {
		[K in keyof TDeps]: TDeps[K] extends Type<infer T> | AbstractType<infer T> | InjectionToken<infer T> ? T : never;
	},
>(deps: TDeps, factory: (...args: TValues) => HTMLElement): Provider;
export function provideHTMLDomElement(...args: any[]) {
	if (args.length === 0) {
		return { provide: NGT_HTML_DOM_ELEMENT, useFactory: () => 'gl' };
	}

	return { provide: NGT_HTML_DOM_ELEMENT, useFactory: args.pop(), deps: args };
}

@Directive()
export abstract class NgtHTML {
	static [HTML] = true;

	protected store = injectStore();
	protected destroyRef = inject(DestroyRef);
	protected host = inject<ElementRef<HTMLElement>>(ElementRef);
	protected domElement = inject(NGT_HTML_DOM_ELEMENT, { self: true, optional: true });

	constructor() {
		if (this.domElement === 'gl') {
			Object.assign(this.host.nativeElement, {
				__ngt_dom_parent__: this.store.snapshot.gl.domElement.parentElement,
			});
		} else if (this.domElement) {
			Object.assign(this.host.nativeElement, { __ngt_dom_parent__: this.domElement });
		}

		this.destroyRef.onDestroy(() => {
			(this.host.nativeElement as NgtAnyRecord)['__ngt_dom_parent__'] = null;
			delete (this.host.nativeElement as NgtAnyRecord)['__ngt_dom_parent__'];
		});
	}
}
