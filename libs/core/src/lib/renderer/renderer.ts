import { DOCUMENT } from '@angular/common';
import {
	DebugNode,
	inject,
	Injectable,
	Renderer2,
	RendererFactory2,
	RendererType2,
	Type,
	untracked,
} from '@angular/core';
import * as THREE from 'three';
import { NgtArgs } from '../directives/args';
import { NgtParent } from '../directives/parent';
import { getInstanceState, prepare } from '../instance';
import { NGT_STORE } from '../store';
import { NgtAnyRecord, NgtConstructorRepresentation, NgtInstanceState, NgtState } from '../types';
import { applyProps } from '../utils/apply-props';
import { is } from '../utils/is';
import { SignalState } from '../utils/signal-state';
import { injectCatalogue } from './catalogue';
import {
	CANVAS_CONTENT_FLAG,
	NGT_GET_NODE_ATTRIBUTE_FLAG,
	NGT_MANUAL_INJECTED_STORE,
	NGT_RENDERER_NODE_FLAG,
	SPECIAL_INTERNAL_ADD_COMMENT_FLAG,
	SPECIAL_INTERNAL_SET_PARENT_COMMENT_FLAG,
	THREE_NATIVE_EVENTS,
} from './constants';
import {
	addRendererChildNode,
	createRendererNode,
	isRendererNode,
	NgtRendererNode,
	setRendererParentNode,
} from './state';
import { attachThreeNodes, kebabToPascal, NgtRendererClassId, removeThreeChild } from './utils';

@Injectable()
export class NgtRendererFactory2 implements RendererFactory2 {
	private catalogue = injectCatalogue();
	private document = inject(DOCUMENT);
	private rendererMap = new Map<string, Renderer2>();
	private portals = new Set<Renderer2>();

	/**
	 * NOTE: We use `useFactory` to instantiate `NgtRendererFactory2`
	 */
	constructor(private delegateRendererFactory: RendererFactory2) {}

	createRenderer(hostElement: any, type: RendererType2 | null): Renderer2 {
		const delegateRenderer = this.delegateRendererFactory.createRenderer(hostElement, type);
		if (!type) return delegateRenderer;

		const isPortal = isRendererNode(hostElement) && hostElement.__ngt_renderer__[NgtRendererClassId.type] === 'portal';

		const debugNode = hostElement ? new DebugNode(hostElement) : null;
		let store = debugNode?.injector?.get(NGT_STORE, null, { optional: true }) || null;

		// if the host element is already a renderer node, it should hav a store
		if (!store && isRendererNode(hostElement) && hostElement.__ngt_renderer__[NgtRendererClassId.store]) {
			store = hostElement.__ngt_renderer__[NgtRendererClassId.store];
		}

		// if there's still no store but there's NGT_MANUAL_INJECTED_STORE (i.e: from NgtRouterOutlet)
		if (!store && 'type' in type && typeof type.type === 'function' && NGT_MANUAL_INJECTED_STORE in type.type) {
			store = type.type[NGT_MANUAL_INJECTED_STORE] as SignalState<NgtState> | null;
		}

		const cacheKey = store ? `${type.id}-${store.snapshot.id}` : type.id;
		let renderer = !isPortal ? this.rendererMap.get(cacheKey) : null;

		if (!isRendererNode(hostElement)) {
			renderer = null;
		}

		if (!renderer) {
			// detect the entry point of *canvasContent directive
			const hasCanvasContent = (type as any)['consts']?.some((constArr: unknown[]) =>
				constArr.some((item) => item === 'canvasContent'),
			);

			if (!store && !hasCanvasContent) {
				renderer = delegateRenderer;
			} else {
				// NOTE: if we have a store but hostElement isn't a renderer node,
				// this means the element was created in a context outside of NgtCanvas
				// but is _embedded_ in the NgtCanvas context later on via ng-template
				// we'll make the hostElement a RendererNode here
				if (store && hostElement) {
					if (!(NGT_RENDERER_NODE_FLAG in hostElement)) {
						createRendererNode('platform', store, hostElement, this.document);
					}

					const rS = (hostElement as NgtRendererNode).__ngt_renderer__;
					// reassign store if it's different
					if (rS[NgtRendererClassId.store] !== store) {
						rS[NgtRendererClassId.store] = store;
					}
				}

				const removeRenderer = (renderer: Renderer2) => {
					if (isPortal) {
						this.portals.delete(renderer);
					} else {
						const existing = this.rendererMap.get(cacheKey);
						if (existing === renderer) {
							this.rendererMap.delete(cacheKey);
						}
					}
				};

				renderer = new NgtRenderer2(delegateRenderer, this.catalogue, this.document, store, removeRenderer);
			}

			if (isPortal) {
				this.portals.add(renderer);
			} else {
				this.rendererMap.set(type.id, renderer);
			}
		}

		if ('count' in renderer && typeof renderer.count === 'number') {
			renderer.count += 1;
		}

		return renderer;
	}
}

export class NgtRenderer2 implements Renderer2 {
	private argsCommentNodes: Array<NgtRendererNode> = [];
	private parentCommentNodes: Array<NgtRendererNode> = [];

	constructor(
		private delegateRenderer: Renderer2,
		private catalogue: Record<string, NgtConstructorRepresentation>,
		private document: Document,
		private store: SignalState<NgtState> | null,
		private removeRenderer: (renderer: Renderer2) => void,
		private count = 1,
	) {}

	get data(): { [key: string]: any } {
		return {
			...this.delegateRenderer.data,
			__ngt_renderer__: true,
		};
	}

	destroy(): void {
		if (this.count > 1) {
			this.count -= 1;
			return;
		}

		// this is the last instance of the same NgtRenderer2
		this.count = 0;
		this.argsCommentNodes = [];
		this.parentCommentNodes = [];
		this.removeRenderer(this);
	}

	createElement(name: string, namespace?: string | null) {
		const platformElement = this.delegateRenderer.createElement(name, namespace);

		if (!this.store) return platformElement;

		if (name === 'ngt-portal') {
			return createRendererNode('portal', this.store, platformElement, this.document);
		}

		const [injectedArgs, injectedParent] = [
			this.getNgtDirective(NgtArgs, this.argsCommentNodes)?.value || [],
			this.getNgtDirective(NgtParent, this.parentCommentNodes)?.value,
		];

		const threeName = kebabToPascal(name.startsWith('ngt-') ? name.slice(4) : name);
		const threeTarget = this.catalogue[threeName];

		if (threeTarget) {
			const threeInstance = prepare(new threeTarget(...injectedArgs), this.store, name);
			const rendererNode = createRendererNode('three', this.store, threeInstance, this.document);
			const instanceState = getInstanceState(threeInstance) as NgtInstanceState;

			// auto-attach for geometry and material
			if (is.geometry(threeInstance)) {
				instanceState.attach = ['geometry'];
			} else if (is.material(threeInstance)) {
				instanceState.attach = ['material'];
			}

			if (injectedParent) {
				rendererNode.__ngt_renderer__[NgtRendererClassId.parent] = injectedParent as unknown as NgtRendererNode;
			}

			return rendererNode;
		}

		return createRendererNode('platform', this.store, platformElement, this.document);
	}

	createComment(value: string) {
		const commentNode = this.delegateRenderer.createComment(value);
		if (!this.store) return commentNode;

		const commentRendererNode = createRendererNode('comment', this.store, commentNode, this.document);

		// NOTE: we attach an arrow function to the Comment node
		//  In our directives, we can call this function to then start tracking the RendererNode
		//  this is done to limit the amount of Nodes we need to process for getCreationState
		commentRendererNode[SPECIAL_INTERNAL_ADD_COMMENT_FLAG] = (node: NgtAnyRecord | 'args' | 'parent') => {
			if (node === 'args') {
				this.argsCommentNodes.push(commentRendererNode);
			} else if (node === 'parent') {
				commentRendererNode[SPECIAL_INTERNAL_SET_PARENT_COMMENT_FLAG] = (ngtParent: NgtRendererNode) => {
					this.parentCommentNodes.push(commentRendererNode);
					commentRendererNode.__ngt_renderer__[NgtRendererClassId.parent] = ngtParent;
				};
			} else if (typeof node === 'object') {
				// this.portalCommentsNodes.push(node);
			}
		};

		return commentRendererNode;
	}

	createText(value: string) {
		const textNode = this.delegateRenderer.createText(value);

		if (!this.store) return textNode;

		return createRendererNode('text', this.store, textNode, this.document);
	}

	destroyNode: (node: any) => void = (node) => {
		if (!this.store) return this.delegateRenderer.destroyNode?.(node);
		const rS = (node as NgtRendererNode).__ngt_renderer__;

		if (!rS || rS[NgtRendererClassId.destroyed]) return;

		for (const child of rS[NgtRendererClassId.children].slice()) {
			this.removeChild(node, child);
			this.destroyNode(child);
		}

		// clear out parent if haven't
		rS[NgtRendererClassId.parent] = null;
		// clear out children
		rS[NgtRendererClassId.children].length = 0;

		// clear out NgtInstanceState
		const iS = getInstanceState(node);
		if (iS) {
			const temp = iS as NgtAnyRecord;
			delete temp['onAttach'];
			delete temp['onUpdate'];
			delete temp['object'];
			delete temp['objects'];
			delete temp['nonObjects'];
			delete temp['parent'];
			delete temp['add'];
			delete temp['remove'];
			delete temp['updateGeometryStamp'];
			delete temp['setParent'];
			delete temp['store'];
			delete temp['handlers'];
			delete temp['hierarchyStore'];
			delete temp['previousAttach'];

			if (iS.type !== 'ngt-primitive') {
				delete node['__ngt__'];
			}
		}

		// clear our debugNode
		delete rS[NgtRendererClassId.debugNode];
		delete rS[NgtRendererClassId.debugNodeFactory];

		if (rS[NgtRendererClassId.type] === 'comment') {
			delete node[SPECIAL_INTERNAL_ADD_COMMENT_FLAG];
			delete node[SPECIAL_INTERNAL_SET_PARENT_COMMENT_FLAG];
		}

		// clear store
		rS[NgtRendererClassId.store] = null!;

		// clear getAttribute if exist
		if (
			'getAttribute' in node &&
			typeof node['getAttribute'] === 'function' &&
			node['getAttribute'][NGT_GET_NODE_ATTRIBUTE_FLAG]
		) {
			delete node['getAttribute'];
		}

		// mark node as destroyed
		rS[NgtRendererClassId.destroyed] = true;
	};

	appendChild(parent: any, newChild: any): void {
		if (!this.store) return this.delegateRenderer.appendChild(parent, newChild);

		const pRS = (parent as NgtRendererNode).__ngt_renderer__;
		const cRS = (newChild as NgtRendererNode).__ngt_renderer__;

		if (!pRS && !cRS) {
			console.warn('[NGT] Both parent and child are not renderer node.', { parent, newChild });
			return this.delegateRenderer.appendChild(parent, newChild);
		}

		//  if the child is a comment, we'll set the parent then bail
		if (cRS?.[NgtRendererClassId.type] === 'comment') {
			setRendererParentNode(newChild, parent);

			// reassign store for comment node if it's different than the parent
			if (pRS?.[NgtRendererClassId.store] && cRS[NgtRendererClassId.store] !== pRS[NgtRendererClassId.store]) {
				cRS[NgtRendererClassId.store] = pRS[NgtRendererClassId.store];
			}

			return;
		}

		if (cRS?.[NgtRendererClassId.type] === 'three') {
			//  if child is three and parent is platform
			if (pRS?.[NgtRendererClassId.type] === 'platform') {
				// first check if there's a parent on the parent
				const grandParent = pRS[NgtRendererClassId.parent];
				// if there is, we'll recurse with the grandparent
				if (grandParent) {
					return this.appendChild(grandParent, newChild);
				}

				// if not, then we'll set the relationship between these two for later stages
				this.setNodeRelationship(parent, newChild);
				return;
			}

			// if child is three and parent is also three, straight-forward case
			if (pRS?.[NgtRendererClassId.type] === 'three') {
				return this.appendThreeRendererNodes(parent, newChild);
			}

			// if parent is portal
			if (pRS?.[NgtRendererClassId.type] === 'portal') {
				let portalContainer = pRS[NgtRendererClassId.portalContainer];
				if (!portalContainer) {
					const container = pRS[NgtRendererClassId.store].snapshot.scene;
					if (!isRendererNode(container)) {
						createRendererNode('three', pRS[NgtRendererClassId.store], container, this.document);
					}

					const rendererNode = container as unknown as NgtRendererNode;
					if (!rendererNode.__ngt_renderer__[NgtRendererClassId.parent]) {
						rendererNode.__ngt_renderer__[NgtRendererClassId.parent] = parent;
					}

					portalContainer = pRS[NgtRendererClassId.portalContainer] = rendererNode;
				}
				if (portalContainer) {
					return this.appendChild(portalContainer, newChild);
				}

				// if not, then we'll set the relationship between these two for later stages
				this.setNodeRelationship(parent, newChild);
				return;
			}
		}

		if (pRS?.[NgtRendererClassId.type] === 'three') {
			// if parent is three and child is platform
			if (cRS?.[NgtRendererClassId.type] === 'platform') {
				if (!cRS[NgtRendererClassId.parent] || cRS[NgtRendererClassId.parent] !== parent) {
					setRendererParentNode(newChild, parent);
				}

				for (const rendererChildNode of cRS[NgtRendererClassId.children]) {
					this.appendChild(parent, rendererChildNode);
				}

				return;
			}

			if (cRS?.[NgtRendererClassId.type] === 'portal') {
				if (!cRS[NgtRendererClassId.parent] || cRS[NgtRendererClassId.parent] !== parent) {
					setRendererParentNode(newChild, parent);
				}
				return;
			}

			// if parent is three and child is also three, straight-forward case
			if (cRS?.[NgtRendererClassId.type] === 'three') {
				return this.appendThreeRendererNodes(parent, newChild);
			}
		}

		if (pRS?.[NgtRendererClassId.type] === 'platform') {
			// if parent is platform, and child is platform
			if (cRS?.[NgtRendererClassId.type] === 'platform') {
				this.setNodeRelationship(parent, newChild);
				this.delegateRenderer.appendChild(parent, newChild);

				const closestAncestorThreeNode = this.findClosestAncestorThreeNode(parent);
				if (closestAncestorThreeNode) this.appendChild(closestAncestorThreeNode, newChild);
				return;
			}

			// if parent is platform and child is portal
			if (cRS?.[NgtRendererClassId.type] === 'portal') {
				this.setNodeRelationship(parent, newChild);
				this.delegateRenderer.appendChild(parent, newChild);
				return;
			}
		}

		return this.delegateRenderer.appendChild(parent, newChild);
	}

	insertBefore(parent: any, newChild: any, refChild: any, isMove?: boolean): void {
		// if both are comments and the reference child is NgtCanvasContent, we'll assign the same flag to the newChild
		// this means that the NgtCanvas component is embedding. This flag allows the Renderer to get the root scene
		// when it tries to attach the template under `ng-template[canvasContent]`
		if (refChild && refChild[CANVAS_CONTENT_FLAG] && refChild instanceof Comment && newChild instanceof Comment) {
			Object.assign(newChild, { [CANVAS_CONTENT_FLAG]: true });
		}

		// if there is no parent, we delegate
		if (!parent) {
			return this.delegateRenderer.insertBefore(parent, newChild, refChild, isMove);
		}

		if (this.store || NGT_RENDERER_NODE_FLAG in parent || (newChild && NGT_RENDERER_NODE_FLAG in newChild)) {
			return this.appendChild(parent, newChild);
		}

		return this.delegateRenderer.insertBefore(parent, newChild, refChild, isMove);
	}

	removeChild(parent: any, oldChild: any, isHostElement?: boolean): void {
		if (!this.store) return this.delegateRenderer.removeChild(parent, oldChild, isHostElement);

		if (parent === null) {
			parent = this.parentNode(oldChild);
		}

		const cRS = (oldChild as NgtRendererNode).__ngt_renderer__;

		// disassociate things from oldChild
		cRS[NgtRendererClassId.parent] = null;

		// if parent is still undefined
		if (parent == null) {
			if (cRS[NgtRendererClassId.destroyed]) {
				// if the child is already destroyed, just skip
				return;
			}
			console.warn('[NGT] parent is not found when remove child', { parent, oldChild });
			return;
		}

		const pRS = (parent as NgtRendererNode).__ngt_renderer__;
		const childIndex = pRS[NgtRendererClassId.children].indexOf(oldChild);
		if (childIndex >= 0) {
			// disassociate oldChild from parent children
			pRS[NgtRendererClassId.children].splice(childIndex, 1);
		}

		if (pRS[NgtRendererClassId.type] === 'three') {
			if (cRS[NgtRendererClassId.type] === 'three') {
				return removeThreeChild(oldChild, parent, true);
			}

			if (cRS[NgtRendererClassId.type] === 'platform') {
				return;
			}
		}

		if (pRS[NgtRendererClassId.type] === 'platform') {
			if (cRS[NgtRendererClassId.type] === 'three') {
				return;
			}

			if (cRS[NgtRendererClassId.type] === 'platform') {
				return this.delegateRenderer.removeChild(parent, oldChild, isHostElement);
			}
		}

		if (pRS[NgtRendererClassId.type] === 'portal') {
			const portalContainer = pRS[NgtRendererClassId.portalContainer];
			if (portalContainer) {
				return this.removeChild(portalContainer, oldChild, isHostElement);
			}
		}

		return this.delegateRenderer.removeChild(parent, oldChild, isHostElement);
	}

	parentNode(node: any) {
		// NOTE: if we don't have both the store and the node is not a renderer node, delegate
		if (!this.store && !(NGT_RENDERER_NODE_FLAG in node)) {
			return this.delegateRenderer.parentNode(node);
		}

		if (node && node[CANVAS_CONTENT_FLAG] && node instanceof Comment && isRendererNode(node)) {
			const store = node.__ngt_renderer__[NgtRendererClassId.store];

			// NOTE: if the current renderer instance does not have a store but the comment
			// has it. we assign the store to the renderer instance
			if (!this.store) {
				this.store = store;
			}

			const rootScene = store.snapshot.scene;

			if (!(NGT_RENDERER_NODE_FLAG in rootScene)) {
				createRendererNode('three', store, rootScene, this.document);
			}

			return rootScene;
		}

		if (isRendererNode(node)) {
			return node.__ngt_renderer__[NgtRendererClassId.parent];
		}

		return this.delegateRenderer.parentNode(node);
	}

	setAttribute(el: any, name: string, value: string, namespace?: string | null): void {
		if (!this.store) return this.delegateRenderer.setAttribute(el, name, value, namespace);

		const rS = (el as NgtRendererNode).__ngt_renderer__;
		if (!rS) return this.delegateRenderer.setAttribute(el, name, value, namespace);

		if (rS[NgtRendererClassId.destroyed]) {
			console.warn(`[NGT] setAttribute is invoked on destroyed renderer node.`, { el, name, value });
			return;
		}

		if (rS[NgtRendererClassId.type] === 'three') {
			if (name === 'attach') {
				const paths = value.split('.');
				if (paths.length) {
					const instanceState = getInstanceState(el);
					if (instanceState) instanceState.attach = paths;
				}
			} else {
				// coercion for primitive values
				let maybeCoerced: string | number | boolean = value;

				if (maybeCoerced === '' || maybeCoerced === 'true' || maybeCoerced === 'false') {
					maybeCoerced = maybeCoerced === 'true' || maybeCoerced === '';
				} else {
					const maybeNumber = Number(maybeCoerced);
					if (!isNaN(maybeNumber)) maybeCoerced = maybeNumber;
				}

				if (name === 'rawValue') {
					rS[NgtRendererClassId.rawValue] = maybeCoerced;
				} else {
					applyProps(el, { [name]: maybeCoerced });
				}
			}

			return;
		}

		return this.delegateRenderer.setAttribute(el, name, value, namespace);
	}

	setProperty(el: any, name: string, value: any): void {
		if (!this.store) return this.delegateRenderer.setProperty(el, name, value);

		const rS = (el as NgtRendererNode).__ngt_renderer__;
		if (!rS || rS[NgtRendererClassId.destroyed]) {
			console.log('case setProperty but renderer state is undefined or destroyed', { el, name, value });
			return;
		}

		if (rS[NgtRendererClassId.type] === 'three') {
			const instanceState = getInstanceState(el);

			if (name === 'parameters') {
				// NOTE: short-cut for null raycast to prevent upstream from creating a nullRaycast property
				if ('raycast' in value && value['raycast'] === null) {
					value['raycast'] = () => null;
				}

				applyProps(el, value);

				if ('geometry' in value && value['geometry'].isBufferGeometry) {
					instanceState?.updateGeometryStamp();
				}

				return;
			}

			const parent = instanceState?.hierarchyStore.snapshot.parent || rS[NgtRendererClassId.parent];

			// [rawValue]
			if (instanceState?.type === 'ngt-value' && name === 'rawValue') {
				rS[NgtRendererClassId.rawValue] = value;
				if (parent) this.appendChild(parent, el);
				return;
			}

			// [attach]
			if (name === 'attach') {
				if (instanceState)
					instanceState.attach = Array.isArray(value)
						? value.map((v) => v.toString())
						: typeof value === 'function'
							? value
							: typeof value === 'string'
								? value.split('.')
								: [value];
				if (parent) this.appendChild(parent, el);
				return;
			}

			// NOTE: short-cut for null raycast to prevent upstream from creating a nullRaycast property
			if (name === 'raycast' && value === null) {
				value = () => null;
			}

			applyProps(el, { [name]: value });

			if (name === 'geometry' && value.isBufferGeometry) {
				instanceState?.updateGeometryStamp();
			}

			return;
		}

		return this.delegateRenderer.setProperty(el, name, value);
	}

	listen(
		target: 'window' | 'document' | 'body' | any,
		eventName: string,
		callback: (event: any) => boolean | void,
	): () => void {
		if (!this.store) return this.delegateRenderer.listen(target, eventName, callback);

		if (typeof target === 'string') {
			return this.delegateRenderer.listen(target, eventName, callback);
		}

		const rS = (target as NgtRendererNode).__ngt_renderer__;
		if (!rS) {
			return this.delegateRenderer.listen(target, eventName, callback);
		}

		if (rS[NgtRendererClassId.destroyed]) return () => {};

		if (rS[NgtRendererClassId.type] === 'three') {
			const iS = getInstanceState(target);
			if (!iS) {
				console.warn('[NGT] instance has not been prepared yet.');
				return () => {};
			}

			if (eventName === 'attached') {
				iS.onAttach = callback;
				const parent = iS.parent && untracked(iS.parent);
				if (parent) iS.onAttach({ parent, node: target });
				return () => {
					iS.onAttach = undefined;
				};
			}

			if (eventName === 'updated') {
				iS.onUpdate = callback;
				return () => {
					iS.onUpdate = undefined;
				};
			}

			if (THREE_NATIVE_EVENTS.includes(eventName) && target instanceof THREE.EventDispatcher) {
				// NOTE: rename to dispose because that's the event type, not disposed.
				if (eventName === 'disposed') {
					eventName = 'dispose';
				}

				if ((target as THREE.Object3D).parent && (eventName === 'added' || eventName === 'removed')) {
					callback({ type: eventName, target });
				}

				target.addEventListener(eventName, callback);
				return () => {
					target.removeEventListener(eventName, callback);
				};
			}

			if (!iS.handlers) iS.handlers = {};

			// try to get the previous handler. compound might have one, the THREE object might also have one with the same name
			const previousHandler = iS.handlers[eventName as keyof typeof iS.handlers];
			// readjust the callback
			const updatedCallback: typeof callback = (event) => {
				if (previousHandler) previousHandler(event);
				callback(event);
			};

			Object.assign(iS.handlers, { [eventName]: updatedCallback });

			// increment the count everytime
			iS.eventCount += 1;

			// but only add the instance (target) to the interaction array (so that it is handled by the EventManager with Raycast)
			// the first time eventCount is incremented
			if (iS.eventCount === 1 && 'raycast' in target && !!target['raycast']) {
				// get the top-most root store
				let root = iS.store;
				while (root.snapshot.previousRoot) {
					root = root.snapshot.previousRoot;
				}

				if (root.snapshot.internal) {
					root.snapshot.internal.interaction.push(target);
				}
			}

			// clean up the event listener by removing the target from the interaction array
			return () => {
				const iS = getInstanceState(target);
				if (iS) {
					iS.eventCount -= 1;
					let root = iS.store;
					while (root.snapshot.previousRoot) {
						root = root.snapshot.previousRoot;
					}

					if (root.snapshot.internal) {
						const interactions = root.snapshot.internal.interaction;
						const index = interactions.findIndex((obj) => obj.uuid === target.uuid);
						if (index >= 0) interactions.splice(index, 1);
					}
				}
			};
		}

		return this.delegateRenderer.listen(target, eventName, callback);
	}

	private findClosestAncestorThreeNode<TNode = any>(node: TNode) {
		// TODO: handle portal

		const rS = (node as NgtRendererNode).__ngt_renderer__;
		if (!rS) return null;

		if (rS[NgtRendererClassId.type] === 'three') return node;

		let parent = rS[NgtRendererClassId.parent];

		if (
			parent &&
			parent.__ngt_renderer__[NgtRendererClassId.type] === 'portal' &&
			parent.__ngt_renderer__[NgtRendererClassId.portalContainer]?.__ngt_renderer__[NgtRendererClassId.type] === 'three'
		) {
			return parent.__ngt_renderer__[NgtRendererClassId.portalContainer];
		}

		while (parent && parent.__ngt_renderer__ && parent.__ngt_renderer__[NgtRendererClassId.type] !== 'three') {
			parent =
				parent.__ngt_renderer__[NgtRendererClassId.portalContainer] ??
				parent.__ngt_renderer__[NgtRendererClassId.parent];
		}

		return parent;
	}

	private appendThreeRendererNodes(parent: any, child: any) {
		// if parent and chlid are the same, skip
		if (parent === child) {
			console.log('case three renderer node but parent and child are the same', { parent, child });
			return;
		}

		const cIS = getInstanceState(child);

		// if child is already attached to a parent, skip
		if (cIS?.hierarchyStore.snapshot.parent) {
			console.log('case three renderer node but child already attached', { parent, child });
			return;
		}

		// set the relationship
		this.setNodeRelationship(parent, child);

		// attach THREE child
		attachThreeNodes(parent, child);
		return;
	}

	private setNodeRelationship(parent: any, child: any) {
		setRendererParentNode(child, parent);
		addRendererChildNode(parent, child);
	}

	private getNgtDirective<TDirective>(directive: Type<TDirective>, commentNodes: Array<NgtRendererNode>) {
		let directiveInstance: TDirective | undefined;

		const destroyed = [];

		let i = commentNodes.length - 1;
		while (i >= 0) {
			const comment = commentNodes[i];
			if (comment.__ngt_renderer__[NgtRendererClassId.destroyed]) {
				destroyed.push(i);
				i--;
				continue;
			}
			const injector = comment.__ngt_renderer__[NgtRendererClassId.debugNodeFactory]?.()?.injector;
			if (!injector) {
				i--;
				continue;
			}
			const instance = injector.get(directive, null);
			if (
				instance &&
				typeof instance === 'object' &&
				'validate' in instance &&
				typeof instance.validate === 'function' &&
				instance.validate()
			) {
				directiveInstance = instance;
				break;
			}
			i--;
		}
		destroyed.forEach((index) => {
			commentNodes.splice(index, 1);
		});
		return directiveInstance;
	}

	addClass = this.delegateRenderer.addClass.bind(this.delegateRenderer);
	removeClass = this.delegateRenderer.removeClass.bind(this.delegateRenderer);
	setStyle = this.delegateRenderer.setStyle.bind(this.delegateRenderer);
	removeStyle = this.delegateRenderer.removeStyle.bind(this.delegateRenderer);
	selectRootElement = this.delegateRenderer.selectRootElement.bind(this.delegateRenderer);
	nextSibling = this.delegateRenderer.nextSibling.bind(this.delegateRenderer);
	setValue = this.delegateRenderer.setValue.bind(this.delegateRenderer);
	removeAttribute = this.delegateRenderer.removeAttribute.bind(this.delegateRenderer);
}
