import {
	DestroyRef,
	Directive,
	effect,
	EmbeddedViewRef,
	inject,
	input,
	TemplateRef,
	ViewContainerRef,
} from '@angular/core';
import { SPECIAL_INTERNAL_ADD_COMMENT } from '../renderer/constants';
import { is } from '../utils/is';

@Directive({ selector: 'ng-template[args]' })
export class NgtArgs {
	args = input.required<any[] | null>();

	private vcr = inject(ViewContainerRef);
	private template = inject(TemplateRef);

	protected injected = false;
	protected injectedArgs: any[] | null = null;
	private view?: EmbeddedViewRef<unknown>;

	constructor() {
		const commentNode = this.vcr.element.nativeElement;
		if (commentNode[SPECIAL_INTERNAL_ADD_COMMENT]) {
			commentNode[SPECIAL_INTERNAL_ADD_COMMENT]('args');
			delete commentNode[SPECIAL_INTERNAL_ADD_COMMENT];
		}

		effect(() => {
			const value = this.args();
			if (value == null || !Array.isArray(value) || (value.length === 1 && value[0] === null)) return;

			if (is.equ(value, this.injectedArgs)) {
				// we have the same value as before, no need to update
				return;
			}

			this.injected = false;
			this.injectedArgs = value;
			this.createView();
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
		if (this.view && !this.view.destroyed) this.view.destroy();
		this.view = this.vcr.createEmbeddedView(this.template);
		this.view.detectChanges();
	}
}
