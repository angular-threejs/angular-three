// import { DOCUMENT } from '@angular/common';
// import { Injectable, Renderer2, RendererFactory2, RendererType2, getDebugNode, inject, untracked } from '@angular/core';
// import { Object3D } from 'three';
// import { NgtArgs } from '../args';
// import { removeInteractivity } from '../events';
// import { NgtInstanceNode, getLocalState, getRootStore, invalidateInstance, prepare } from '../instance';
// import { NGT_STORE, NgtState, injectStore } from '../store';
// import { NgtAnyRecord } from '../types';
// import { applyProps } from '../utils/apply-props';
// import { attach, detach } from '../utils/attach';
// import { is } from '../utils/is';
// import { NgtSignalStore } from '../utils/signal-store';
// import { NgtAnyConstructor, injectCatalogue } from './catalogue';

import { DOCUMENT } from '@angular/common';
import { inject, Injectable, Renderer2, RendererFactory2, RendererType2, untracked } from '@angular/core';
import { getLocalState, prepare } from '../instance';
import { injectStore, NgtState } from '../store';
import { is } from '../utils/is';
import { NgtSignalStore } from '../utils/signal-store';
import { injectCatalogue, NgtAnyConstructor } from './catalogue';
import { ELEMENTS, NGT_RENDERER_TRACKING_COMMENT } from './constants';
import {
	createRendererNode,
	getPortalContainer,
	getRendererNode,
	isCommentNode,
	isInstanceNode,
	isPortalNode,
	isRendererNode,
	NgtCommentRendererNode,
	NgtRendererNode,
	setParentNode,
	trackChildNode,
} from './state';

function kebabToPascal(str: string): string {
	// split the string at each hyphen
	const parts = str.split('-');

	// map over the parts, capitalizing the first letter of each part
	const pascalParts = parts.map((part) => part.charAt(0).toUpperCase() + part.slice(1));

	// join the parts together to create the final PascalCase string
	return pascalParts.join('');
}

@Injectable()
export class NgtRendererFactory implements RendererFactory2 {
	private delegateRendererFactory = inject(RendererFactory2, { skipSelf: true });
	private catalogue = injectCatalogue();
	private rootStore = injectStore();
	private document = inject(DOCUMENT);

	private renderers = new Map<string, Renderer2>();

	createRenderer(hostElement: any, type: RendererType2 | null): Renderer2 {
		const delegateRenderer = this.delegateRendererFactory.createRenderer(hostElement, type);
		if (!type) return delegateRenderer;

		let renderer = this.renderers.get(type.id);

		if (!renderer) {
			this.renderers.set(
				type.id,
				(renderer = new NgtRenderer(delegateRenderer, this.catalogue, this.rootStore, this.document, hostElement)),
			);
		}

		return renderer;
	}
}

export class NgtRenderer implements Renderer2 {
	private argsComments: NgtCommentRendererNode[] = [];

	constructor(
		private delegateRenderer: Renderer2,
		private catalogue: Record<string, NgtAnyConstructor>,
		private rootStore: NgtSignalStore<NgtState>,
		private document: Document,
		private hostElement?: any,
	) {}

	createElement(name: string, namespace?: string | null) {
		// The first time the Renderer runs, there's no hostElement because of `createComponent`
		// call in `NgtCanvas`. When we don't have it, we'll return the root Scene instead
		if (!this.hostElement) {
			const rootScene = this.rootStore.snapshot.scene;
			this.hostElement = createRendererNode(rootScene, { type: 'three', name: 'Scene' });
			return rootScene;
		}

		// portal: <ngt-portal />
		if (name === ELEMENTS.portal) {
			const commentForPortal = this.delegateRenderer.createComment(`comment-${name}`);
			return createRendererNode(commentForPortal, { type: 'portal', name });
		}

		// Raw value: <ngt-value />
		if (name === ELEMENTS.value) {
			// we'll create a comment node
			const commentForValue = this.delegateRenderer.createComment(`comment-ngt-value`);
			// then we'll treat it as an NgtInstanceNode with _ngt_ (i.e: prepare)
			const preparedComment = prepare(commentForValue, { isRaw: true });
			// then we'll create a renderer instance node
			return createRendererNode(preparedComment, { type: 'three', name: 'RawValue' });
		}

		// the *args
		const injectedArgs = {} as any;

		// Primitive: <ngt-primitive />
		if (name === ELEMENTS.primitive) {
			const args = injectedArgs?.value || [];
			if (!args[0]) throw new Error(`[NGT] Primitive element requires a args. Use control-flow if needed`);

			const primitive = args[0];

			if (!is.instance(primitive)) {
				prepare(primitive, { isPrimitive: true });
			}

			return createRendererNode(primitive, { type: 'three', name: 'Primitive' });
		}

		if (name.startsWith('ngt-')) {
			const threeName = kebabToPascal(name.slice(4));
			const threeClass = this.catalogue[threeName];

			if (threeClass) {
				const args = injectedArgs?.value || [];
				const three = prepare(new threeClass(...args));
				const localState = getLocalState(three);

				if (localState) {
					if (is.geometry(three)) {
						localState.attach = ['geometry'];
					} else if (is.material(three)) {
						localState.attach = ['material'];
					}
				}

				return createRendererNode(three, { type: 'three', name });
			}
		}

		return createRendererNode(this.delegateRenderer.createComment(`comment-${name}`), {
			type: 'commentForElement',
			name,
		});
	}

	appendChild(parent: NgtRendererNode, newChild: NgtRendererNode): void {
		// Skip early if parent and child are the same instance
		if (parent === newChild) return;

		const parentNode = getRendererNode(parent);
		const childNode = getRendererNode(newChild);

		// NgtRenderer should only handle NgtRendererNode
		if (!parentNode || !childNode) {
			console.log('debugging...', { parent, newChild });
			return;
		}

		if (isCommentNode(childNode, 'comment')) {
			setParentNode(childNode, parentNode);
			return;
		}

		if (isCommentNode(parentNode, 'commentForElement') && isCommentNode(childNode, 'commentForElement')) {
			trackChildNode(parentNode, childNode);
			setParentNode(childNode, parentNode);
			return;
		}

		setParentNode(childNode, parentNode);
		trackChildNode(parentNode, childNode);

		if (isInstanceNode(parentNode)) {
			if (isInstanceNode(childNode)) {
				const childLocalState = getLocalState(childNode);
				// Skip if child already attached to a parent
				if (childLocalState?.parent && untracked(childLocalState.parent)) return;
				// attachThreeChild(parentNode, childNode);
				return;
			}

			const childNodesOfChild = childNode.__ngt_renderer__.childNodes || [];
			for (const childNodeOfChild of childNodesOfChild) {
				this.appendChild(parentNode, childNodeOfChild);
			}
			return;
		}

		if (isPortalNode(parentNode)) {
			if (!parentNode.__ngt_renderer__.container) {
				const portalContainer = getPortalContainer(parentNode);
				if (portalContainer) {
					parentNode.__ngt_renderer__.container = portalContainer;
				}
			}

			if (parentNode.__ngt_renderer__.container) {
				this.appendChild(parentNode.__ngt_renderer__.container, childNode);
			}
		}
	}

	parentNode(node: unknown) {
		if (isRendererNode(node)) {
			if (!node.__ngt_renderer__ || node.__ngt_renderer__.destroyed) return null;
			return node.__ngt_renderer__.parentNode || null;
		}

		return this.delegateRenderer.parentNode(node);
	}

	insertBefore(parent: any, newChild: any, refChild: any, isMove?: boolean | undefined): void {
		if (parent instanceof HTMLDivElement && parent.offsetParent && parent.offsetParent.localName === 'ngt-canvas') {
			return this.delegateRenderer.appendChild(parent, refChild);
		}

		if (isRendererNode(parent) && isRendererNode(newChild) && isRendererNode(refChild)) {
			return this.appendChild(parent, newChild);
		}

		return this.delegateRenderer.insertBefore(parent, newChild, refChild, isMove);
	}

	listen(
		target: 'window' | 'document' | 'body' | any,
		eventName: string,
		callback: (event: any) => boolean | void,
	): () => void {}

	setProperty(el: any, name: string, value: any): void {}

	setAttribute(el: any, name: string, value: string, namespace?: string | null): void {}

	createComment(value: string) {
		const comment = this.delegateRenderer.createComment(`comment-${value}`);
		const commentRendererNode = createRendererNode(comment, { type: 'comment', name: value });

		// we attach a callback so we can specifically call these in the directives
		Object.assign(commentRendererNode, {
			[NGT_RENDERER_TRACKING_COMMENT]: () => {
				this.argsComments.push(commentRendererNode);
			},
		});

		return commentRendererNode;
	}

	removeChild(parent: any, oldChild: any, isHostElement?: boolean): void {}

	removeAttribute(el: any, name: string, namespace?: string | null): void {}

	nextSibling(node: any) {}

	destroyNode: ((node: any) => void) | null = null;

	createText = this.delegateRenderer.createText.bind(this.delegateRenderer);
	destroy(): void {}
	selectRootElement = this.delegateRenderer.selectRootElement.bind(this.delegateRenderer);
	addClass = this.delegateRenderer.addClass.bind(this.delegateRenderer);
	removeClass = this.delegateRenderer.removeClass.bind(this.delegateRenderer);
	setStyle = this.delegateRenderer.setStyle.bind(this.delegateRenderer);
	removeStyle = this.delegateRenderer.removeStyle.bind(this.delegateRenderer);
	setValue = this.delegateRenderer.setValue.bind(this.delegateRenderer);

	get data(): { [key: string]: any } {
		return this.delegateRenderer.data;
	}
}

// interface NgtRendererState {
// 	name: string;
// 	destroyed?: boolean;
// 	parentNode?: NgtRendererNode;
// 	childNodes?: NgtRendererNode[];
// 	trackedBy?: NgtRendererNode;
// }
//
// type NgtInstanceRendererNode = NgtInstanceNode<NgtAnyRecord> & {
// 	__ngt_renderer__: NgtRendererState & { type: 'three' };
// };
// type NgtCommentRendererNode = Comment & {
// 	__ngt_renderer__: NgtRendererState & { type: 'comment' | 'commentForElement'; attributes?: NgtAnyRecord };
// };
// type NgtPortalRendererNode = Comment & {
// 	__ngt_renderer__: NgtRendererState & {
// 		type: 'portal';
// 		attributes?: NgtAnyRecord;
// 		container?: NgtInstanceRendererNode;
// 	};
// };
// type NgtRendererNode = NgtInstanceRendererNode | NgtCommentRendererNode | NgtPortalRendererNode;
//
// function createRendererNode(
// 	node: NgtInstanceNode | Comment,
// 	data: NgtRendererState & { type: 'comment' | 'commentForElement' | 'three' | 'portal' },
// ): NgtRendererNode {
// 	if ('__ngt_renderer__' in node) {
// 		Object.assign(node.__ngt_renderer__, data);
// 		return node;
// 	}
//
// 	return Object.assign(node, { __ngt_renderer__: data });
// }
//
// function isRendererNode(node: unknown): node is NgtRendererNode {
// 	return !!node && typeof node === 'object' && '__ngt_renderer__' in node && !!node.__ngt_renderer__;
// }
//
// function getRendererNode(node: unknown): NgtRendererNode | null {
// 	return isRendererNode(node) ? node : null;
// }
//
// function isInstanceNode(node: NgtRendererNode): node is NgtInstanceRendererNode {
// 	return isRendererNode(node) && node.__ngt_renderer__.type === 'three';
// }
//
// function isCommentNode(node: NgtRendererNode): node is NgtCommentRendererNode {
// 	return (
// 		(isRendererNode(node) && node.__ngt_renderer__.type === 'comment') ||
// 		node.__ngt_renderer__.type === 'commentForElement'
// 	);
// }
//
// function isPortalNode(node: NgtRendererNode): node is NgtPortalRendererNode {
// 	return isRendererNode(node) && node.__ngt_renderer__.type === 'portal';
// }
//
// function attachThreeChild(parent: NgtInstanceRendererNode, child: NgtInstanceRendererNode) {
// 	const parentLocalState = getLocalState(parent);
// 	const childLocalState = getLocalState(child);
//
// 	if (!parentLocalState || !childLocalState) {
// 		throw new Error(`[NGT] THREE instances need to be prepared with local state.`);
// 	}
//
// 	// whether the child is added to the parent with parent.add()
// 	let added = false;
//
// 	if (!childLocalState.store) {
// 		childLocalState.store = parentLocalState.store;
//
// 		// also check the children of child to assign the same store
// 		if (childLocalState.objects && childLocalState.nonObjects) {
// 			const grandChildren = [...untracked(childLocalState.objects), ...untracked(childLocalState.nonObjects)];
// 			for (let i = 0; i < grandChildren.length; i++) {
// 				const grandChild = grandChildren[i];
// 				const grandChildLocalState = getLocalState(grandChild);
// 				if (
// 					grandChildLocalState &&
// 					(!grandChildLocalState.store || grandChildLocalState.store !== childLocalState.store)
// 				) {
// 					grandChildLocalState.store = childLocalState.store;
// 				}
// 			}
// 		}
// 	}
//
// 	if (childLocalState.attach) {
// 		const attachValue = childLocalState.attach;
//
// 		// NOTE: this is when [attach] accepts a NgtAttachFunction
// 		if (typeof attachValue === 'function') {
// 			const cleanup = attachValue(parent, child, childLocalState.store);
// 			if (cleanup) childLocalState.previousAttach = cleanup;
// 		}
// 		// regular old attach array
// 		else {
// 			// we skip attach none if set explicitly
// 			if (attachValue[0] === 'none') {
// 				invalidateInstance(child);
// 				return;
// 			}
//
// 			// handle material array
// 			if (
// 				attachValue[0] === 'material' &&
// 				attachValue[1] &&
// 				typeof Number(attachValue[1]) === 'number' &&
// 				is.material(child) &&
// 				!Array.isArray(parent['material'])
// 			) {
// 				parent['material'] = [];
// 			}
//
// 			// attach
// 			if (childLocalState.isRaw) {
// 				if (untracked(childLocalState.parent) !== parent) {
// 					childLocalState.setParent(parent);
// 				}
//
// 				// at this point we don't have rawValue yet, so we bail and wait until the Renderer recalls attach
// 				if (childLocalState.rawValue === undefined) return;
// 				attach(parent, childLocalState.rawValue, attachValue);
// 			} else {
// 				attach(parent, child, attachValue);
// 			}
// 			// save value
// 			childLocalState.previousAttach = attachValue.reduce((value, property) => value[property], parent);
// 		}
// 	} else if (is.object3D(parent) && is.object3D(child)) {
// 		parent.add(child);
// 		added = true;
// 	}
//
// 	parentLocalState.add(child, added ? 'objects' : 'nonObjects');
//
// 	// for local state
// 	if (childLocalState.parent && untracked(childLocalState.parent) !== parent) {
// 		childLocalState.setParent(parent);
// 	}
//
// 	// for renderer
// 	if (child.__ngt_renderer__.parentNode !== parent) {
// 		child.__ngt_renderer__.parentNode = parent;
// 	}
//
// 	if (childLocalState.onAttach) {
// 		childLocalState.onAttach({ parent, instance: child });
// 	}
//
// 	invalidateInstance(child);
// 	invalidateInstance(parent);
// }
//
// function detachThreeChild(parent: NgtInstanceRendererNode, child: NgtInstanceRendererNode) {
// 	const parentLocalState = getLocalState(parent);
// 	const childLocalState = getLocalState(child);
//
// 	// clear parent
// 	childLocalState?.setParent?.(null);
//
// 	// remove child
// 	parentLocalState?.remove?.(child, 'objects');
// 	parentLocalState?.remove?.(child, 'nonObjects');
//
// 	if (childLocalState?.attach) {
// 		detach(parent, child, childLocalState.attach);
// 	} else if (is.object3D(parent) && is.object3D(child) && child.parent === parent) {
// 		parent.remove(child);
// 		const store = childLocalState?.store;
// 		if (store) removeInteractivity(store, child);
// 	}
//
// 	if (!childLocalState?.isPrimitive) {
// 		if (is.object3D(child)) {
// 			detachThreeChildRecursive(child.children as unknown as NgtInstanceRendererNode[], parent);
// 		}
//
// 		if (childLocalState) {
// 			detachThreeChildRecursive(untracked(childLocalState.objects) as unknown as NgtInstanceRendererNode[], parent);
// 		}
// 	}
//
// 	// dispose
// 	if (!childLocalState?.isPrimitive && child['dispose'] && !is.scene(child)) {
// 		queueMicrotask(() => child['dispose']());
// 	}
//
// 	// destroy localState
// 	childLocalState?.destroy?.();
//
// 	invalidateInstance(parent);
// }
//
// function detachThreeChildRecursive(array: NgtInstanceRendererNode[], parent: NgtInstanceRendererNode) {
// 	if (array.length) [...array].forEach((child) => detachThreeChild(parent, child));
// }
//
// function processThreeEvent(
// 	target: NgtInstanceRendererNode,
// 	eventName: string,
// 	callback: (event: any) => void,
// ): () => void {
// 	const localState = getLocalState(target);
// 	if (!localState) {
// 		console.warn(`[NGT] Instance is not prepared with local state.`);
// 		return () => {};
// 	}
//
// 	if (eventName === EVENTS.attached) {
// 		localState.onAttach = callback;
//
// 		// if there's already parent, we'll call the callback first time here
// 		const parent = untracked(localState.parent);
// 		if (parent) callback({ parent, instance: target });
//
// 		return () => {
// 			localState.onAttach = undefined;
// 		};
// 	}
//
// 	if (eventName === EVENTS.updated) {
// 		localState.onUpdate = callback;
// 		return () => {
// 			localState.onUpdate = undefined;
// 		};
// 	}
//
// 	if (!localState.handlers) localState.handlers = {};
//
// 	Object.assign(localState.handlers, { [eventName]: callback });
//
// 	// increment the count everytime
// 	localState.eventCount += 1;
//
// 	// but only add the instance (target) to the interaction array (so that it is handled by the EventManager with Raycast)
// 	// the first time eventCount is incremented
// 	if (localState.eventCount === 1 && target['raycast']) {
// 		const rootStore = getRootStore(target);
// 		const interactions = rootStore?.get('internal', 'interaction') || [];
// 		interactions.push(target as unknown as Object3D);
// 	}
//
// 	// clean up the event listener by removing the target from the interaction array
// 	return () => {
// 		const localState = getLocalState(target);
// 		if (localState) {
// 			localState.eventCount -= 1;
// 			const rootStore = getRootStore(target);
// 			const interactions = rootStore?.snapshot.internal?.interaction || [];
// 			const index = interactions.findIndex((obj) => obj.uuid === target['uuid']);
// 			if (index >= 0) interactions.splice(index, 1);
// 		}
// 	};
// }
//
// @Injectable()
// export class NgtRendererFactory implements RendererFactory2 {
// 	private delegateRendererFactory = inject(RendererFactory2, { skipSelf: true });
// 	private document = inject(DOCUMENT);
// 	private catalogue = injectCatalogue();
// 	private rootStore = injectStore();
//
// 	private renderers = new Map<string, Renderer2>();
//
// 	createRenderer(hostElement: any, type: RendererType2 | null): Renderer2 {
// 		const delegateRenderer = this.delegateRendererFactory.createRenderer(hostElement, type);
// 		if (!type) return delegateRenderer;
//
// 		let renderer = this.renderers.get(type.id);
// 		if (!renderer) {
// 			this.renderers.set(
// 				type.id,
// 				(renderer = new NgtRenderer(delegateRenderer, this.rootStore, this.catalogue, this.document, hostElement)),
// 			);
// 		}
//
// 		return renderer;
// 	}
// }
//
// export class NgtRenderer implements Renderer2 {
// 	// Each renderer instance keeps track of its own argsComments
// 	private argsComments: NgtCommentRendererNode[] = [];
//
// 	constructor(
// 		private delegateRenderer: Renderer2,
// 		private rootStore: NgtSignalStore<NgtState>,
// 		private catalogue: Record<string, NgtAnyConstructor>,
// 		private document: Document,
// 		// NOTE: this closest host element (component) that this renderer is attached to
// 		private hostElement: NgtRendererNode,
// 	) {}
//
// 	createElement(name: string, namespace?: string | null | undefined) {
// 		if (!this.hostElement) {
// 			const hostRendererNode = createRendererNode(this.rootStore.snapshot.scene, { type: 'three', name: 'Scene' });
// 			this.hostElement = hostRendererNode;
// 			return hostRendererNode;
// 		}
//
// 		// portal: <ngt-portal />
// 		if (name === ELEMENTS.portal) {
// 			const commentForPortal = this.delegateRenderer.createComment(`comment-${name}`);
// 			return createRendererNode(commentForPortal, { type: 'portal', name });
// 		}
//
// 		// Raw value: <ngt-value />
// 		if (name === ELEMENTS.value) {
// 			// we'll create a comment node
// 			const commentForValue = this.delegateRenderer.createComment(`comment-ngt-value`);
// 			// then we'll treat it as an NgtInstanceNode with _ngt_ (i.e: prepare)
// 			const preparedComment = prepare(commentForValue, { isRaw: true });
// 			// then we'll create a renderer instance node
// 			return createRendererNode(preparedComment, { type: 'three', name: 'RawValue' });
// 		}
//
// 		// the *args
// 		const injectedArgs = this.getInjectedArgs();
//
// 		// Primitive: <ngt-primitive />
// 		if (name === ELEMENTS.primitive) {
// 			const args = injectedArgs?.value || [];
// 			if (!args[0]) throw new Error(`[NGT] Primitive element requires a args. Use control-flow if needed`);
//
// 			const primitive = args[0];
//
// 			if (!is.instance(primitive)) {
// 				prepare(primitive, { isPrimitive: true });
// 			}
//
// 			return createRendererNode(primitive, { type: 'three', name: 'Primitive' });
// 		}
//
// 		if (name.startsWith('ngt-')) {
// 			const threeName = kebabToPascal(name.slice(4));
// 			const threeClass = this.catalogue[threeName];
//
// 			if (threeClass) {
// 				const args = injectedArgs?.value || [];
// 				const three = prepare(new threeClass(...args));
// 				const localState = getLocalState(three);
//
// 				if (localState) {
// 					if (is.geometry(three)) {
// 						localState.attach = ['geometry'];
// 					} else if (is.material(three)) {
// 						localState.attach = ['material'];
// 					}
// 				}
//
// 				return createRendererNode(three, { type: 'three', name });
// 			}
// 		}
//
// 		return createRendererNode(this.delegateRenderer.createComment(`comment-${name}`), {
// 			type: 'commentForElement',
// 			name,
// 		});
// 	}
//
// 	createComment(value: string) {
// 		const comment = this.delegateRenderer.createComment(`comment-${value}`);
// 		const rendererNode = createRendererNode(comment, {
// 			type: 'comment',
// 			name: value,
// 		});
//
// 		// we attach a callback so we can specifically call these in the directives
// 		Object.assign(rendererNode, {
// 			__ngt_renderer_tracking_comment__: () => {
// 				this.argsComments.push(rendererNode as NgtCommentRendererNode);
// 			},
// 		});
//
// 		return rendererNode;
// 	}
//
// 	appendChild(parent: NgtRendererNode, newChild: NgtRendererNode): void {
// 		// NOTE: skip if parent and child is the same instance
// 		if (parent === newChild) return;
//
// 		const parentNode = getRendererNode(parent);
// 		const childNode = getRendererNode(newChild);
//
// 		// NOTE: NgtRenderer should only handle NgtRendererInstanceNode
// 		if (parentNode && childNode) {
// 			if (isInstanceNode(parentNode)) {
// 				// NOTE: both are instance nodes so we treat them as THREE entities
// 				if (isInstanceNode(childNode)) {
// 					// NOTE: skip if child already attached to a parent
// 					if (childNode.__ngt_renderer__.parentNode && isInstanceNode(childNode.__ngt_renderer__.parentNode)) return;
// 					attachThreeChild(parentNode, childNode);
//
// 					const localState = getLocalState(parentNode);
// 					// if the parent has a parent renderer node but does not have an instance parent node; rerun append
// 					if (localState && !untracked(localState.parent) && parentNode.__ngt_renderer__.parentNode) {
// 						return this.appendChild(parentNode.__ngt_renderer__.parentNode, parentNode);
// 					}
//
// 					return;
// 				}
//
// 				// NOTE: only assign the parentNode for comment
// 				if (isCommentNode(childNode)) {
// 					if (!childNode.__ngt_renderer__.parentNode || childNode.__ngt_renderer__.parentNode !== parentNode) {
// 						childNode.__ngt_renderer__.parentNode = parentNode;
//
// 						// if childNode has childNodes, we'll append them as well
// 						if (childNode.__ngt_renderer__.childNodes) {
// 							for (let i = 0; i < childNode.__ngt_renderer__.childNodes.length; i++) {
// 								const child = childNode.__ngt_renderer__.childNodes[i];
// 								if (isInstanceNode(child)) {
// 									this.appendChild(parentNode, child);
// 								}
// 							}
// 						}
// 						return;
// 					}
// 				}
//
// 				if (isPortalNode(childNode)) {
// 					if (!childNode.__ngt_renderer__.parentNode || childNode.__ngt_renderer__.parentNode !== parentNode) {
// 						childNode.__ngt_renderer__.parentNode = parentNode;
// 						return;
// 					}
// 				}
//
// 				return;
// 			}
//
// 			if (isCommentNode(parentNode)) {
// 				parentNode.__ngt_renderer__.childNodes ??= [];
// 				if (!parentNode.__ngt_renderer__.childNodes.includes(childNode) && !childNode.__ngt_renderer__.trackedBy) {
// 					parentNode.__ngt_renderer__.childNodes.push(childNode);
// 					childNode.__ngt_renderer__.trackedBy = parentNode;
// 				}
//
// 				if (parentNode.__ngt_renderer__.parentNode) {
// 					return this.appendChild(parentNode.__ngt_renderer__.parentNode, newChild);
// 				}
//
// 				childNode.__ngt_renderer__.parentNode = parentNode;
// 				return;
// 			}
//
// 			if (isPortalNode(parentNode)) {
// 				if (!parentNode.__ngt_renderer__.container) {
// 					const portalContainer = this.getPortalContainer(parentNode);
// 					if (portalContainer) {
// 						parentNode.__ngt_renderer__.container = portalContainer as NgtInstanceRendererNode;
// 					}
// 				}
//
// 				if (isInstanceNode(childNode)) {
// 					if (!parentNode.__ngt_renderer__.container) {
// 						childNode.__ngt_renderer__.parentNode = parentNode;
// 						return;
// 					}
//
// 					return this.appendChild(parentNode.__ngt_renderer__.container, childNode);
// 				}
//
// 				if (isCommentNode(childNode)) {
// 					childNode.__ngt_renderer__.parentNode = parentNode;
// 				}
// 				return;
// 			}
// 		}
//
// 		return this.delegateRenderer.appendChild(parent, newChild);
// 	}
//
// 	insertBefore(parent: any, newChild: any, refChild: any, isMove?: boolean | undefined): void {
// 		if (parent instanceof HTMLDivElement && parent.offsetParent && parent.offsetParent.localName === 'ngt-canvas') {
// 			return this.delegateRenderer.appendChild(parent, refChild);
// 		}
//
// 		if (isRendererNode(parent) && isRendererNode(newChild) && isRendererNode(refChild)) {
// 			if (isCommentNode(refChild) && isInstanceNode(newChild)) {
// 				refChild.__ngt_renderer__.childNodes ??= [];
// 				if (!refChild.__ngt_renderer__.childNodes.includes(newChild) && !newChild.__ngt_renderer__.trackedBy) {
// 					refChild.__ngt_renderer__.childNodes.push(newChild);
// 					newChild.__ngt_renderer__.trackedBy = refChild;
// 				}
// 			}
// 			return this.appendChild(parent, newChild);
// 		}
//
// 		return this.delegateRenderer.insertBefore(parent, newChild, refChild, isMove);
// 	}
//
// 	parentNode(node: unknown) {
// 		if (isRendererNode(node)) {
// 			if (!node.__ngt_renderer__ || node.__ngt_renderer__.destroyed) return null;
// 			return node.__ngt_renderer__.parentNode || null;
// 		}
//
// 		return this.delegateRenderer.parentNode(node);
// 	}
//
// 	setAttribute(el: NgtRendererNode, name: string, value: string, namespace?: string | null | undefined): void {
// 		// NOTE: we should only deal with Instance node. Actual `ngt-` elements;
// 		// other elements should be treated as Angular components and inputs
// 		if (isRendererNode(el)) {
// 			if (!el.__ngt_renderer__ || el.__ngt_renderer__.destroyed) return;
//
// 			if (isInstanceNode(el)) {
// 				// <ngt- priority
// 				if (name === ATTRIBUTES.priority) {
// 					// NOTE: priority should be an attribute binding (no [])
// 					// because we want to set it as soon as possible. We'll convert it to a number here
//
// 					let priority = Number(value);
// 					if (isNaN(priority)) {
// 						console.warn(`[NGT] "priority" is an invalid number, default to 0`);
// 						priority = 0;
// 					}
// 					const localState = getLocalState(el);
// 					if (localState) {
// 						localState.priority = priority;
// 					}
// 					return;
// 				}
//
// 				// <ngt- attach />
// 				if (name === ATTRIBUTES.attach) {
// 					// NOTE: handle attach as tring
// 					const paths = value.split('.');
// 					if (paths.length) {
// 						const localState = getLocalState(el);
// 						if (localState) {
// 							localState.attach = paths;
// 						}
// 					}
// 					return;
// 				}
//
// 				// otherwise, apply the change
// 				applyProps(el, { [name]: value });
// 				return;
// 			}
//
// 			// NOTE: this can mean that the user is using attribute as ng-content select or arbitrary attribute for styling
// 			// on a component's host element. We'll keep track of it but probably won't do anything with it.
// 			if (el.__ngt_renderer__.attributes) {
// 				el.__ngt_renderer__.attributes[name] = value;
// 			} else {
// 				el.__ngt_renderer__.attributes = { [name]: value };
// 			}
// 			return;
// 		}
//
// 		return this.delegateRenderer.setAttribute(el, name, value, namespace);
// 	}
//
// 	setProperty(el: NgtRendererNode, name: string, value: any): void {
// 		if (isRendererNode(el)) {
// 			if (!el.__ngt_renderer__ || el.__ngt_renderer__.destroyed) return;
//
// 			if (isInstanceNode(el)) {
// 				// <ngt-value [rawValue] />
// 				if (name === PROPERTIES.rawValue) {
// 					const localState = getLocalState(el);
// 					const parent = localState?.parent
// 						? untracked(localState.parent) || el.__ngt_renderer__.parentNode
// 						: el.__ngt_renderer__.parentNode;
//
// 					if (localState) {
// 						localState.rawValue = value;
// 					}
//
// 					if (parent && isRendererNode(parent)) {
// 						this.appendChild(parent, el);
// 					}
//
// 					return;
// 				}
//
// 				if (name === PROPERTIES.parameters) {
// 					applyProps(el, value);
// 					return;
// 				}
//
// 				// <ngt- [attach] /> dynamic attach
// 				if (name === ATTRIBUTES.attach) {
// 					const localState = getLocalState(el);
// 					const parent = localState?.parent
// 						? untracked(localState.parent) || el.__ngt_renderer__.parentNode
// 						: el.__ngt_renderer__.parentNode;
//
// 					if (localState) {
// 						localState.attach = Array.isArray(value)
// 							? value.map((v) => v.toString())
// 							: typeof value === 'function'
// 								? value
// 								: [value];
// 					}
//
// 					if (parent && isRendererNode(parent)) {
// 						this.appendChild(parent, el);
// 					}
//
// 					return;
// 				}
//
// 				applyProps(el, { [name]: value });
// 				return;
// 			}
//
// 			return;
// 		}
//
// 		return this.delegateRenderer.setProperty(el, name, value);
// 	}
//
// 	listen(target: NgtRendererNode, eventName: string, callback: (event: any) => boolean | void): () => void {
// 		let [domTarget, event] = eventName.split(':');
// 		if (event == null) {
// 			event = domTarget;
// 			domTarget = '';
// 		}
//
// 		if (domTarget) {
// 			if (domTarget !== 'document' && domTarget !== 'window') {
// 				console.warn(
// 					`[NGT] Invalid target "${domTarget}" for host event listener. Only "document" and "window" are supported.`,
// 				);
// 				return () => {};
// 			}
//
// 			const eventTarget = domTarget === 'document' ? this.document : this.document.defaultView;
// 			if (!eventTarget) return () => {};
// 			return this.delegateRenderer.listen(eventTarget, event, callback);
// 		}
//
// 		if (isRendererNode(target)) {
// 			if (target.__ngt_renderer__.destroyed) return () => {};
//
// 			if (isInstanceNode(target)) {
// 				const localState = getLocalState(target);
// 				if (localState && !localState.store) {
// 					localState.store = this.rootStore;
// 				}
// 				return processThreeEvent(target, event, callback);
// 			}
// 		}
//
// 		return this.delegateRenderer.listen(target, eventName, callback);
// 	}
//
// 	removeChild(parent: NgtRendererNode, oldChild: NgtRendererNode, isHostElement?: boolean | undefined): void {
// 		if (isRendererNode(parent) && isRendererNode(oldChild)) {
// 			// NOTE: when both are instance nodes
// 			if (isInstanceNode(parent) && isInstanceNode(oldChild)) {
// 				detachThreeChild(parent, oldChild);
// 				this.destroyNode?.(oldChild);
// 				return;
// 			}
//
// 			if (isCommentNode(oldChild)) {
// 				this.removeCommentNodeChildren(parent, oldChild);
// 				return;
// 			}
//
// 			return;
// 		}
//
// 		if (isRendererNode(parent) || isRendererNode(oldChild)) {
// 			// if either parent or oldChild is still a renderer node
// 			// just drop them for now
// 			this.destroyNode?.(parent);
// 			this.destroyNode?.(oldChild);
// 			return;
// 		}
//
// 		return this.delegateRenderer.removeChild(parent, oldChild, isHostElement);
// 	}
//
// 	destroyNode: ((node: any) => void) | null = (node) => {
// 		if (isRendererNode(node)) {
// 			if (!node.__ngt_renderer__ || node.__ngt_renderer__.destroyed) return;
//
// 			node.__ngt_renderer__.destroyed = true;
// 			delete node.__ngt_renderer__.parentNode;
// 			delete node.__ngt_renderer__.childNodes;
//
// 			if (node.__ngt_renderer__.trackedBy) {
// 				const trackedBy = node.__ngt_renderer__.trackedBy;
// 				const index = trackedBy.__ngt_renderer__.childNodes?.indexOf(node);
// 				if (index !== undefined && index >= 0) trackedBy.__ngt_renderer__.childNodes?.splice(index, 1);
//
// 				if (trackedBy.__ngt_renderer__.parentNode) {
// 					const parent = trackedBy.__ngt_renderer__.parentNode;
// 					// this means that the parent of trackedBy is already cleaned up
// 					if (!isRendererNode(parent) || parent.__ngt_renderer__.destroyed) {
// 						delete trackedBy.__ngt_renderer__.parentNode;
// 					}
// 				}
// 			}
//
// 			delete node.__ngt_renderer__.trackedBy;
//
// 			if (isCommentNode(node)) {
// 				delete node.__ngt_renderer__.attributes;
// 			}
// 		}
//
// 		delete node.__ngt_renderer__;
// 	};
//
// 	removeAttribute(el: any, name: string, namespace?: string | null | undefined): void {
// 		if (isRendererNode(el)) {
// 			if (!el.__ngt_renderer__ || el.__ngt_renderer__.destroyed) return;
// 			if (isCommentNode(el) && el.__ngt_renderer__.attributes) {
// 				delete el.__ngt_renderer__.attributes[name];
// 			}
// 			return;
// 		}
//
// 		return this.delegateRenderer.removeAttribute(el, name, namespace);
// 	}
//
// 	// TODO: we might want/need to implement this for [ngComponentOutlet] support?
// 	nextSibling(node: any) {
// 		throw new Error('Method not implemented.');
// 	}
//
// 	// TODO: we might want to impelement this for ngts-text
// 	createText = this.delegateRenderer.createText.bind(this.delegateRenderer);
// 	destroy(): void {}
// 	selectRootElement = this.delegateRenderer.selectRootElement.bind(this.delegateRenderer);
// 	addClass = this.delegateRenderer.addClass.bind(this.delegateRenderer);
// 	removeClass = this.delegateRenderer.removeClass.bind(this.delegateRenderer);
// 	setStyle = this.delegateRenderer.setStyle.bind(this.delegateRenderer);
// 	removeStyle = this.delegateRenderer.removeStyle.bind(this.delegateRenderer);
// 	setValue = this.delegateRenderer.setValue.bind(this.delegateRenderer);
//
// 	get data(): { [key: string]: any } {
// 		return this.delegateRenderer.data;
// 	}
//
// 	private removeCommentNodeChildren(parent: NgtRendererNode, commentChild: NgtCommentRendererNode) {
// 		if (!commentChild.__ngt_renderer__ || commentChild.__ngt_renderer__.destroyed) return;
//
// 		const childNodes = [...(commentChild.__ngt_renderer__.childNodes || [])];
// 		for (let i = 0; i < childNodes.length; i++) {
// 			const child = childNodes[i];
// 			// already cleaned up
// 			if (!child.__ngt_renderer__) continue;
//
// 			if (isInstanceNode(child)) {
// 				this.removeChild(parent, child);
// 				// remove from childNodes
// 				commentChild.__ngt_renderer__.childNodes?.splice(i, 1);
// 				// destroy node
// 				this.destroyNode?.(child);
// 				continue;
// 			}
//
// 			if (isCommentNode(child)) {
// 				this.removeCommentNodeChildren(parent, child);
// 			}
// 		}
//
// 		if (commentChild.__ngt_renderer__.type === 'commentForElement') {
// 			this.destroyNode?.(commentChild);
// 		}
// 	}
//
// 	private getInjectedArgs() {
// 		let directive: NgtArgs | undefined;
// 		const destroyed = [];
//
// 		let i = this.argsComments.length - 1;
// 		while (i >= 0) {
// 			const comment = this.argsComments[i];
// 			if (!comment.__ngt_renderer__ || comment.__ngt_renderer__.destroyed) {
// 				destroyed.push(i);
// 				i--;
// 				continue;
// 			}
// 			const injector = getDebugNode(comment)?.injector;
// 			if (!injector) {
// 				i--;
// 				continue;
// 			}
// 			const instance = injector.get(NgtArgs, null);
// 			if (instance && instance.validate()) {
// 				directive = instance;
// 				break;
// 			}
//
// 			i--;
// 		}
//
// 		destroyed.forEach((index) => {
// 			this.argsComments.splice(index, 1);
// 		});
//
// 		return directive;
// 	}
//
// 	private getPortalContainer(portalNode: NgtPortalRendererNode) {
// 		const injector = getDebugNode(portalNode)?.injector;
// 		if (!injector) return null;
//
// 		const store = injector.get(NGT_STORE, null);
// 		if (!store) return null;
//
// 		let portalContainer = store.snapshot.scene as unknown as NgtRendererNode;
//
// 		if (!portalContainer) return null;
//
// 		if (!isRendererNode(portalContainer)) {
// 			portalContainer = createRendererNode(portalContainer, {
// 				type: 'three',
// 				name: 'PortalScene',
// 				parentNode: portalNode,
// 			});
// 		}
//
// 		return portalContainer;
// 	}
// }
//
