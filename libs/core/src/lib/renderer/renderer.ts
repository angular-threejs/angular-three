import {
	DOCUMENT,
	inject,
	Injectable,
	InjectionToken,
	Injector,
	Renderer2,
	RendererFactory2,
	RendererStyleFlags2,
	RendererType2,
	Type,
	untracked,
} from '@angular/core';
import * as THREE from 'three';
import { NgtArgs } from '../directives/args';
import { NgtCommonDirective } from '../directives/common';
import { NgtParent } from '../directives/parent';
import { flushAncestorNotifications, getInstanceState, prepare } from '../instance';
import {
	NgtAttachable,
	NgtConstructorRepresentation,
	NgtEventHandlers,
	NgtInstanceNode,
	NgtInstanceState,
	NgtState,
} from '../types';
import { applyProps } from '../utils/apply-props';
import { is } from '../utils/is';
import type { SignalState } from '../utils/signal-state';
import { injectCatalogue } from './catalogue';
import { NGT_DOM_PARENT_FLAG, NGT_HTML_FLAG, NGT_RENDERER_CONTEXT_FLAG, THREE_NATIVE_EVENTS } from './constants';
import {
	createRendererNode,
	getRendererAnchor,
	getRendererNextSibling,
	insertRendererChildNode,
	isRendererNode,
	isRendererNodeType,
	markRendererViewHost,
	NgtRendererClassId,
	NgtRendererNode,
	releaseRendererOwner,
	removeRendererChildNode,
	setRendererAnchor,
} from './state';
import { attachThreeNodes, internalDestroyNode, kebabToPascal, removeThreeChild } from './utils';

/**
 * Configuration options for the Angular Three renderer factory.
 */
export interface NgtRendererFactory2Options {
	/**
	 * Enable verbose logging for debugging renderer operations.
	 * @default false
	 */
	verbose?: boolean;
	/**
	 * @deprecated Ancestor notifications are now deterministically coalesced once per microtask.
	 * This option is retained for source compatibility and no longer changes runtime behavior.
	 */
	maxNotificationSkipCount?: number;
}

/**
 * Injection token for renderer factory options.
 */
export const NGT_RENDERER_OPTIONS = new InjectionToken<NgtRendererFactory2Options>('NGT_RENDERER_OPTIONS');

/**
 * Angular's public RendererType2 intentionally omits the component constructor. The runtime
 * renderer type currently carries it as `type`; keep that private Angular dependency isolated
 * here so upgrades have one compatibility seam to verify.
 */
function isNgtHTMLRendererType(type: RendererType2) {
	return !!Reflect.get(type, 'type')?.[NGT_HTML_FLAG];
}

/**
 * Angular renderer factory for Three.js elements.
 *
 * This factory creates NgtRenderer2 instances for components that use Angular Three.
 * It intercepts Angular's rendering operations and translates them to Three.js object
 * creation and manipulation.
 *
 * The factory is typically provided via `provideNgtRenderer()` in your application config.
 *
 * @example
 * ```typescript
 * // In app.config.ts
 * import { provideNgtRenderer } from 'angular-three/dom';
 *
 * export const appConfig: ApplicationConfig = {
 *   providers: [provideNgtRenderer()]
 * };
 * ```
 */
@Injectable()
export class NgtRendererFactory2 implements RendererFactory2 {
	private catalogue = injectCatalogue();
	private document = inject(DOCUMENT);
	private options = inject(NGT_RENDERER_OPTIONS, { optional: true }) || {};
	private rendererByDelegate = new WeakMap<Renderer2, NgtRenderer2>();
	/**
	 * NOTE: We use `useFactory` to instantiate `NgtRendererFactory2`
	 */
	constructor(private delegateRendererFactory: RendererFactory2) {}

	createRenderer(hostElement: any, type: RendererType2 | null): Renderer2 {
		const delegateRenderer = this.delegateRendererFactory.createRenderer(hostElement, type);
		if (!type) return delegateRenderer;
		if (isNgtHTMLRendererType(type)) return delegateRenderer;

		if (hostElement) {
			let hostRendererNode: NgtRendererNode;
			if (isRendererNode(hostElement)) {
				hostRendererNode = hostElement;
			} else {
				const logicalParent = delegateRenderer.parentNode(hostElement);
				hostRendererNode = createRendererNode('platform', hostElement, this.document);
				if (isRendererNode(logicalParent)) {
					insertRendererChildNode(logicalParent, hostRendererNode);
				}
			}
			markRendererViewHost(hostRendererNode);
		}

		let renderer = this.rendererByDelegate.get(delegateRenderer);
		if (!renderer) {
			renderer = new NgtRenderer2(delegateRenderer, this.catalogue, this.document, this.options);
			this.rendererByDelegate.set(delegateRenderer, renderer);
		}
		return renderer;
	}

	begin() {
		this.delegateRendererFactory.begin?.();
	}

	end() {
		flushAncestorNotifications();
		this.delegateRendererFactory.end?.();
	}

	whenRenderingDone() {
		return this.delegateRendererFactory.whenRenderingDone?.() ?? Promise.resolve();
	}
}

/**
 * Custom Angular renderer for Three.js elements.
 *
 * This renderer intercepts Angular's DOM operations and translates them to Three.js
 * object manipulations. It handles:
 * - Element creation (converting ngt-* elements to Three.js objects)
 * - Property/attribute setting (applying props to Three.js objects)
 * - Event listening (setting up Three.js event handlers)
 * - Parent-child relationships (managing the Three.js scene graph)
 *
 * @internal
 */
export class NgtRenderer2 implements Renderer2 {
	private directiveInjectors: Injector[] = [];
	private parameterKeys = new WeakMap<NgtRendererNode<'three'>, Set<string>>();
	private attachedListeners = new WeakMap<
		NgtRendererNode<'three'>,
		{ listeners: Map<symbol, (event: any) => void>; dispatch: (event: any) => void }
	>();
	private updatedListeners = new WeakMap<
		NgtRendererNode<'three'>,
		{ listeners: Map<symbol, (event: any) => void>; dispatch: (event: any) => void }
	>();
	readonly data: { [key: string]: any };

	constructor(
		public delegateRenderer: Renderer2,
		private catalogue: Record<string, NgtConstructorRepresentation>,
		private document: Document,
		private options: NgtRendererFactory2Options,
	) {
		this.data = { ...this.delegateRenderer.data, __ngt_renderer__: true };
		if (!this.options.verbose) {
			this.options.verbose = false;
		}
	}

	destroy(): void {
		this.delegateRenderer.destroy();
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
			this.getNgtDirective(NgtArgs)?.value || [],
			this.getNgtDirective(NgtParent)?.value,
		];

		if (name === 'ngt-primitive') {
			if (!injectedArgs[0]) throw new Error(`[NGT] ngt-primitive without args is invalid`);
			const object = injectedArgs[0];

			if (getInstanceState(object)) {
				delete object['__ngt__'];
			}

			prepare(object, 'ngt-primitive');

			const primitiveRendererNode = createRendererNode('three', object, this.document);
			if (injectedParent) {
				primitiveRendererNode.__ngt_renderer__[NgtRendererClassId.parentOverride] =
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
				rendererNode.__ngt_renderer__[NgtRendererClassId.parentOverride] =
					injectedParent as unknown as NgtRendererNode<'three'>;
			}

			return rendererNode;
		}

		return createRendererNode('platform', platformElement, this.document);
	}

	createComment(value: string) {
		const commentNode = this.delegateRenderer.createComment(value);
		const commentRendererNode = createRendererNode('comment', commentNode, this.document);
		return commentRendererNode;
	}

	createText(value: string) {
		const textNode = this.delegateRenderer.createText(value);
		return createRendererNode('text', textNode, this.document);
	}

	destroyNode(node: NgtRendererNode) {
		const shouldDelegate = !isRendererNode(node) || node.__ngt_renderer__[NgtRendererClassId.type] !== 'three';
		if (isRendererNode(node)) {
			this.destroyOwnedNodes(node);
			// Unlink from the owner's set but retain the owner marker until recursive
			// destruction has used it to protect foreign/projected descendants.
			releaseRendererOwner(node, false);
		}
		internalDestroyNode(node, this.removeChild.bind(this));
		if (shouldDelegate) this.delegateRenderer.destroyNode?.(node);
	}

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
		if (parent === newChild || refChild === newChild) return;

		this.setNodeRelationship(parent, newChild, refChild);

		if (cRS[NgtRendererClassId.type] === 'comment') {
			// A comment is a logical anchor. It remains in the ordered host tree even when
			// the physical Three graph has no corresponding node.
			// comment usually means it's part of a templateRef ViewContainerRef or structural directive
			// if parent is not three, we'll delegate to the renderer
			if (pRS[NgtRendererClassId.type] !== 'three') {
				delegatedFn();
			}

			return;
		}

		if (pRS[NgtRendererClassId.type] === 'platform' && cRS[NgtRendererClassId.type] === 'platform') {
			const threeParent = this.findNearestThreeParent(parent);
			const portalStore = this.findNearestPortalStore(parent);
			const insertionReference = threeParent
				? this.findThreeReferenceAfterLogicalNode(threeParent, newChild)
				: null;
			if (newChild[NGT_DOM_PARENT_FLAG]) {
				this.delegateRenderer.appendChild(newChild[NGT_DOM_PARENT_FLAG], newChild);
			} else {
				delegatedFn();
			}

			if (threeParent) this.attachThreeDescendants(threeParent, newChild, insertionReference, portalStore);
			return;
		}

		if (isRendererNodeType(parent, 'three') && isRendererNodeType(newChild, 'three')) {
			return this.appendThreeRendererNodes(parent, newChild, refChild);
		}

		if (pRS[NgtRendererClassId.type] === 'platform' && isRendererNodeType(newChild, 'three')) {
			const threeParent = this.findNearestThreeParent(parent);
			if (threeParent) {
				this.appendThreeRendererNodes(threeParent, newChild, refChild, this.findNearestPortalStore(parent));
			}
			return;
		}

		if (
			isRendererNodeType(parent, 'three') &&
			(cRS[NgtRendererClassId.type] === 'platform' ||
				cRS[NgtRendererClassId.type] === 'portal' ||
				cRS[NgtRendererClassId.type] === 'text')
		) {
			if (isRendererNodeType(newChild, 'platform')) this.attachThreeDescendants(parent, newChild);
			return;
		}

		if (isRendererNodeType(parent, 'portal') && isRendererNodeType(newChild, 'three')) {
			const portalContainer = parent.__ngt_renderer__[NgtRendererClassId.portalContainer];
			if (portalContainer)
				return this.appendThreeRendererNodes(portalContainer, newChild, refChild, this.portalStore(parent));
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
		const referenceAnchor = getRendererAnchor(refChild);
		if (
			referenceAnchor &&
			(referenceAnchor.kind === 'canvas' || referenceAnchor.kind === 'portal') &&
			isRendererNode(newChild) &&
			newChild.__ngt_renderer__[NgtRendererClassId.type] === 'comment'
		) {
			setRendererAnchor(newChild, referenceAnchor);
		}

		// if there is no parent, we delegate
		if (!parent) {
			return this.delegateRenderer.insertBefore(parent, newChild, refChild, isMove);
		}

		return this.appendChild(parent, newChild, refChild, isMove);
	}

	removeChild(
		parent: NgtRendererNode,
		oldChild: NgtRendererNode,
		isHostElement?: boolean,
		requireSynchronousElementRemoval?: boolean,
	): void {
		if (parent === null) {
			parent = this.parentNode(oldChild);
		}

		const cRS = oldChild.__ngt_renderer__;

		if (!cRS) {
			try {
				return this.delegateRenderer.removeChild(
					parent,
					oldChild,
					isHostElement,
					requireSynchronousElementRemoval,
				);
			} catch {
				return;
			}
		}

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
			return this.delegateRenderer.removeChild(parent, oldChild, isHostElement, requireSynchronousElementRemoval);
		}

		if (cRS[NgtRendererClassId.type] !== 'three') {
			this.detachThreeDescendants(oldChild);
		}

		removeRendererChildNode(parent, oldChild);

		if (cRS[NgtRendererClassId.type] === 'three') {
			const childState = getInstanceState(oldChild);
			const threeParent = childState?.parent ? untracked(childState.parent) : null;
			if (threeParent) {
				return removeThreeChild(oldChild as unknown as NgtInstanceNode, threeParent, false);
			}
			return;
		}

		if (pRS[NgtRendererClassId.type] === 'platform' && cRS[NgtRendererClassId.type] === 'platform') {
			return this.delegateRenderer.removeChild(parent, oldChild, isHostElement, requireSynchronousElementRemoval);
		}

		if (
			pRS[NgtRendererClassId.type] === 'three' &&
			(cRS[NgtRendererClassId.type] === 'platform' ||
				cRS[NgtRendererClassId.type] === 'portal' ||
				cRS[NgtRendererClassId.type] === 'text')
		) {
			return;
		}

		return this.delegateRenderer.removeChild(parent, oldChild, isHostElement, requireSynchronousElementRemoval);
	}

	parentNode(node: NgtRendererNode) {
		const anchor = getRendererAnchor(node);
		if (
			anchor &&
			(anchor.kind === 'canvas' || anchor.kind === 'portal') &&
			isRendererNode(node) &&
			node.__ngt_renderer__[NgtRendererClassId.type] === 'comment'
		) {
			const store = anchor.store;

			// this should not happen but if it does, we'll delegate to the renderer
			if (!store) {
				return this.delegateRenderer.parentNode(node);
			}

			const rootScene = store.snapshot.scene;

			// if we don't have the scene yet, bail again
			if (!rootScene) {
				return this.delegateRenderer.parentNode(node);
			}

			// if root scene is not a Three renderer node, make it one here
			const rendererRootScene = isRendererNodeType(rootScene, 'three')
				? rootScene
				: createRendererNode('three', rootScene, this.document);

			if (anchor.kind === 'portal' && anchor.domParent && isRendererNode(anchor.domParent)) {
				const portalContentParent = anchor.domParent;
				const portalContentParentRS = portalContentParent.__ngt_renderer__;
				portalContentParentRS[NgtRendererClassId.portalContainer] = rendererRootScene;
			}

			return rendererRootScene;
		}

		const rendererParentNode = node.__ngt_renderer__?.[NgtRendererClassId.parent];
		// returns the renderer parent node if it exists, otherwise returns the delegateRenderer parentNode
		return rendererParentNode ?? this.delegateRenderer.parentNode(node);
	}

	removeAttribute(el: NgtRendererNode, name: string, namespace?: string | null): void {
		const rS = el.__ngt_renderer__;
		if (!rS || rS[NgtRendererClassId.destroyed]) return this.delegateRenderer.removeAttribute(el, name, namespace);

		if (rS[NgtRendererClassId.type] === 'three') {
			const instanceState = getInstanceState(el);
			const parent =
				(instanceState?.parent ? untracked(instanceState.parent) : null) ?? this.findTargetThreeParent(el);
			if (name === 'attach') {
				this.updateAttachment(el as NgtRendererNode<'three'>, undefined, parent);
				return;
			}
			applyProps(el, { [name]: undefined });
			if (name === 'geometry') untracked(() => instanceState?.updateGeometryStamp());
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
				const instanceState = getInstanceState(el);
				const parent =
					(instanceState?.parent ? untracked(instanceState.parent) : null) ?? this.findTargetThreeParent(el);
				this.updateAttachment(el as NgtRendererNode<'three'>, value, parent);
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

		if (!rS) return this.delegateRenderer.setProperty(el, name, value);

		if (rS[NgtRendererClassId.destroyed]) {
			this.options.verbose &&
				console.warn('[NGT dev mode] setProperty is invoked on destroyed renderer node.', { el, name, value });
			return;
		}

		if (isRendererNodeType(el, 'three')) {
			const threeState = el.__ngt_renderer__;
			const instanceState = getInstanceState(el);
			const attachedParent = instanceState?.hierarchyStore.snapshot.parent ?? null;
			const parent = attachedParent ?? this.findTargetThreeParent(el);

			if (name === 'parameters') {
				const parameters: Record<string, any> = value && typeof value === 'object' ? { ...value } : {};
				// NOTE: short-cut for null raycast to prevent upstream from creating a nullRaycast property
				if ('raycast' in parameters && parameters['raycast'] === null) {
					parameters['raycast'] = () => null;
				}

				const previousKeys: Set<string> = this.parameterKeys.get(el) ?? new Set<string>();
				const nextKeys = new Set<string>(Object.keys(parameters));
				const removedParameters = Object.fromEntries(
					[...previousKeys]
						.filter((key) => key !== 'attach' && !nextKeys.has(key))
						.map((key) => [key, undefined]),
				);
				const { attach: nextAttach, ...nextParameters } = parameters;
				applyProps(el, { ...removedParameters, ...nextParameters });
				this.parameterKeys.set(el, nextKeys);

				if (nextKeys.has('geometry') || (previousKeys.has('geometry') && !nextKeys.has('geometry'))) {
					untracked(() => instanceState?.updateGeometryStamp());
				}

				if ('attach' in parameters || previousKeys.has('attach')) {
					this.updateAttachment(el, nextAttach, parent);
				}

				return;
			}

			// [rawValue]
			if (instanceState?.type === 'ngt-value' && name === 'rawValue') {
				untracked(() => {
					if (attachedParent) removeThreeChild(el as unknown as NgtInstanceNode, attachedParent, false);
					threeState[NgtRendererClassId.rawValue] = value;
					if (parent) {
						attachThreeNodes(
							parent,
							el as unknown as NgtInstanceNode,
							undefined,
							instanceState.store ?? undefined,
						);
					}
				});
				return;
			}

			// [attach]
			if (name === 'attach') {
				this.updateAttachment(el, value, parent);
				return;
			}

			// NOTE: short-cut for null raycast to prevent upstream from creating a nullRaycast property
			if (name === 'raycast' && value === null) {
				value = () => null;
			}

			applyProps(el, { [name]: value });

			if (instanceState && name === 'geometry') {
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
		options?: Parameters<Renderer2['listen']>[3],
	): () => void {
		if (typeof target === 'string') {
			return this.delegateRenderer.listen(target, eventName, callback, options);
		}

		const rS = target.__ngt_renderer__;
		if (!rS) {
			return this.delegateRenderer.listen(target, eventName, callback, options);
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
				return this.registerWithOptions(callback, options, (listener) =>
					this.listenToInstanceEvent(target as NgtRendererNode<'three'>, 'attached', listener),
				);
			}

			if (eventName === 'updated') {
				return this.registerWithOptions(callback, options, (listener) =>
					this.listenToInstanceEvent(target as NgtRendererNode<'three'>, 'updated', listener),
				);
			}

			if (THREE_NATIVE_EVENTS.includes(eventName) && target instanceof THREE.EventDispatcher) {
				// NOTE: rename to dispose because that's the event type, not disposed.
				if (eventName === 'disposed') {
					eventName = 'dispose';
				}

				return this.registerWithOptions(callback, options, (listener) => {
					target.addEventListener(eventName, listener);
					if ((target as unknown as THREE.Object3D).parent && eventName === 'added') {
						listener({ type: eventName, target });
					}
					return () => target.removeEventListener(eventName, listener);
				});
			}

			const cleanup = this.registerWithOptions(
				callback,
				options,
				(listener) => iS.setPointerEvent?.(eventName as keyof NgtEventHandlers, listener) || (() => {}),
			);

			// this means the object has already been attached to the parent and has its store propagated
			if (iS.store) iS.addInteraction?.(iS.store);

			return cleanup;
		}

		return this.delegateRenderer.listen(target, eventName, callback, options);
	}

	private appendThreeRendererNodes(
		parent: NgtRendererNode<'three'>,
		child: NgtRendererNode<'three'>,
		refChild?: NgtRendererNode | null,
		storeOverride?: SignalState<NgtState>,
	) {
		parent = child.__ngt_renderer__[NgtRendererClassId.parentOverride] ?? parent;
		// if parent and child are the same, skip
		if (parent === child) {
			this.options.verbose &&
				console.warn('[NGT dev mode] appending THREE.js parent and child but they are the same', {
					parent,
					child,
				});
			return;
		}
		if (!is.instance(parent) || !is.instance(child)) {
			throw new Error('[NGT] THREE renderer nodes need to be prepared with local instance state.');
		}

		const childState = getInstanceState(child);
		const currentParent = childState?.parent ? untracked(childState.parent) : null;
		if (currentParent && currentParent !== parent) {
			removeThreeChild(child, currentParent, false);
		}

		const before = this.findThreeInsertionReference(parent, child, refChild);
		const anchor = getRendererAnchor(refChild);
		const attachmentStore =
			storeOverride ?? (anchor?.kind === 'canvas' || anchor?.kind === 'portal' ? anchor.store : undefined);
		attachThreeNodes(parent, child, is.instance(before) ? before : null, attachmentStore);
		return;
	}

	private setNodeRelationship(parent: NgtRendererNode, child: NgtRendererNode, refChild?: NgtRendererNode | null) {
		const anchor = getRendererAnchor(refChild);
		const logicalParent =
			anchor?.kind === 'portal' && anchor.domParent && isRendererNode(anchor.domParent)
				? anchor.domParent
				: parent;
		insertRendererChildNode(logicalParent, child, refChild);
	}

	private findNearestThreeParent(node: NgtRendererNode | null | undefined): NgtRendererNode<'three'> | null {
		let current = node;
		while (current && isRendererNode(current)) {
			const state = current.__ngt_renderer__;
			if (state[NgtRendererClassId.type] === 'three') return current as NgtRendererNode<'three'>;
			if (state[NgtRendererClassId.type] === 'portal' && state[NgtRendererClassId.portalContainer]) {
				return state[NgtRendererClassId.portalContainer];
			}
			current = state[NgtRendererClassId.parent];
		}
		return null;
	}

	private findTargetThreeParent(node: NgtRendererNode): (NgtRendererNode<'three'> & NgtInstanceNode) | null {
		if (!isRendererNodeType(node, 'three')) return null;
		const state = node.__ngt_renderer__;
		const parentOverride = state[NgtRendererClassId.parentOverride];
		if (parentOverride && is.instance(parentOverride)) return parentOverride;
		const logicalParent = this.findNearestThreeParent(state[NgtRendererClassId.parent]);
		return logicalParent && is.instance(logicalParent) ? logicalParent : null;
	}

	private portalStore(node: NgtRendererNode | null | undefined) {
		const anchor = getRendererAnchor(node);
		return anchor?.kind === 'portal' ? anchor.store : undefined;
	}

	private findNearestPortalStore(node: NgtRendererNode | null | undefined) {
		let current = node;
		while (current && isRendererNode(current)) {
			const store = this.portalStore(current);
			if (store) return store;
			current = current.__ngt_renderer__[NgtRendererClassId.parent];
		}
		return undefined;
	}

	private findFirstThreeDescendant(
		node: NgtRendererNode | null | undefined,
		physicalParent: NgtRendererNode<'three'>,
	): NgtRendererNode<'three'> | null {
		if (!node || !isRendererNode(node)) return null;
		const state = node.__ngt_renderer__;
		if (isRendererNodeType(node, 'three')) {
			if (!is.instance(node) || !is.instance(physicalParent)) return null;
			if (!is.three<THREE.Object3D>(node, 'isObject3D')) return null;
			if (!is.three<THREE.Object3D>(physicalParent, 'isObject3D')) return null;
			const instanceState = getInstanceState(node);
			if (instanceState?.parent && untracked(instanceState.parent) === physicalParent) {
				if (physicalParent.children.includes(node)) return node;
			}
			return null;
		}

		for (const child of state[NgtRendererClassId.children]) {
			const descendant = this.findFirstThreeDescendant(child, physicalParent);
			if (descendant) return descendant;
		}
		return null;
	}

	private findThreeInsertionReference(
		physicalParent: NgtRendererNode<'three'>,
		child: NgtRendererNode<'three'>,
		requestedRef?: NgtRendererNode | null,
	) {
		const directReference = this.findFirstThreeDescendant(requestedRef, physicalParent);
		if (directReference) return directReference;

		return this.findThreeReferenceAfterLogicalNode(physicalParent, child);
	}

	private findThreeReferenceAfterLogicalNode(physicalParent: NgtRendererNode<'three'>, node: NgtRendererNode) {
		let current: NgtRendererNode | undefined = node;
		while (current) {
			const logicalParent: NgtRendererNode | undefined = current.__ngt_renderer__[NgtRendererClassId.parent];
			if (!logicalParent || !isRendererNode(logicalParent)) return null;
			const siblings = logicalParent.__ngt_renderer__[NgtRendererClassId.children];
			const currentIndex = siblings.indexOf(current);
			for (let index = currentIndex + 1; index < siblings.length; index++) {
				const reference = this.findFirstThreeDescendant(siblings[index], physicalParent);
				if (reference) return reference;
			}
			if (logicalParent === physicalParent) return null;
			current = logicalParent;
		}
		return null;
	}

	private attachThreeDescendants(
		parent: NgtRendererNode<'three'>,
		node: NgtRendererNode,
		refChild?: NgtRendererNode<'three'> | null,
		storeOverride?: SignalState<NgtState>,
	) {
		for (const child of node.__ngt_renderer__[NgtRendererClassId.children]) {
			if (child.__ngt_renderer__[NgtRendererClassId.type] === 'three') {
				this.appendThreeRendererNodes(parent, child as NgtRendererNode<'three'>, refChild, storeOverride);
			} else {
				this.attachThreeDescendants(parent, child, refChild, storeOverride);
			}
		}
	}

	private detachThreeDescendants(node: NgtRendererNode) {
		for (const child of node.__ngt_renderer__[NgtRendererClassId.children]) {
			if (child.__ngt_renderer__[NgtRendererClassId.type] === 'three') {
				const instanceState = getInstanceState(child);
				const physicalParent = instanceState?.parent ? untracked(instanceState.parent) : null;
				if (physicalParent) {
					removeThreeChild(child as unknown as NgtInstanceNode, physicalParent, false);
				}
			} else {
				this.detachThreeDescendants(child);
			}
		}
	}

	private destroyOwnedNodes(host: NgtRendererNode) {
		const ownedNodes = host.__ngt_renderer__[NgtRendererClassId.ownedNodes];
		if (!ownedNodes) return;
		for (const ownedNode of [...ownedNodes]) {
			releaseRendererOwner(ownedNode, false);
			internalDestroyNode(ownedNode, this.removeChild.bind(this));
		}
		ownedNodes.clear();
	}

	private listenToInstanceEvent(
		target: NgtRendererNode<'three'>,
		eventName: 'attached' | 'updated',
		callback: (event: any) => boolean | void,
	) {
		const instanceState = getInstanceState(target);
		if (!instanceState) return () => {};
		const registry = eventName === 'attached' ? this.attachedListeners : this.updatedListeners;
		let bucket = registry.get(target);
		if (!bucket) {
			const listeners = new Map<symbol, (event: any) => void>();
			const existing = eventName === 'attached' ? instanceState.onAttach : instanceState.onUpdate;
			if (existing) listeners.set(Symbol('existing'), existing);
			const dispatch = (event: any) => {
				for (const listener of [...listeners.values()]) listener(event);
			};
			bucket = { listeners, dispatch };
			registry.set(target, bucket);
			if (eventName === 'attached') instanceState.onAttach = dispatch;
			else instanceState.onUpdate = dispatch;
		}

		const token = Symbol(eventName);
		bucket.listeners.set(token, callback);
		if (eventName === 'attached') {
			const parent = instanceState.parent && untracked(instanceState.parent);
			if (parent) callback({ parent, node: target as unknown as NgtInstanceNode });
		}

		let active = true;
		return () => {
			if (!active) return;
			active = false;
			if (!bucket?.listeners.delete(token) || bucket.listeners.size > 0) return;
			registry.delete(target);
			if (eventName === 'attached' && instanceState.onAttach === bucket.dispatch) {
				instanceState.onAttach = undefined;
			} else if (eventName === 'updated' && instanceState.onUpdate === bucket.dispatch) {
				instanceState.onUpdate = undefined;
			}
		};
	}

	private registerWithOptions(
		callback: (event: any) => boolean | void,
		options: Parameters<Renderer2['listen']>[3] | undefined,
		register: (callback: (event: any) => boolean | void) => () => void,
	) {
		if (!options?.once) return register(callback);

		let cleanup: (() => void) | undefined;
		let cleanupPending = false;
		let active = true;
		const onceCallback = (event: any) => {
			if (!active) return;
			active = false;
			try {
				return callback(event);
			} finally {
				if (cleanup) cleanup();
				else cleanupPending = true;
			}
		};
		cleanup = register(onceCallback);
		if (cleanupPending) cleanup();
		return () => {
			active = false;
			cleanup?.();
		};
	}

	private getNgtDirective<TDirective extends NgtCommonDirective<any>>(directive: Type<TDirective>) {
		let directiveInstance: TDirective | undefined;

		let i = this.directiveInjectors.length - 1;
		while (i >= 0) {
			const injector = this.directiveInjectors[i];
			const instance = injector.get(directive, null);
			if (instance && typeof instance === 'object' && instance.validate()) {
				directiveInstance = instance;
				break;
			}
			i--;
		}

		return directiveInstance;
	}

	[NGT_RENDERER_CONTEXT_FLAG] = <T>(injector: Injector, callback: () => T) => {
		this.directiveInjectors.push(injector);
		try {
			return callback();
		} finally {
			this.directiveInjectors.pop();
		}
	};

	private normalizeAttach(attach: NgtAttachable | null | undefined) {
		if (attach == null) return undefined;
		if (typeof attach === 'function') return attach;
		if (typeof attach === 'string') return attach.split('.');
		return attach.flatMap((item) => item.toString().split('.'));
	}

	private updateAttachment(
		node: NgtRendererNode<'three'>,
		attach: NgtAttachable | null | undefined,
		parent: NgtInstanceNode | null,
	) {
		untracked(() => {
			const instanceState = getInstanceState(node);
			if (!instanceState) return;
			const nextAttach = this.normalizeAttach(attach);
			const currentAttach = instanceState.attach;
			const isSameAttach =
				currentAttach === nextAttach ||
				(Array.isArray(currentAttach) &&
					Array.isArray(nextAttach) &&
					currentAttach.length === nextAttach.length &&
					currentAttach.every((part, index) => part === nextAttach[index]));
			if (isSameAttach) return;

			const attachedParent = instanceState.hierarchyStore.snapshot.parent;
			if (attachedParent) removeThreeChild(node as unknown as NgtInstanceNode, attachedParent, false);
			instanceState.attach = nextAttach;
			if (parent) {
				attachThreeNodes(
					parent,
					node as unknown as NgtInstanceNode,
					undefined,
					instanceState.store ?? undefined,
				);
			}
		});
	}

	addClass(el: NgtRendererNode, name: string) {
		if (el?.__ngt_renderer__?.[NgtRendererClassId.type] === 'three') return;
		this.delegateRenderer.addClass(el, name);
	}

	removeClass(el: NgtRendererNode, name: string) {
		if (el?.__ngt_renderer__?.[NgtRendererClassId.type] === 'three') return;
		this.delegateRenderer.removeClass(el, name);
	}

	setStyle(el: NgtRendererNode, style: string, value: any, flags?: RendererStyleFlags2) {
		if (el?.__ngt_renderer__?.[NgtRendererClassId.type] === 'three') return;
		this.delegateRenderer.setStyle(el, style, value, flags);
	}

	removeStyle(el: NgtRendererNode, style: string, flags?: RendererStyleFlags2) {
		if (el?.__ngt_renderer__?.[NgtRendererClassId.type] === 'three') return;
		this.delegateRenderer.removeStyle(el, style, flags);
	}

	selectRootElement(selectorOrNode: string | any, preserveContent?: boolean) {
		return this.delegateRenderer.selectRootElement(selectorOrNode, preserveContent);
	}

	nextSibling(node: NgtRendererNode) {
		if (isRendererNode(node)) {
			const state = node.__ngt_renderer__;
			if (state[NgtRendererClassId.parent]) return getRendererNextSibling(node);
			if (state[NgtRendererClassId.type] === 'three') return null;
		}
		return this.delegateRenderer.nextSibling(node);
	}

	setValue(node: NgtRendererNode, value: string) {
		if (node?.__ngt_renderer__?.[NgtRendererClassId.type] === 'three') return;
		this.delegateRenderer.setValue(node, value);
	}
}
