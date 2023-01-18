import { inject, Injectable, Renderer2, RendererFactory2, RendererStyleFlags2, RendererType2 } from '@angular/core';
import { ɵDomRendererFactory2 as DomRendererFactory2 } from '@angular/platform-browser';

@Injectable()
export class NgtRendererFactory implements RendererFactory2 {
    private readonly domRendererFactory = inject(DomRendererFactory2);

    createRenderer(hostElement: any, type: RendererType2 | null): Renderer2 {
        const domRenderer = this.domRendererFactory.createRenderer(hostElement, type);
        const renderer = new NgtRenderer(domRenderer);
        return renderer;
    }
}

export class NgtRenderer implements Renderer2 {
    constructor(private domRenderer: Renderer2) {}

    createElement(name: string, namespace?: string | null | undefined) {
        throw new Error('Method not implemented.');
    }

    createComment(value: string) {
        throw new Error('Method not implemented.');
    }

    appendChild(parent: any, newChild: any): void {
        throw new Error('Method not implemented.');
    }

    insertBefore(parent: any, newChild: any, refChild: any, isMove?: boolean | undefined): void {
        throw new Error('Method not implemented.');
    }

    removeChild(parent: any, oldChild: any, isHostElement?: boolean | undefined): void {
        throw new Error('Method not implemented.');
    }

    parentNode(node: any) {
        throw new Error('Method not implemented.');
    }

    setAttribute(el: any, name: string, value: string, namespace?: string | null | undefined): void {
        throw new Error('Method not implemented.');
    }

    setProperty(el: any, name: string, value: any): void {
        throw new Error('Method not implemented.');
    }

    listen(target: any, eventName: string, callback: (event: any) => boolean | void): () => void {
        throw new Error('Method not implemented.');
    }

    get data(): { [key: string]: any } {
        return this.domRenderer.data;
    }
    createText = this.domRenderer.createText.bind(this.domRenderer);
    destroy = this.domRenderer.destroy.bind(this.domRenderer);
    destroyNode: ((node: any) => void) | null = null;
    selectRootElement = this.domRenderer.selectRootElement.bind(this.domRenderer);
    nextSibling = this.domRenderer.nextSibling.bind(this.domRenderer);
    removeAttribute = this.domRenderer.removeAttribute.bind(this.domRenderer);
    addClass = this.domRenderer.addClass.bind(this.domRenderer);
    removeClass = this.domRenderer.removeClass.bind(this.domRenderer);
    setStyle = this.domRenderer.setStyle.bind(this.domRenderer);
    removeStyle = this.domRenderer.removeStyle.bind(this.domRenderer);
    setValue = this.domRenderer.setValue.bind(this.domRenderer);
}
