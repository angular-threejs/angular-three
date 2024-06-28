import {
	DestroyRef,
	Directive,
	EmbeddedViewRef,
	TemplateRef,
	ViewContainerRef,
	afterNextRender,
	inject,
	input,
	untracked,
} from '@angular/core';
import { injectAutoEffect } from 'ngxtension/auto-effect';

@Directive({ selector: 'ng-template[args]', standalone: true })
export class NgtArgs {
	args = input.required<any[] | null>();

	private autoEffect = injectAutoEffect();
	private vcr = inject(ViewContainerRef);
	private template = inject(TemplateRef);

	private injected = false;
	private injectedValue: any[] | null = null;

	private view?: EmbeddedViewRef<unknown>;

	constructor() {
		const commentNode = this.vcr.element.nativeElement;
		if (commentNode['__ngt_renderer_tracking_comment__']) {
			commentNode['__ngt_renderer_tracking_comment__']();
			delete commentNode['__ngt_renderer_tracking_comment__'];
		}

		afterNextRender(() => {
			this.autoEffect(() => {
				const value = this.args();
				if (value == null || !Array.isArray(value) || (value.length === 1 && value[0] === null)) return;
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

	validate() {
		return !this.injected && !!this.injectedValue?.length;
	}

	get value() {
		if (this.validate()) {
			this.injected = true;
			return this.injectedValue;
		}
		return null;
	}

	private createView() {
		if (this.view && !this.view.destroyed) {
			this.view.destroy();
		}
		this.view = this.vcr.createEmbeddedView(this.template);
		this.view.detectChanges();
	}
}
