import {
	DestroyRef,
	Directive,
	NgZone,
	TemplateRef,
	ViewContainerRef,
	inject,
	type EmbeddedViewRef,
} from '@angular/core';
import { SPECIAL_INTERNAL_ADD_COMMENT } from '../renderer/constants';

@Directive()
export abstract class NgtCommonDirective {
	protected static nodeType: 'args' | 'parent' | '' = '';

	private vcr = inject(ViewContainerRef);
	private zone = inject(NgZone);
	private template = inject(TemplateRef);

	protected injected = false;
	protected shouldCreateView = true;
	private view?: EmbeddedViewRef<unknown>;

	constructor() {
		const commentNode = this.vcr.element.nativeElement;
		if (commentNode[SPECIAL_INTERNAL_ADD_COMMENT]) {
			commentNode[SPECIAL_INTERNAL_ADD_COMMENT](NgtCommonDirective.nodeType);
			delete commentNode[SPECIAL_INTERNAL_ADD_COMMENT];
		}

		inject(DestroyRef).onDestroy(() => {
			this.view?.destroy();
		});
	}

	abstract validate(): boolean;

	protected createView() {
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
