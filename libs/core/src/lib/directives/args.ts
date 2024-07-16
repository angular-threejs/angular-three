import {
	afterNextRender,
	DestroyRef,
	Directive,
	EmbeddedViewRef,
	inject,
	input,
	NgZone,
	TemplateRef,
	untracked,
	ViewContainerRef,
} from '@angular/core';
import { injectAutoEffect } from 'ngxtension/auto-effect';
import { SPECIAL_INTERNAL_ADD_COMMENT } from '../renderer/constants';

@Directive({ selector: 'ng-template[args]', standalone: true })
export class NgtArgs {
	args = input.required<any[] | null>();

	private vcr = inject(ViewContainerRef);
	private zone = inject(NgZone);
	private template = inject(TemplateRef);
	private autoEffect = injectAutoEffect();

	protected injected = false;
	protected injectedArgs: any[] | null = null;
	private view?: EmbeddedViewRef<unknown>;

	constructor() {
		const commentNode = this.vcr.element.nativeElement;
		if (commentNode[SPECIAL_INTERNAL_ADD_COMMENT]) {
			commentNode[SPECIAL_INTERNAL_ADD_COMMENT]('args');
			delete commentNode[SPECIAL_INTERNAL_ADD_COMMENT];
		}

		afterNextRender(() => {
			this.autoEffect(() => {
				const value = this.args();
				if (value == null || !Array.isArray(value) || (value.length === 1 && value[0] === null)) return;
				this.injected = false;
				this.injectedArgs = value;
				untracked(() => {
					this.createView();
				});
			});
		});

		inject(DestroyRef).onDestroy(() => {
			this.view?.destroy();
		});
	}

	get value() {
		if (this.validate()) {
			this.injected = true;
			return this.injectedArgs;
		}
		return null;
	}

	validate() {
		return !this.injected && !!this.injectedArgs?.length;
	}

	private createView() {
		this.zone.runOutsideAngular(() => {
			if (this.view && !this.view.destroyed) {
				this.view.destroy();
			}
			this.view = this.vcr.createEmbeddedView(this.template);
			this.view.detectChanges();
		});
	}
}
