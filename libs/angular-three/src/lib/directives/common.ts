import { Directive, EmbeddedViewRef, inject, TemplateRef, ViewContainerRef } from '@angular/core';

@Directive()
export abstract class NgtCommonDirective {
    protected readonly vcr = inject(ViewContainerRef);
    protected readonly template = inject(TemplateRef);

    protected injected = false;
    protected shouldCreateView = true;
    private view?: EmbeddedViewRef<unknown>;

    constructor() {
        const commentNode = this.vcr.element.nativeElement;
        if (commentNode['__ngt_renderer_add_comment__']) {
            commentNode['__ngt_renderer_add_comment__']();
            delete commentNode['__ngt_renderer_add_comment__'];
        }
    }

    abstract validate(): boolean;

    protected createView() {
        if (this.shouldCreateView) {
            if (this.view && !this.view.destroyed) {
                this.view.destroy();
            }
            this.view = this.vcr.createEmbeddedView(this.template);
            this.view.detectChanges();
        }
    }
}
