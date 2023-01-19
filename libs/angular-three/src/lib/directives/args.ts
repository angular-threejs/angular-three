import { Directive, EmbeddedViewRef, inject, Input, TemplateRef, ViewContainerRef } from '@angular/core';

@Directive({ selector: '[args]', standalone: true })
export class NgtArgs {
    private readonly vcr = inject(ViewContainerRef);
    private readonly template = inject(TemplateRef);

    constructor() {
        const commentNode = this.vcr.element.nativeElement;
        if (commentNode['__ngt_renderer_add_comment__']) {
            commentNode['__ngt_renderer_add_comment__']();
            delete commentNode['__ngt_renderer_add_comment__'];
        }
    }

    private injectedArgs: any[] = [];
    private injected = false;
    private view?: EmbeddedViewRef<unknown>;

    @Input() set args(args: any[] | null) {
        if (args == null || !Array.isArray(args)) return;
        if (args.length === 1 && args[0] === null) return;
        this.injected = false;
        this.injectedArgs = args;
        this.createView();
    }

    get args() {
        if (this.validate()) {
            this.injected = true;
            return this.injectedArgs;
        }
        return null;
    }

    validate() {
        return !this.injected && !!this.injectedArgs.length;
    }

    private createView() {
        if (this.view && !this.view.destroyed) {
            this.view.destroy();
        }
        this.view = this.vcr.createEmbeddedView(this.template);
        this.view.detectChanges();
    }
}
