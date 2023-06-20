import { Directive, EmbeddedViewRef, NgZone, TemplateRef, ViewContainerRef, inject } from '@angular/core';
import { SPECIAL_INTERNAL_ADD_COMMENT } from './renderer';
import { safeDetectChanges } from './utils';

@Directive()
export abstract class NgtCommonDirective {
	private vcr = inject(ViewContainerRef);
	private zone = inject(NgZone);
	private template = inject(TemplateRef);

	protected injected = false;
	protected shouldCreateView = true;
	private view?: EmbeddedViewRef<unknown>;

	constructor() {
		const commentNode = this.vcr.element.nativeElement;
		if (commentNode[SPECIAL_INTERNAL_ADD_COMMENT]) {
			commentNode[SPECIAL_INTERNAL_ADD_COMMENT]();
			delete commentNode[SPECIAL_INTERNAL_ADD_COMMENT];
		}
	}

	abstract validate(): boolean;

	protected createView() {
		if (this.shouldCreateView) {
			if (this.view && !this.view.destroyed) {
				this.view.destroy();
			}
			this.zone.runOutsideAngular(() => {
				this.view = this.vcr.createEmbeddedView(this.template);
				safeDetectChanges(this.view);
			});
		}
	}
}
