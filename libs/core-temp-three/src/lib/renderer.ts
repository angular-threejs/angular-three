import {
	Injectable,
	Renderer2,
	RendererFactory2,
	RendererType2,
	inject,
	makeEnvironmentProviders,
} from '@angular/core';
import { ɵDomRendererFactory2 as DomRendererFactory2 } from '@angular/platform-browser';

@Injectable()
class NgtRendererFactory implements RendererFactory2 {
	private domRendererFactory = inject(DomRendererFactory2);

	createRenderer(hostElement: any, type: RendererType2 | null): Renderer2 {
		const delegate = this.domRendererFactory.createRenderer(hostElement, type);
		return new NgtRenderer(delegate);
	}
}

class NgtRenderer implements Renderer2 {
	constructor(private delegate: Renderer2) {}
	get data(): { [key: string]: any } {
		return this.delegate.data;
	}
	createElement(name: string, namespace?: string | null | undefined) {
		console.log('createElement', name);
		return this.delegate.createElement(name, namespace);
	}
	appendChild(parent: any, newChild: any): void {
		console.log('appendChild', { parent, newChild });
		return this.delegate.appendChild(parent, newChild);
	}

	insertBefore(parent: any, newChild: any, refChild: any, isMove?: boolean | undefined): void {
		console.log('insertBefore', { parent, newChild, refChild });
		return this.delegate.insertBefore(parent, newChild, refChild);
	}

	destroy = this.delegate.destroy.bind(this.delegate);
	createComment = this.delegate.createComment.bind(this.delegate);
	createText = this.delegate.createText.bind(this.delegate);
	destroyNode = this.delegate.destroyNode;
	removeChild = this.delegate.removeChild.bind(this.delegate);
	selectRootElement = this.delegate.selectRootElement.bind(this.delegate);
	parentNode = this.delegate.parentNode.bind(this.delegate);
	nextSibling = this.delegate.nextSibling.bind(this.delegate);
	setAttribute = this.delegate.setAttribute.bind(this.delegate);
	removeAttribute = this.delegate.removeAttribute.bind(this.delegate);
	addClass = this.delegate.addClass.bind(this.delegate);
	removeClass = this.delegate.removeClass.bind(this.delegate);
	setStyle = this.delegate.setStyle.bind(this.delegate);
	removeStyle = this.delegate.removeStyle.bind(this.delegate);
	setProperty = this.delegate.setProperty.bind(this.delegate);
	setValue = this.delegate.setValue.bind(this.delegate);
	listen = this.delegate.listen.bind(this.delegate);
}

export function provideNgtRenderer() {
	return makeEnvironmentProviders([{ provide: RendererFactory2, useClass: NgtRendererFactory }]);
}
