import {
	DestroyRef,
	Directive,
	EmbeddedViewRef,
	NgZone,
	TemplateRef,
	ViewContainerRef,
	afterNextRender,
	inject,
	untracked,
} from '@angular/core';
import { injectAutoEffect } from 'ngxtension/auto-effect';
import { createInjectionToken } from 'ngxtension/create-injection-token';
import { SPECIAL_INTERNAL_ADD_COMMENT } from '../renderer/constants';

export const [injectNodeType, provideNodeType] = createInjectionToken(() => '' as 'args' | 'parent' | '', {
	isRoot: false,
});

@Directive()
export abstract class NgtCommonDirective<TValue> {
	private vcr = inject(ViewContainerRef);
	private zone = inject(NgZone);
	private template = inject(TemplateRef);
	private nodeType = injectNodeType();
	private autoEffect = injectAutoEffect();

	protected injected = false;
	protected injectedValue: TValue | null = null;
	protected shouldCreateView = true;
	private view?: EmbeddedViewRef<unknown>;

	constructor() {
		const commentNode = this.vcr.element.nativeElement;
		if (commentNode[SPECIAL_INTERNAL_ADD_COMMENT]) {
			commentNode[SPECIAL_INTERNAL_ADD_COMMENT](this.nodeType);
			delete commentNode[SPECIAL_INTERNAL_ADD_COMMENT];
		}

		afterNextRender(() => {
			this.autoEffect(() => {
				const value = this.inputValue();
				if (this.shouldSkipCreateView(value)) return;
				this.injected = false;
				this.injectedValue = value;
				untracked(() => {
					this.createView();
				});
			});
		});

		inject(DestroyRef).onDestroy(() => {
			this.view?.destroy();
		});
	}

	protected abstract inputValue(): TValue | null;
	abstract validate(): boolean;

	protected shouldSkipCreateView(value: TValue | null) {
		return !value;
	}

	get value() {
		if (this.validate()) {
			this.injected = true;
			return this.injectedValue;
		}
		return null;
	}

	private createView() {
		this.zone.runOutsideAngular(() => {
			if (this.shouldCreateView) {
				if (this.view && !this.view.destroyed) {
					this.view.destroy();
				}
				this.view = this.vcr.createEmbeddedView(this.template);
				this.view.detectChanges();
			}
		});
	}
}
