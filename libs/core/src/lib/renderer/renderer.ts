import { DOCUMENT } from '@angular/common';
import {
	inject,
	Injectable,
	InjectionToken,
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
import { NgtConstructorRepresentation, NgtEventHandlers, NgtInstanceNode, NgtInstanceState } from '../types';
import { applyProps } from '../utils/apply-props';
import { is } from '../utils/is';
import { injectCatalogue } from './catalogue';
import {
	NGT_CANVAS_CONTENT_FLAG,
	NGT_DELEGATE_RENDERER_DESTROY_NODE_PATCHED_FLAG,
	NGT_DOM_PARENT_FLAG,
	NGT_HTML_FLAG,
	NGT_INTERNAL_ADD_COMMENT_FLAG,
	NGT_INTERNAL_SET_PARENT_COMMENT_FLAG,
	NGT_PORTAL_CONTENT_FLAG,
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
import { attachThreeNodes, internalDestroyNode, kebabToPascal, NgtRendererClassId, removeThreeChild } from './utils';

export interface NgtRendererFactory2Options {
	verbose?: boolean;
}

export const NGT_RENDERER_OPTIONS = new InjectionToken<NgtRendererFactory2Options>('NGT_RENDERER_OPTIONS');

@Injectable()
export class NgtRendererFactory2 implements RendererFactory2 {
	private catalogue = injectCatalogue();
	private document = inject(DOCUMENT);
	private options = inject(NGT_RENDERER_OPTIONS, { optional: true }) || {};
	private rendererMap = new Map<string, Renderer2>();

	/**
	 * NOTE: We use `useFactory` to instantiate `NgtRendererFactory2`
	 */
	constructor(private delegateRendererFactory: RendererFactory2) {}

	createRenderer(hostElement: any, type: RendererType2 | null): Renderer2 {
		const delegateRenderer = this.delegateRendererFactory.createRenderer(hostElement, type);
		if (!type) return delegateRenderer;

		let renderer = this.rendererMap.get(type.id);
		if (renderer) {
			if (renderer instanceof NgtRenderer2) {
				renderer.count += 1;
				if (renderer.delegateRenderer !== delegateRenderer) {
					renderer.delegateRenderer = delegateRenderer;
				}
			}
			return renderer;
		}

		if (hostElement && !isRendererNode(hostElement)) {
			createRendererNode('platform', hostElement, this.document);
		}

		if (Reflect.get(type, 'type')?.[NGT_HTML_FLAG]) {
			this.rendererMap.set(type.id, delegateRenderer);

			// patch delegate destroyNode so we can destroy this HTML node
			// TODO: make sure we really need to do this
			const originalDestroyNode = delegateRenderer.destroyNode?.bind(delegateRenderer);
			if (!originalDestroyNode || !(NGT_DELEGATE_RENDERER_DESTROY_NODE_PATCHED_FLAG in originalDestroyNode)) {
				delegateRenderer.destroyNode = (node) => {
					originalDestroyNode?.(node);
					if (node !== hostElement) return;
					internalDestroyNode(node, null);
				};
				Object.assign(delegateRenderer.destroyNode, {
					[NGT_DELEGATE_RENDERER_DESTROY_NODE_PATCHED_FLAG]: true,
				});
			}

			return delegateRenderer;
		}

		this.rendererMap.set(
			type.id,
			(renderer = new NgtRenderer2(delegateRenderer, this.catalogue, this.document, this.options)),
		);
		return renderer;
	}
}

export class NgtRenderer2 implements Renderer2 {
	private argsInjectors: Array<Injector> = [];
	private parentInjectors: Array<Injector> = [];

	constructor(
		public delegateRenderer: Renderer2,
		private catalogue: Record<string, NgtConstructorRepresentation>,
		private document: Document,
		private options: NgtRendererFactory2Options,
		public count = 1,
	) {
		if (!this.options.verbose) {
			this.options.verbose = false;
		}
	}

	get data(): { [key: string]: any } {
		return { ...this.delegateRenderer.data, __ngt_renderer__: true };
	}

	destroy(): void {
		if (this.count > 1) {
			this.count -= 1;
			return;
		}

		// this is the last instance of the same NgtRenderer2
		this.count = 0;
		this.argsInjectors = [];
		this.parentInjectors = [];
	}

	createElement(name: string, namespace?: string | null) {
		const platformElement = this.delegateRenderer.createElement(name, namespace);

		if (name === 'ngt-portal') {
			return createRendererNode('portal', platformElement, this.document);
		}

		if (name === 'ngt-value') {
			return createRendererNode('three', prepare(platformElement, 'ngt-value'), this.document);
		}

		const [injectedArgs, injectedParent] = [
			this.getNgtDirective(NgtArgs, this.argsInjectors)?.value || [],
			this.getNgtDirective(NgtParent, this.parentInjectors)?.value,
		];

		if (name === 'ngt-primitive') {
			if (!injectedArgs[0]) throw new Error(`[NGT] ngt-primitive without args is invalid`);
			const object = injectedArgs[0];
			let instanceState = getInstanceState(object);
			if (!instanceState || instanceState.type !== 'ngt-primitive') {
				// if an object isn't already "prepared", we'll prepare it
				prepare(object, 'ngt-primitive', instanceState);
			}

			const primitiveRendererNode = createRendererNode('three', object, this.document);
			if (injectedParent) {
				primitiveRendererNode.__ngt_renderer__[NgtRendererClassId.parent] =
					injectedParent as unknown as NgtRendererNode<'three'>;
			}

			return primitiveRendererNode;
		}

		if (!name.startsWith('ngt-')) {
			return createRendererNode('platform', platformElement, this.document);
		}

		const threeName = kebabToPascal(name.startsWith('ngt-') ? name.slice(4) : name);
		let threeTarget = this.catalogue[threeName];

		if (!threeTarget && threeName in THREE) {
			const threeSymbol = THREE[threeName as keyof typeof THREE];
			if (typeof threeSymbol === 'function') {
				// we will attempt to prefill the catalogue with symbols from THREE
				threeTarget = this.catalogue[threeName] = threeSymbol as NgtConstructorRepresentation;
			}
		}

		if (threeTarget) {
			const threeInstance = prepare(new threeTarget(...injectedArgs), name);
			const rendererNode = createRendererNode('three', threeInstance, this.document);
			// assert type here because it is just created so we don't have to null check it
			const instanceState = getInstanceState(threeInstance) as NgtInstanceState;

			// auto-attach for geometry and material
			if (is.three<THREE.BufferGeometry>(threeInstance, 'isBufferGeometry')) {
				instanceState.attach = ['geometry'];
			} else if (is.three<THREE.Material>(threeInstance, 'isMaterial')) {
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
			[NGT_INTERNAL_ADD_COMMENT_FLAG]: (type: 'args' | 'parent', injector: Injector) => {
				if (type === 'args') {
					this.argsInjectors.push(injector);
				} else if (type === 'parent') {
					Object.assign(commentRendererNode, {
						[NGT_INTERNAL_SET_PARENT_COMMENT_FLAG]: (ngtParent: NgtRendererNode<'three'>) => {
							commentRendererNode.__ngt_renderer__[NgtRendererClassId.parent] = ngtParent;
						},
					});
					this.parentInjectors.push(injector);
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
		internalDestroyNode(node, this.removeChild.bind(this));
	};

	appendChild(
		parent: NgtRendererNode,
		newChild: NgtRendererNode,
		refChild?: NgtRendererNode,
		isMove?: boolean,
	): void {
		const delegatedFn = refChild
			? this.delegateRenderer.insertBefore.bind(this.delegateRenderer, parent, newChild, refChild, isMove)
			: this.delegateRenderer.appendChild.bind(this.delegateRenderer, parent, newChild);

		const pRS = parent.__ngt_renderer__;
		const cRS = newChild.__ngt_renderer__;

		if (!pRS || !cRS) {
			this.options.verbose &&
				console.warn('[NGT dev mode] One of parent or child is not a renderer node.', { parent, newChild });
			return delegatedFn();
		}

		if (cRS[NgtRendererClassId.type] === 'comment') {
			// if child is a comment, we'll set the parent then bail.
			// comment usually means it's part of a templateRef ViewContainerRef or structural directive
			setRendererParentNode(newChild, parent);

			// if parent is not three, we'll delegate to the renderer
			if (pRS[NgtRendererClassId.type] !== 'three') {
				delegatedFn();
			}

			return;
		}

		if (pRS[NgtRendererClassId.type] === 'platform' && cRS[NgtRendererClassId.type] === 'platform') {
			if (newChild[NGT_DOM_PARENT_FLAG] && newChild[NGT_DOM_PARENT_FLAG] instanceof HTMLElement) {
				return this.delegateRenderer.appendChild(newChild[NGT_DOM_PARENT_FLAG], newChild);
			}

			if (pRS[NgtRendererClassId.parent] && !cRS[NgtRendererClassId.parent]) {
				return this.appendChild(pRS[NgtRendererClassId.parent], newChild);
			}

			return delegatedFn();
		}

		if (pRS[NgtRendererClassId.type] === 'three' && cRS[NgtRendererClassId.type] === 'three') {
			return this.appendThreeRendererNodes(parent, newChild);
		}

		if (pRS[NgtRendererClassId.type] === 'platform' && cRS[NgtRendererClassId.type] === 'three') {
			// if platform has parent, delegate to that parent
			if (pRS[NgtRendererClassId.parent]) {
				// but track the child for this parent as well
				addRendererChildNode(parent, newChild);
				return this.appendChild(pRS[NgtRendererClassId.parent], newChild);
			}

			// platform can also have normal parentNode
			const platformParentNode = this.delegateRenderer.parentNode(parent);
			if (platformParentNode) {
				return this.appendChild(platformParentNode, newChild);
			}

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

			for (const platformChildNode of newChild['childNodes'] || []) {
				if (
					!isRendererNode(platformChildNode) ||
					platformChildNode.__ngt_renderer__[NgtRendererClassId.type] !== 'platform'
				)
					continue;
				this.appendChild(parent, platformChildNode);
			}

			return;
		}

		if (pRS[NgtRendererClassId.type] === 'portal' && cRS[NgtRendererClassId.type] === 'three') {
			if (!cRS[NgtRendererClassId.parent] && pRS[NgtRendererClassId.portalContainer]) {
				return this.appendChild(pRS[NgtRendererClassId.portalContainer], newChild);
			}
			return;
		}

		if (pRS[NgtRendererClassId.type] === 'platform' && cRS[NgtRendererClassId.type] === 'portal') {
			return this.delegateRenderer.appendChild(parent, newChild);
		}

		return delegatedFn();
	}

	insertBefore(
		parent: NgtRendererNode,
		newChild: NgtRendererNode,
		refChild: NgtRendererNode,
		isMove?: boolean,
	): void {
		// if both are comments and the reference child is NgtCanvasContent, we'll assign the same flag to the newChild
		// this means that the NgtCanvas component is embedding. This flag allows the Renderer to get the root scene
		// when it tries to attach the template under `ng-template[canvasContent]`
		if (
			refChild &&
			refChild[NGT_CANVAS_CONTENT_FLAG] &&
			refChild instanceof Comment &&
			newChild instanceof Comment
		) {
			Object.assign(newChild, { [NGT_CANVAS_CONTENT_FLAG]: refChild[NGT_CANVAS_CONTENT_FLAG] });
		}

		// if there is no parent, we delegate
		if (!parent) {
			return this.delegateRenderer.insertBefore(parent, newChild, refChild, isMove);
		}

		return this.appendChild(parent, newChild, refChild, isMove);
	}

	removeChild(parent: NgtRendererNode, oldChild: NgtRendererNode, isHostElement?: boolean): void {
		if (parent === null) {
			parent = this.parentNode(oldChild);
		}

		const cRS = oldChild.__ngt_renderer__;

		if (!cRS) {
			try {
				return this.delegateRenderer.removeChild(parent, oldChild, isHostElement);
			} catch {
				return;
			}
		}

		// disassociate things from oldChild
		cRS[NgtRendererClassId.parent] = null;

		// if parent is still undefined
		if (parent == null) {
			if (cRS[NgtRendererClassId.destroyed]) {
				// if the child is already destroyed, just skip
				return;
			}
			this.options.verbose &&
				console.warn('[NGT dev mode] parent is not found when remove child', { parent, oldChild });
			return;
		}

		const pRS = parent.__ngt_renderer__;

		if (!pRS) {
			return this.delegateRenderer.removeChild(parent, oldChild, isHostElement);
		}

		const childIndex = pRS[NgtRendererClassId.children].indexOf(oldChild);
		if (childIndex >= 0) {
			// disassociate oldChild from parent children
			pRS[NgtRendererClassId.children].splice(childIndex, 1);
		}

		if (pRS[NgtRendererClassId.type] === 'three' && cRS[NgtRendererClassId.type] === 'three') {
			return removeThreeChild(oldChild as unknown as NgtInstanceNode, parent as unknown as NgtInstanceNode, true);
		}

		if (pRS[NgtRendererClassId.type] === 'platform' && cRS[NgtRendererClassId.type] === 'platform') {
			return this.delegateRenderer.removeChild(parent, oldChild, isHostElement);
		}

		if (pRS[NgtRendererClassId.type] === 'three' && cRS[NgtRendererClassId.type] === 'platform') {
			return;
		}

		if (pRS[NgtRendererClassId.type] === 'platform' && cRS[NgtRendererClassId.type] === 'three') {
			const childLS = getInstanceState(oldChild);
			if (!childLS) return;

			const threeParent = childLS.parent ? untracked(childLS.parent) : null;
			if (!threeParent) return;

			return this.removeChild(threeParent as unknown as NgtRendererNode, oldChild);
		}

		return this.delegateRenderer.removeChild(parent, oldChild, isHostElement);
	}

	parentNode(node: NgtRendererNode) {
		if (
			node &&
			(node[NGT_CANVAS_CONTENT_FLAG] || node[NGT_PORTAL_CONTENT_FLAG]) &&
			node instanceof Comment &&
			isRendererNode(node)
		) {
			const store = node[NGT_CANVAS_CONTENT_FLAG] || node[NGT_PORTAL_CONTENT_FLAG];

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

			if (
				node[NGT_PORTAL_CONTENT_FLAG] &&
				node[NGT_DOM_PARENT_FLAG] &&
				isRendererNode(node[NGT_DOM_PARENT_FLAG])
			) {
				const portalContentParent = node[NGT_DOM_PARENT_FLAG] as NgtRendererNode<'portal'>;
				const portalContentParentRS = portalContentParent.__ngt_renderer__;
				if (!portalContentParentRS[NgtRendererClassId.portalContainer]) {
					portalContentParentRS[NgtRendererClassId.portalContainer] = rootScene;
				}
			}

			return rootScene;
		}

		const rendererParentNode = node.__ngt_renderer__?.[NgtRendererClassId.parent];
		// returns the renderer parent node if it exists, otherwise returns the delegateRenderer parentNode
		return rendererParentNode ?? this.delegateRenderer.parentNode(node);
	}

	removeAttribute(el: NgtRendererNode, name: string, namespace?: string | null): void {
		const rS = el.__ngt_renderer__;
		if (!rS || rS[NgtRendererClassId.destroyed]) return this.delegateRenderer.removeAttribute(el, name, namespace);

		if (rS[NgtRendererClassId.type] === 'three') {
			return;
		}
		return this.delegateRenderer.removeAttribute(el, name, namespace);
	}

	setAttribute(el: NgtRendererNode, name: string, value: string, namespace?: string | null): void {
		const rS = el.__ngt_renderer__;
		if (!rS) return this.delegateRenderer.setAttribute(el, name, value, namespace);

		if (rS[NgtRendererClassId.destroyed]) {
			this.options.verbose &&
				console.warn(`[NGT dev mode] setAttribute is invoked on destroyed renderer node.`, { el, name, value });
			return;
		}

		if (rS[NgtRendererClassId.type] === 'three') {
			if (name === 'attach') {
				const paths = value.split('.');
				if (paths.length) {
					const instanceState = getInstanceState(el);
					if (instanceState) instanceState.attach = paths;
				}
				return;
			}

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

			return;
		}

		return this.delegateRenderer.setAttribute(el, name, value, namespace);
	}

	setProperty(el: NgtRendererNode, name: string, value: any): void {
		// NOTE: untrack all signal updates because this is during setProperty which is a reactive context
		// attaching potentially updates signals which is not allowed

		const rS = el.__ngt_renderer__;

		if (!rS || rS[NgtRendererClassId.destroyed]) {
			this.options.verbose &&
				console.warn('[NGT dev mode] setProperty is invoked on destroyed renderer node.', { el, name, value });
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

				if ('geometry' in value && is.three<THREE.BufferGeometry>(value['geometry'], 'isBufferGeometry')) {
					untracked(() => {
						instanceState?.updateGeometryStamp();
					});
				}

				return;
			}

			const parent = instanceState?.hierarchyStore.snapshot.parent || rS[NgtRendererClassId.parent];

			// [rawValue]
			if (instanceState?.type === 'ngt-value' && name === 'rawValue') {
				rS[NgtRendererClassId.rawValue] = value;
				if (parent) {
					untracked(() => attachThreeNodes(parent, el as unknown as NgtInstanceNode));
				}
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
				if (parent) {
					untracked(() => attachThreeNodes(parent, el as unknown as NgtInstanceNode));
				}

				return;
			}

			// NOTE: short-cut for null raycast to prevent upstream from creating a nullRaycast property
			if (name === 'raycast' && value === null) {
				value = () => null;
			}

			applyProps(el, { [name]: value });

			if (instanceState && name === 'geometry' && is.three<THREE.BufferGeometry>(value, 'isBufferGeometry')) {
				untracked(() => {
					instanceState.updateGeometryStamp();
				});
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
				console.warn(
					'[NGT] instance which has not been prepared cannot have events. Call `prepare()` manually if needed.',
				);
				return () => {};
			}

			if (eventName === 'created') {
				callback(target);
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

				if (
					(target as unknown as THREE.Object3D).parent &&
					(eventName === 'added' || eventName === 'removed')
				) {
					callback({ type: eventName, target });
				}

				target.addEventListener(eventName, callback);
				return () => {
					target.removeEventListener(eventName, callback);
				};
			}

			const cleanup = iS.setPointerEvent?.(eventName as keyof NgtEventHandlers, callback) || (() => {});

			// this means the object has already been attached to the parent and has its store propagated
			if (iS.store) {
				iS.addInteraction?.(iS.store);
			}

			return cleanup;
		}

		return this.delegateRenderer.listen(target, eventName, callback);
	}

	private appendThreeRendererNodes(parent: NgtRendererNode, child: NgtRendererNode) {
		// if parent and child are the same, skip
		if (parent === child) {
			this.options.verbose &&
				console.warn('[NGT dev mode] appending THREE.js parent and child but they are the same', {
					parent,
					child,
				});
			return;
		}

		const cIS = getInstanceState(child);

		// if child is already attached to a parent, skip
		if (cIS?.hierarchyStore.snapshot.parent) {
			this.options.verbose &&
				console.warn('[NGT dev mode] appending THREE.js parent and child but child is already attached', {
					parent,
					child,
				});
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
}
