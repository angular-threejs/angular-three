import { Injectable, Renderer2, RendererFactory2, RendererType2, inject } from '@angular/core';
import { prepare } from '../instance';
import { NgtState, injectStore } from '../store';
import { NgtAnyRecord } from '../types';
import { is } from '../utils/is';
import { NgtSignalStore } from '../utils/signal-store';
import { NgtAnyConstructor, injectCatalogue } from './catalogue';

@Injectable()
export class NgtRendererFactory implements RendererFactory2 {
	private delegateRendererFactory = inject(RendererFactory2, { skipSelf: true });
	private catalogue = injectCatalogue();
	private rootStore = injectStore();

	private renderers = new Map<string, Renderer2>();

	createRenderer(hostElement: any, type: RendererType2 | null): Renderer2 {
		const delegateRenderer = this.delegateRendererFactory.createRenderer(hostElement, type);
		if (!type) return delegateRenderer;

		let renderer = this.renderers.get(type.id);
		if (!renderer) {
			this.renderers.set(
				type.id,
				(renderer = new NgtRenderer(delegateRenderer, this.rootStore, this.catalogue, !hostElement)),
			);
		}
		return renderer;
	}
}

export class NgtRenderer implements Renderer2 {
	constructor(
		private delegateRenderer: Renderer2,
		private rootStore: NgtSignalStore<NgtState>,
		private catalogue: Record<string, NgtAnyConstructor>,
		private isRoot = false,
	) {}

	get data(): { [key: string]: any } {
		return { ...this.delegateRenderer.data, __type: 'ngt' };
	}

	createElement(name: string, namespace?: string | null | undefined) {
		if (this.isRoot) {
			this.isRoot = false;
			const scene = this.rootStore.snapshot.scene;
			Object.assign(scene, { __ngt_renderer__: { type: 'three', name: 'Scene' } });
			return scene;
		}

		if (name.startsWith('ngt-')) {
			const threeName = kebabToPascal(name.slice(4));
			const threeClass = this.catalogue[threeName];

			if (threeClass) {
				const three = prepare(new threeClass(), { store: this.rootStore });
				Object.assign(three, { __ngt_renderer__: { type: 'three', name } });
				return three;
			}
		}

		const commentForElement: Comment = this.delegateRenderer.createComment(`comment-${name}`);
		Object.assign(commentForElement, {
			data: name,
			__ngt_renderer__: { type: 'commentForElement' },
		});
		return commentForElement;
	}

	createComment(value: string) {
		throw new Error('Method not implemented.');
	}

	appendChild(parent: any, newChild: any): void {
		if (is.object3D(parent)) {
			if (is.object3D(newChild)) {
				parent.add(newChild);
				return;
			}

			if (is.geometry(newChild)) {
				Object.assign(parent, { geometry: newChild });
				return;
			}

			if (is.material(newChild)) {
				Object.assign(parent, { material: newChild });
				return;
			}

			if (newChild instanceof Comment && '__ngt_renderer__' in newChild) {
				const commentRendererData = newChild.__ngt_renderer__ as NgtAnyRecord;
				Object.assign(commentRendererData, { parentNode: parent });
				return;
			}

			return;
		}

		if (parent instanceof Comment && '__ngt_renderer__' in parent) {
			const commentRendererData = parent.__ngt_renderer__ as NgtAnyRecord;
			if (commentRendererData['parentNode']) {
				return this.appendChild(commentRendererData['parentNode'], newChild);
			}
		}

		return this.delegateRenderer.appendChild(parent, newChild);
	}

	insertBefore(parent: any, newChild: any, refChild: any, isMove?: boolean | undefined): void {
		if (parent instanceof HTMLDivElement && parent.offsetParent && parent.offsetParent.localName === 'ngt-canvas') {
			return this.delegateRenderer.appendChild(parent, refChild);
		}
		throw new Error('Method not implemented.');
	}

	removeChild(parent: any, oldChild: any, isHostElement?: boolean | undefined): void {
		throw new Error('Method not implemented.');
	}

	parentNode(node: any) {
		return this.delegateRenderer.parentNode(node);
	}

	selectRootElement(selectorOrNode: any, preserveContent?: boolean | undefined) {
		throw new Error('Method not implemented.');
	}

	setAttribute(el: any, name: string, value: string, namespace?: string | null | undefined): void {
		console.log('setAttribute', { el, name, value, namespace });
		return;
	}

	removeAttribute(el: any, name: string, namespace?: string | null | undefined): void {
		throw new Error('Method not implemented.');
	}

	setProperty(el: any, name: string, value: any): void {
		throw new Error('Method not implemented.');
	}

	listen(target: any, eventName: string, callback: (event: any) => boolean | void): () => void {
		throw new Error('Method not implemented.');
	}

	destroyNode: ((node: any) => void) | null = (node) => {
		throw new Error('Method not implemented.');
	};

	destroy(): void {
		throw new Error('Method not implemented.');
	}

	createText = this.delegateRenderer.createText.bind(this.delegateRenderer);

	// TODO: we might need to implement this for [ngComponentOutlet] support?
	nextSibling(node: any) {
		throw new Error('Method not implemented.');
	}

	addClass = this.delegateRenderer.addClass.bind(this.delegateRenderer);
	removeClass = this.delegateRenderer.removeClass.bind(this.delegateRenderer);
	setStyle = this.delegateRenderer.setStyle.bind(this.delegateRenderer);
	removeStyle = this.delegateRenderer.removeStyle.bind(this.delegateRenderer);
	setValue = this.delegateRenderer.setValue.bind(this.delegateRenderer);
}

export function kebabToPascal(str: string): string {
	// split the string at each hyphen
	const parts = str.split('-');

	// map over the parts, capitalizing the first letter of each part
	const pascalParts = parts.map((part) => part.charAt(0).toUpperCase() + part.slice(1));

	// join the parts together to create the final PascalCase string
	return pascalParts.join('');
}
