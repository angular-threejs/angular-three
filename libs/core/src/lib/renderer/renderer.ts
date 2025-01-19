import { DOCUMENT } from '@angular/common';
import {
	inject,
	Injectable,
	Injector,
	Renderer2,
	RendererFactory2,
	RendererType2,
	Type,
	untracked,
} from '@angular/core';
import * as THREE from 'three';
import { NgtArgs } from '../directives/args';
import { NgtCommonDirective } from '../directives/common';
import { NgtParent } from '../directives/parent';
import { getInstanceState, prepare } from '../instance';
import { NgtAnyRecord, NgtConstructorRepresentation, NgtInstanceNode, NgtInstanceState } from '../types';
import { applyProps } from '../utils/apply-props';
import { is } from '../utils/is';
import { injectCatalogue } from './catalogue';
import {
	NGT_CANVAS_CONTENT_FLAG,
	NGT_GET_NODE_ATTRIBUTE_FLAG,
	NGT_INTERNAL_ADD_COMMENT_FLAG,
	NGT_INTERNAL_SET_PARENT_COMMENT_FLAG,
	NGT_RENDERER_NODE_FLAG,
	THREE_NATIVE_EVENTS,
} from './constants';
import {
	addRendererChildNode,
	createRendererNode,
	isRendererNode,
	NgtRendererNode,
	setRendererParentNode,
} from './state';
import { attachThreeNodes, kebabToPascal, NgtRendererClassId } from './utils';

@Injectable()
export class NgtRendererFactory2 implements RendererFactory2 {
	private catalogue = injectCatalogue();
	private document = inject(DOCUMENT);
	private rendererMap = new Map<string, Renderer2>();
	// private portals = new Set<Renderer2>();

	/**
	 * NOTE: We use `useFactory` to instantiate `NgtRendererFactory2`
	 */
	constructor(private delegateRendererFactory: RendererFactory2) {}

	createRenderer(hostElement: any, type: RendererType2 | null): Renderer2 {
		const delegateRenderer = this.delegateRendererFactory.createRenderer(hostElement, type);
		if (!type) return delegateRenderer;

		let renderer = this.rendererMap.get(type.id);

		if (renderer) return renderer;

		if (hostElement && !isRendererNode(hostElement)) {
			createRendererNode('platform', hostElement, this.document);
		}

		this.rendererMap.set(type.id, (renderer = new NgtRenderer2(delegateRenderer, this.catalogue, this.document)));
		return renderer;

		// const isPortal = isRendererNode(hostElement) && hostElement.__ngt_renderer__[NgtRendererClassId.type] === 'portal';
		//
		// const debugNode = hostElement ? new DebugNode(hostElement) : null;
		// let store = debugNode?.injector?.get(NGT_STORE, null, { optional: true }) || null;
		//
		// // if the host element is already a renderer node, it should hav a store
		// if (!store && isRendererNode(hostElement) && hostElement.__ngt_renderer__[NgtRendererClassId.store]) {
		// 	store = hostElement.__ngt_renderer__[NgtRendererClassId.store];
		// }
		//
		// // if there's still no store but there's NGT_MANUAL_INJECTED_STORE (i.e: from NgtRouterOutlet)
		// if (!store && 'type' in type && typeof type.type === 'function' && NGT_MANUAL_INJECTED_STORE in type.type) {
		// 	store = type.type[NGT_MANUAL_INJECTED_STORE] as SignalState<NgtState> | null;
		// }
		//
		// let cacheKey = store ? `${type.id}-${store.snapshot.id}` : type.id;
		// let renderer = !isPortal ? this.rendererMap.get(cacheKey) : null;
		//
		// if (!isRendererNode(hostElement)) {
		// 	renderer = null;
		// }
		//
		// if (!renderer) {
		// 	// detect the entry point of *canvasContent directive
		// 	const hasCanvasContent = (type as any)['consts']?.some((constArr: unknown[]) =>
		// 		constArr.some((item) => item === 'canvasContent'),
		// 	);
		//
		// 	if (!store && !hasCanvasContent) {
		// 		renderer = delegateRenderer;
		// 	} else {
		// 		// NOTE: if we have a store but hostElement isn't a renderer node,
		// 		// this means the element was created in a context outside of NgtCanvas
		// 		// but is _embedded_ in the NgtCanvas context later on via ng-template
		// 		// we'll make the hostElement a RendererNode here
		// 		if (store && hostElement) {
		// 			if (!(NGT_RENDERER_NODE_FLAG in hostElement)) {
		// 				createRendererNode('platform', store, hostElement, this.document);
		// 			}
		//
		// 			const rS = (hostElement as NgtRendererNode).__ngt_renderer__;
		//
		// 			if (!rS[NgtRendererClassId.store]) {
		// 				rS[NgtRendererClassId.store] = store;
		// 			} else if (rS[NgtRendererClassId.store] !== store) {
		// 				// reassign store if it's different
		// 				let resolvedStore = store;
		// 				let shouldReassign = false;
		//
		// 				// check if resolved store has renderer state store as an ancestor
		// 				while (resolvedStore.snapshot.previousRoot) {
		// 					// if it is, then we reassign
		// 					if (resolvedStore.snapshot.previousRoot.snapshot.id === rS[NgtRendererClassId.store].snapshot.id) {
		// 						shouldReassign = true;
		// 						break;
		// 					}
		// 					resolvedStore = resolvedStore.snapshot.previousRoot;
		// 				}
		//
		// 				if (shouldReassign) {
		// 					rS[NgtRendererClassId.store] = store;
		// 				}
		// 			}
		//
		// 			// reassign cache key
		// 			cacheKey = `${type.id}-${rS[NgtRendererClassId.store].snapshot.id}`;
		// 		}
		//
		// 		const removeRenderer = (renderer: Renderer2) => {
		// 			if (isPortal) {
		// 				this.portals.delete(renderer);
		// 			} else {
		// 				const existing = this.rendererMap.get(cacheKey);
		// 				if (existing === renderer) {
		// 					this.rendererMap.delete(cacheKey);
		// 				}
		// 			}
		// 		};
		//
		// 		renderer = new NgtRenderer2(delegateRenderer, this.catalogue, this.document, store, removeRenderer);
		// 	}
		//
		// 	if (isPortal) {
		// 		this.portals.add(renderer);
		// 	} else {
		// 		this.rendererMap.set(cacheKey, renderer);
		// 	}
		// }
		//
		// if ('count' in renderer && typeof renderer.count === 'number') {
		// 	renderer.count += 1;
		// }
		//
		// return renderer;
	}
}

export class NgtRenderer2 implements Renderer2 {
	private argsInjectors: Array<Injector> = [];
	private parentInjectors: Array<Injector> = [];
	private portalInjectors: Array<Injector> = [];

	constructor(
		private delegateRenderer: Renderer2,
		private catalogue: Record<string, NgtConstructorRepresentation>,
		private document: Document,
	) {}

	get data(): { [key: string]: any } {
		return { ...this.delegateRenderer.data, __ngt_renderer__: true };
	}

	destroy(): void {
		// if (this.count > 1) {
		// 	this.count -= 1;
		// 	return;
		// }
		//
		// // this is the last instance of the same NgtRenderer2
		// this.count = 0;
		// this.argsCommentNodes = [];
		// this.parentCommentNodes = [];
		// this.removeRenderer(this);
	}

	createElement(name: string, namespace?: string | null) {
		const platformElement = this.delegateRenderer.createElement(name, namespace);

		// if (!this.store) return platformElement;
		//
		// if (name === 'ngt-portal') {
		// 	return createRendererNode('portal', this.store, platformElement, this.document);
		// }
		//
		const [injectedArgs, injectedParent] = [
			this.getNgtDirective(NgtArgs, this.argsInjectors)?.value || [],
			this.getNgtDirective(NgtParent, this.parentInjectors)?.value,
		];

		const threeName = kebabToPascal(name.startsWith('ngt-') ? name.slice(4) : name);
		const threeTarget = this.catalogue[threeName];
		//
		if (threeTarget) {
			const threeInstance = prepare(new threeTarget(...injectedArgs), name);
			const rendererNode = createRendererNode('three', threeInstance, this.document);
			// assert type here because it is just created so we don't have to null check it
			const instanceState = getInstanceState(threeInstance) as NgtInstanceState;

			// auto-attach for geometry and material
			if (is.geometry(threeInstance)) {
				Object.assign(instanceState, { attach: ['geometry'] });
			} else if (is.material(threeInstance)) {
				instanceState.attach = ['material'];
			}

			if (injectedParent) {
				rendererNode.__ngt_renderer__[NgtRendererClassId.parent] =
					injectedParent as unknown as NgtRendererNode<'three'>;
			}

			return rendererNode;
		}

		return createRendererNode('platform', platformElement, this.document);
	}

	createComment(value: string) {
		const commentNode = this.delegateRenderer.createComment(value);

		const commentRendererNode = createRendererNode('comment', commentNode, this.document);

		// NOTE: we attach an arrow function to the Comment node
		//  In our directives, we can call this function to then start tracking the RendererNode
		//  this is done to limit the amount of Nodes we need to process for getCreationState
		Object.assign(commentRendererNode, {
			[NGT_INTERNAL_ADD_COMMENT_FLAG]: (type: 'args' | 'parent' | 'portal', injector: Injector) => {
				if (type === 'args') {
					this.argsInjectors.push(injector);
				} else if (type === 'parent') {
					Object.assign(commentRendererNode, {
						[NGT_INTERNAL_SET_PARENT_COMMENT_FLAG]: (ngtParent: NgtRendererNode<'three'>) => {
							commentRendererNode.__ngt_renderer__[NgtRendererClassId.parent] = ngtParent;
						},
					});
					this.parentInjectors.push(injector);
				} else if (type === 'portal') {
					this.portalInjectors.push(injector);
				}

				commentRendererNode.__ngt_renderer__[NgtRendererClassId.injector] = injector;
			},
		});

		return commentRendererNode;
	}

	createText(value: string) {
		const textNode = this.delegateRenderer.createText(value);
		return createRendererNode('text', textNode, this.document);
	}

	destroyNode: (node: NgtRendererNode) => void = (node) => {
		const rS = node.__ngt_renderer__;
		if (!rS || rS[NgtRendererClassId.destroyed]) return;

		for (const child of rS[NgtRendererClassId.children].slice()) {
			this.removeChild(node, child);
			this.destroyNode(child);
		}

		// clear out parent if haven't
		rS[NgtRendererClassId.parent] = undefined;
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
		rS[NgtRendererClassId.injector] = undefined;

		if (rS[NgtRendererClassId.type] === 'comment') {
			delete node[NGT_INTERNAL_ADD_COMMENT_FLAG];
			delete node[NGT_INTERNAL_SET_PARENT_COMMENT_FLAG];
		}

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

	appendChild(parent: NgtRendererNode, newChild: NgtRendererNode, refChild?: NgtRendererNode, isMove?: boolean): void {
		const delegatedFn = refChild
			? this.delegateRenderer.insertBefore.bind(this.delegateRenderer, parent, newChild, refChild, isMove)
			: this.delegateRenderer.appendChild.bind(this.delegateRenderer, parent, newChild);

		const pRS = parent.__ngt_renderer__;
		const cRS = newChild.__ngt_renderer__;

		if (!pRS || !cRS) {
			console.warn('[NGT] One of parent or child is not a renderer node.', { parent, newChild });
			return delegatedFn();
		}

		if (cRS[NgtRendererClassId.type] === 'comment') {
			// if chid is a comment, we'll set the parent then bail.
			// comment usually means it's part of a templateRef ViewContainerRef or structural directive
			setRendererParentNode(newChild, parent);

			// if parent is not three, we'll delegate to the renderer
			if (pRS[NgtRendererClassId.type] !== 'three') {
				delegatedFn();
			}

			return;
		}

		if (pRS[NgtRendererClassId.type] === 'platform' && cRS[NgtRendererClassId.type] === 'platform') {
			return delegatedFn();
		}

		if (pRS[NgtRendererClassId.type] === 'three' && cRS[NgtRendererClassId.type] === 'three') {
			console.log('both are three', { parent, newChild });
			return this.appendThreeRendererNodes(parent, newChild);
		}

		if (pRS[NgtRendererClassId.type] === 'platform' && cRS[NgtRendererClassId.type] === 'three') {
			console.log('platform and three', { parent, newChild });

			// if platform has parent, delegate to that parent
			if (pRS[NgtRendererClassId.parent]) {
				return this.appendChild(pRS[NgtRendererClassId.parent], newChild);
			}

			// platform can also have normal parentNode

			// if not, set up parent and child relationship for this pair then bail
			this.setNodeRelationship(parent, newChild);
			return;
		}

		if (pRS[NgtRendererClassId.type] === 'three' && cRS[NgtRendererClassId.type] === 'platform') {
			if (!cRS[NgtRendererClassId.parent]) {
				setRendererParentNode(newChild, parent);
			}

			for (const child of cRS[NgtRendererClassId.children]) {
				this.appendChild(parent, child);
			}

			return;
		}

		// //  if the child is a comment, we'll set the parent then bail
		// if (cRS?.[NgtRendererClassId.type] === 'comment') {
		// 	setRendererParentNode(newChild, parent);
		//
		// 	// reassign store for comment node if it's different than the parent
		// 	if (pRS?.[NgtRendererClassId.store] && cRS[NgtRendererClassId.store] !== pRS[NgtRendererClassId.store]) {
		// 		cRS[NgtRendererClassId.store] = pRS[NgtRendererClassId.store];
		// 	}
		//
		// 	return;
		// }
		//
		// if (cRS?.[NgtRendererClassId.type] === 'three') {
		// 	//  if child is three and parent is platform
		// 	if (pRS?.[NgtRendererClassId.type] === 'platform') {
		// 		// first check if there's a parent on the parent
		// 		const grandParent = pRS[NgtRendererClassId.parent];
		// 		// if there is, we'll recurse with the grandparent
		// 		if (grandParent) {
		// 			return this.appendChild(grandParent, newChild);
		// 		}
		//
		// 		// if not, then we'll set the relationship between these two for later stages
		// 		this.setNodeRelationship(parent, newChild);
		// 		return;
		// 	}
		//
		// 	// if child is three and parent is also three, straight-forward case
		// 	if (pRS?.[NgtRendererClassId.type] === 'three') {
		// 		return this.appendThreeRendererNodes(parent, newChild);
		// 	}
		//
		// 	// if parent is portal
		// 	if (pRS?.[NgtRendererClassId.type] === 'portal') {
		// 		let portalContainer = pRS[NgtRendererClassId.portalContainer];
		// 		if (!portalContainer) {
		// 			// const container = pRS[NgtRendererClassId.store].snapshot.scene;
		// 			// if (!isRendererNode(container)) {
		// 			// 	createRendererNode('three', pRS[NgtRendererClassId.store], container, this.document);
		// 			// }
		// 			//
		// 			// const rendererNode = container as unknown as NgtRendererNode;
		// 			// if (!rendererNode.__ngt_renderer__[NgtRendererClassId.parent]) {
		// 			// 	rendererNode.__ngt_renderer__[NgtRendererClassId.parent] = parent;
		// 			// }
		// 			// portalContainer = pRS[NgtRendererClassId.portalContainer] = rendererNode;
		// 		}
		// 		if (portalContainer) {
		// 			return this.appendChild(portalContainer, newChild);
		// 		}
		//
		// 		// if not, then we'll set the relationship between these two for later stages
		// 		this.setNodeRelationship(parent, newChild);
		// 		return;
		// 	}
		// }
		//
		// if (pRS?.[NgtRendererClassId.type] === 'three') {
		// 	// if parent is three and child is platform
		// 	if (cRS?.[NgtRendererClassId.type] === 'platform') {
		// 		if (!cRS[NgtRendererClassId.parent] || cRS[NgtRendererClassId.parent] !== parent) {
		// 			setRendererParentNode(newChild, parent);
		// 		}
		//
		// 		for (const rendererChildNode of cRS[NgtRendererClassId.children]) {
		// 			this.appendChild(parent, rendererChildNode);
		// 		}
		//
		// 		return;
		// 	}
		//
		// 	if (cRS?.[NgtRendererClassId.type] === 'portal') {
		// 		if (!cRS[NgtRendererClassId.parent] || cRS[NgtRendererClassId.parent] !== parent) {
		// 			setRendererParentNode(newChild, parent);
		// 		}
		// 		return;
		// 	}
		//
		// 	// if parent is three and child is also three, straight-forward case
		// 	if (cRS?.[NgtRendererClassId.type] === 'three') {
		// 		return this.appendThreeRendererNodes(parent, newChild);
		// 	}
		// }
		//
		// if (pRS?.[NgtRendererClassId.type] === 'platform') {
		// 	// if parent is platform, and child is platform
		// 	if (cRS?.[NgtRendererClassId.type] === 'platform') {
		// 		this.setNodeRelationship(parent, newChild);
		// 		this.delegateRenderer.appendChild(parent, newChild);
		//
		// 		const closestAncestorThreeNode = this.findClosestAncestorThreeNode(parent);
		// 		if (closestAncestorThreeNode) this.appendChild(closestAncestorThreeNode, newChild);
		// 		return;
		// 	}
		//
		// 	// if parent is platform and child is portal
		// 	if (cRS?.[NgtRendererClassId.type] === 'portal') {
		// 		this.setNodeRelationship(parent, newChild);
		// 		this.delegateRenderer.appendChild(parent, newChild);
		// 		return;
		// 	}
		// }

		return delegatedFn();
	}

	insertBefore(parent: NgtRendererNode, newChild: NgtRendererNode, refChild: NgtRendererNode, isMove?: boolean): void {
		// if both are comments and the reference child is NgtCanvasContent, we'll assign the same flag to the newChild
		// this means that the NgtCanvas component is embedding. This flag allows the Renderer to get the root scene
		// when it tries to attach the template under `ng-template[canvasContent]`
		if (refChild && refChild[NGT_CANVAS_CONTENT_FLAG] && refChild instanceof Comment && newChild instanceof Comment) {
			Object.assign(newChild, { [NGT_CANVAS_CONTENT_FLAG]: refChild[NGT_CANVAS_CONTENT_FLAG] });
		}

		// if there is no parent, we delegate
		if (!parent) {
			return this.delegateRenderer.insertBefore(parent, newChild, refChild, isMove);
		}

		return this.appendChild(parent, newChild, refChild, isMove);
	}

	removeChild(parent: NgtRendererNode, oldChild: NgtRendererNode, isHostElement?: boolean): void {
		// if (parent === null) {
		// 	parent = this.parentNode(oldChild);
		// }
		//
		// const cRS = (oldChild as NgtRendererNode).__ngt_renderer__;
		//
		// // disassociate things from oldChild
		// cRS[NgtRendererClassId.parent] = null;
		//
		// // if parent is still undefined
		// if (parent == null) {
		// 	if (cRS[NgtRendererClassId.destroyed]) {
		// 		// if the child is already destroyed, just skip
		// 		return;
		// 	}
		// 	console.warn('[NGT] parent is not found when remove child', { parent, oldChild });
		// 	return;
		// }
		//
		// const pRS = (parent as NgtRendererNode).__ngt_renderer__;
		// const childIndex = pRS[NgtRendererClassId.children].indexOf(oldChild);
		// if (childIndex >= 0) {
		// 	// disassociate oldChild from parent children
		// 	pRS[NgtRendererClassId.children].splice(childIndex, 1);
		// }
		//
		// if (pRS[NgtRendererClassId.type] === 'three') {
		// 	if (cRS[NgtRendererClassId.type] === 'three') {
		// 		return removeThreeChild(oldChild, parent, true);
		// 	}
		//
		// 	if (cRS[NgtRendererClassId.type] === 'platform') {
		// 		return;
		// 	}
		// }
		//
		// if (pRS[NgtRendererClassId.type] === 'platform') {
		// 	if (cRS[NgtRendererClassId.type] === 'three') {
		// 		return;
		// 	}
		//
		// 	if (cRS[NgtRendererClassId.type] === 'platform') {
		// 		return this.delegateRenderer.removeChild(parent, oldChild, isHostElement);
		// 	}
		// }
		//
		// if (pRS[NgtRendererClassId.type] === 'portal') {
		// 	const portalContainer = pRS[NgtRendererClassId.portalContainer];
		// 	if (portalContainer) {
		// 		return this.removeChild(portalContainer, oldChild, isHostElement);
		// 	}
		// }

		return this.delegateRenderer.removeChild(parent, oldChild, isHostElement);
	}

	parentNode(node: NgtRendererNode) {
		if (node && node[NGT_CANVAS_CONTENT_FLAG] && node instanceof Comment && isRendererNode(node)) {
			const store = node[NGT_CANVAS_CONTENT_FLAG];

			// this should not happen but if it does, we'll delegate to the renderer
			if (!store) {
				return this.delegateRenderer.parentNode(node);
			}

			const rootScene = store.snapshot.scene;

			// if we don't have the scene yet, bail again
			if (!rootScene) {
				return this.delegateRenderer.parentNode(node);
			}

			// if root scene is not a renderer node, we'll make it a renderer node here
			if (!(NGT_RENDERER_NODE_FLAG in rootScene)) {
				const sceneRendererNode = createRendererNode('three', rootScene, this.document);
				// set parent to the comment too
				setRendererParentNode(node, sceneRendererNode);
			}

			return rootScene;
		}

		const rendererParentNode = node.__ngt_renderer__[NgtRendererClassId.parent];
		// returns the renderer parent node if it exists, otherwise returns the delegateRenderer parentNode
		return rendererParentNode ?? this.delegateRenderer.parentNode(node);
	}

	setAttribute(el: NgtRendererNode, name: string, value: string, namespace?: string | null): void {
		// const rS = (el as NgtRendererNode).__ngt_renderer__;
		// if (!rS) return this.delegateRenderer.setAttribute(el, name, value, namespace);
		//
		// if (rS[NgtRendererClassId.destroyed]) {
		// 	console.warn(`[NGT] setAttribute is invoked on destroyed renderer node.`, { el, name, value });
		// 	return;
		// }
		//
		// if (rS[NgtRendererClassId.type] === 'three') {
		// 	if (name === 'attach') {
		// 		const paths = value.split('.');
		// 		if (paths.length) {
		// 			const instanceState = getInstanceState(el);
		// 			if (instanceState) instanceState.attach = paths;
		// 		}
		// 	} else {
		// 		// coercion for primitive values
		// 		let maybeCoerced: string | number | boolean = value;
		//
		// 		if (maybeCoerced === '' || maybeCoerced === 'true' || maybeCoerced === 'false') {
		// 			maybeCoerced = maybeCoerced === 'true' || maybeCoerced === '';
		// 		} else {
		// 			const maybeNumber = Number(maybeCoerced);
		// 			if (!isNaN(maybeNumber)) maybeCoerced = maybeNumber;
		// 		}
		//
		// 		if (name === 'rawValue') {
		// 			rS[NgtRendererClassId.rawValue] = maybeCoerced;
		// 		} else {
		// 			applyProps(el, { [name]: maybeCoerced });
		// 		}
		// 	}
		//
		// 	return;
		// }

		return this.delegateRenderer.setAttribute(el, name, value, namespace);
	}

	setProperty(el: NgtRendererNode, name: string, value: any): void {
		const rS = el.__ngt_renderer__;

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

			if (instanceState && name === 'geometry' && value.isBufferGeometry) {
				instanceState.updateGeometryStamp();
			}

			return;
		}

		return this.delegateRenderer.setProperty(el, name, value);
	}

	listen(
		target: 'window' | 'document' | 'body' | NgtRendererNode,
		eventName: string,
		callback: (event: any) => boolean | void,
	): () => void {
		if (typeof target === 'string') {
			return this.delegateRenderer.listen(target, eventName, callback);
		}

		const rS = target.__ngt_renderer__;
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
				if (parent) iS.onAttach({ parent, node: target as unknown as NgtInstanceNode });
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

				if ((target as unknown as THREE.Object3D).parent && (eventName === 'added' || eventName === 'removed')) {
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
				let root = iS.store!;
				while (root.snapshot.previousRoot) {
					root = root.snapshot.previousRoot;
				}

				if (root.snapshot.internal) {
					root.snapshot.internal.interaction.push(target as unknown as THREE.Object3D);
				}
			}

			// clean up the event listener by removing the target from the interaction array
			return () => {
				const iS = getInstanceState(target);
				if (iS) {
					iS.eventCount -= 1;
					let root = iS.store!;
					while (root.snapshot.previousRoot) {
						root = root.snapshot.previousRoot;
					}

					if (root.snapshot.internal) {
						const interactions = root.snapshot.internal.interaction;
						const index = interactions.findIndex((obj) => obj.uuid === (target as unknown as THREE.Object3D).uuid);
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

	private appendThreeRendererNodes(parent: NgtRendererNode, child: NgtRendererNode) {
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
		attachThreeNodes(parent as unknown as NgtInstanceNode, child as unknown as NgtInstanceNode);
		return;
	}

	private setNodeRelationship(parent: NgtRendererNode, child: NgtRendererNode) {
		setRendererParentNode(child, parent);
		addRendererChildNode(parent, child);
	}

	private getNgtDirective<TDirective extends NgtCommonDirective<any>>(
		directive: Type<TDirective>,
		injectors: Array<Injector>,
	) {
		let directiveInstance: TDirective | undefined;

		let i = injectors.length - 1;
		while (i >= 0) {
			const injector = injectors[i];
			const instance = injector.get(directive, null);
			if (instance && typeof instance === 'object' && instance.validate()) {
				directiveInstance = instance;
				break;
			}
			i--;
		}

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
