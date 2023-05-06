import { Directive, EmbeddedViewRef, inject, NgZone, TemplateRef, ViewContainerRef } from '@angular/core';
import { SPECIAL_INTERNAL_ADD_COMMENT } from '../renderer/utils';

@Directive()
export abstract class NgtCommonDirective {
    readonly #vcr = inject(ViewContainerRef);
    readonly #zone = inject(NgZone);
    readonly #template = inject(TemplateRef);

    protected injected = false;
    protected shouldCreateView = true;
    #view?: EmbeddedViewRef<unknown>;

    constructor() {
        const commentNode = this.#vcr.element.nativeElement;
        if (commentNode[SPECIAL_INTERNAL_ADD_COMMENT]) {
            commentNode[SPECIAL_INTERNAL_ADD_COMMENT]();
            delete commentNode[SPECIAL_INTERNAL_ADD_COMMENT];
        }
    }

    abstract validate(): boolean;

    protected createView() {
        if (this.shouldCreateView) {
            if (this.#view && !this.#view.destroyed) {
                this.#view.destroy();
            }
            this.#zone.runOutsideAngular(() => {
                this.#view = this.#vcr.createEmbeddedView(this.#template);
                this.#view.detectChanges();
            });
        }
    }
}
