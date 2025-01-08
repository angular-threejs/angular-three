import { DOCUMENT } from '@angular/common';
import {
	DebugNode,
	Injectable,
	Renderer2,
	RendererFactory2,
	RendererType2,
	Type,
	inject,
	makeEnvironmentProviders,
	untracked,
} from '@angular/core';
import { NgtArgs } from '../directives/args';
import { NgtParent } from '../directives/parent';
import { getLocalState, prepare } from '../instance';
import { NGT_STORE, injectStore, provideStore } from '../store';
import { NgtAnyRecord, NgtLocalState, NgtState } from '../types';
import { applyProps } from '../utils/apply-props';
import { is } from '../utils/is';
import { NgtSignalStore } from '../utils/signal-store';
import { NgtAnyConstructor, injectCatalogue } from './catalogue';
import {
	DOM_PARENT,
	HTML,
	NON_ROOT,
	ROUTED_SCENE,
	SPECIAL_DOM_TAG,
	SPECIAL_INTERNAL_ADD_COMMENT,
	SPECIAL_INTERNAL_SET_PARENT_COMMENT,
	SPECIAL_PROPERTIES,
} from './constants';
import {
	NgtRendererNode,
	NgtRendererState,
	addChild,
	createNode,
	getClosestParentWithInstance,
	isDOM,
	removeChild,
	setParent,
} from './state';
import { NgtRendererClassId, attachThreeChild, kebabToPascal, processThreeEvent, removeThreeChild } from './utils';

@Injectable()
export class NgtRendererFactory implements RendererFactory2 {
	private delegateRendererFactory = inject(RendererFactory2, { skipSelf: true });
	private document = inject(DOCUMENT);
	private catalogue = injectCatalogue();
	private rootStore = injectStore();

	private portalCommentsNodes: Array<NgtRendererNode> = [];
	private rendererMap = new Map<string, Renderer2>();
	private routedSet = new Set<string>();

	createRenderer(hostElement: any, type: RendererType2 | null): Renderer2 {
		const delegateRenderer = this.delegateRendererFactory.createRenderer(hostElement, type);

		if (!type) return delegateRenderer;

		// NOTE: might need to revisit this
		if ((type as NgtAnyRecord)['type'][HTML]) {
			this.rendererMap.set(type.id, delegateRenderer);
			return delegateRenderer;
		}

		if ((type as NgtAnyRecord)['type'][ROUTED_SCENE]) {
			this.routedSet.add(type.id);
		}

		const isNonRoot = (type as NgtAnyRecord)['type'][NON_ROOT];

		let renderer = this.rendererMap.get(type.id);
		if (!renderer) {
			this.rendererMap.set(
				type.id,
				(renderer = new NgtRenderer(
					delegateRenderer,
					this.rootStore,
					this.document,
					this.portalCommentsNodes,
					this.catalogue,
					// setting root scene if there's no routed scene OR this component is the routed Scene
					!hostElement && !isNonRoot && (this.routedSet.size === 0 || this.routedSet.has(type.id)),
				)),
			);
		}
		return renderer;
	}
}

export class NgtRenderer implements Renderer2 {
	private argsCommentNodes: Array<NgtRendererNode> = [];
	private parentCommentNodes: Array<NgtRendererNode> = [];

	constructor(
		private delegate: Renderer2,
		private rootStore: NgtSignalStore<NgtState>,
		private document: Document,
		private portalCommentsNodes: Array<NgtRendererNode>,
		private catalogue: Record<string, NgtAnyConstructor>,
		private isRoot = true,
	) {}

	createElement(name: string, namespace?: string | null | undefined) {
		const element = this.delegate.createElement(name, namespace);

		// if there's namespace, we don't do anything
		if (namespace) {
			return createNode('dom', element, this.document);
		}

		// on first pass, we return the Root Scene as the root node
		if (this.isRoot) {
			this.isRoot = false;
			const node = createNode('three', this.rootStore.snapshot.scene, this.document);
			node.__ngt_renderer__[NgtRendererClassId.debugNodeFactory] = () => {
				if (!node.__ngt_renderer__[NgtRendererClassId.debugNode]) {
					node.__ngt_renderer__[NgtRendererClassId.debugNode] = new DebugNode(element);
				}
				return node.__ngt_renderer__[NgtRendererClassId.debugNode];
			};
			return node;
		}

		if (name === SPECIAL_DOM_TAG.NGT_PORTAL) {
			return createNode('portal', element, this.document);
		}

		if (name === SPECIAL_DOM_TAG.NGT_VALUE) {
			return createNode(
				'three',
				prepare({ __ngt_renderer__: { rawValue: undefined } }, { store: this.rootStore, isRaw: true }),
				this.document,
			);
		}

		const [injectedArgs, injectedParent] = [
			this.getNgtDirective(NgtArgs, this.argsCommentNodes)?.value || [],
			this.getNgtDirective(NgtParent, this.parentCommentNodes)?.value,
		];

		if (name === SPECIAL_DOM_TAG.NGT_PRIMITIVE) {
			if (!injectedArgs[0]) throw new Error(`[NGT] ngt-primitive without args is invalid`);
			const object = injectedArgs[0];
			let localState = getLocalState(object);
			if (!localState) {
				// NOTE: if an object isn't already "prepared", we prepare it
				prepare(object, { store: this.rootStore, primitive: true });
				localState = getLocalState(object);
			}

			const primitiveNode = createNode('three', object, this.document);

			if (injectedParent) {
				primitiveNode.__ngt_renderer__[NgtRendererClassId.parent] = injectedParent as unknown as NgtRendererNode;
			}

			return primitiveNode;
		}

		const threeName = kebabToPascal(name.startsWith('ngt-') ? name.slice(4) : name);
		const threeTarget = this.catalogue[threeName];

		// we have the THREE constructor here, handle it
		if (threeTarget) {
			const instance = prepare(new threeTarget(...injectedArgs), { store: this.rootStore });
			const node = createNode('three', instance, this.document);
			const localState = getLocalState(instance) as NgtLocalState;

			// auto-attach for geometry and material
			if (is.geometry(instance)) {
				localState.attach = ['geometry'];
			} else if (is.material(instance)) {
				localState.attach = ['material'];
			}

			if (injectedParent) {
				node.__ngt_renderer__[NgtRendererClassId.parent] = injectedParent as unknown as NgtRendererNode;
			}

			return node;
		}

		return createNode('dom', element, this.document);
	}

	createComment(value: string) {
		const comment = this.delegate.createComment(value);
		const commentNode = createNode('comment', comment, this.document);

		// NOTE: we attach an arrow function to the Comment node
		//  In our directives, we can call this function to then start tracking the RendererNode
		//  this is done to limit the amount of Nodes we need to process for getCreationState
		comment[SPECIAL_INTERNAL_ADD_COMMENT] = (node: NgtRendererNode | 'args' | 'parent') => {
			if (node === 'args') {
				this.argsCommentNodes.push(comment);
			} else if (node === 'parent') {
				this.parentCommentNodes.push(comment);
				comment[SPECIAL_INTERNAL_SET_PARENT_COMMENT] = (ngtParent: NgtRendererNode) => {
					commentNode.__ngt_renderer__[NgtRendererClassId.parent] = ngtParent;
				};
			} else if (typeof node === 'object') {
				this.portalCommentsNodes.push(node);
			}
		};

		return commentNode;
	}

	appendChild(parent: NgtRendererNode, newChild: NgtRendererNode): void {
		const pRS = parent.__ngt_renderer__;
		const cRS = newChild.__ngt_renderer__;

		if (
			pRS[NgtRendererClassId.type] === 'dom' &&
			(newChild instanceof Text || cRS[NgtRendererClassId.type] === 'dom')
		) {
			addChild(parent, newChild);

			if (newChild[DOM_PARENT] && newChild[DOM_PARENT] instanceof HTMLElement) {
				this.delegate.appendChild(newChild[DOM_PARENT], newChild);
				return;
			}

			this.delegate.appendChild(parent, newChild);
			if (cRS) {
				setParent(newChild, parent);
				if (this.shouldFindGrandparentInstance(pRS, cRS, newChild)) {
					// we'll try to get the grandparent instance here so that we can run appendChild with both instances
					const closestGrandparentInstance = getClosestParentWithInstance(parent);
					if (closestGrandparentInstance) this.appendChild(closestGrandparentInstance, newChild);
				}
			}

			return;
		}

		if (cRS?.[NgtRendererClassId.type] === 'comment') {
			setParent(newChild, parent);
			return;
		}

		setParent(newChild, parent);
		addChild(parent, newChild);

		// if new child is a portal
		if (cRS?.[NgtRendererClassId.type] === 'portal') {
			if (!cRS[NgtRendererClassId.portalContainer]) this.processPortalContainer(newChild);
			if (cRS[NgtRendererClassId.portalContainer]) {
				this.appendChild(parent, cRS[NgtRendererClassId.portalContainer]);
			}
			return;
		}

		// if parent is a portal
		if (pRS[NgtRendererClassId.type] === 'portal') {
			if (!pRS[NgtRendererClassId.portalContainer]) this.processPortalContainer(parent);

			if (pRS[NgtRendererClassId.portalContainer]) {
				this.appendChild(pRS[NgtRendererClassId.portalContainer], newChild);
			}
			return;
		}

		// if both are three instances, straightforward case
		if (pRS[NgtRendererClassId.type] === 'three' && cRS?.[NgtRendererClassId.type] === 'three') {
			const cLS = getLocalState(newChild);

			// if child already attached to a parent, skip
			if (cLS?.instanceStore?.get('parent')) return;
			if (parent === newChild) return;

			// attach THREE child
			attachThreeChild(parent, newChild);
			return;
		}

		// if only the parent is the THREE instance
		if (pRS[NgtRendererClassId.type] === 'three') {
			for (const renderChild of cRS?.[NgtRendererClassId.children] || []) {
				this.appendChild(parent, renderChild);
			}
		}

		if (this.shouldFindGrandparentInstance(pRS, cRS, newChild)) {
			// we'll try to get the grandparent instance here so that we can run appendChild with both instances
			const closestGrandparentInstance = getClosestParentWithInstance(parent);
			if (closestGrandparentInstance) this.appendChild(closestGrandparentInstance, newChild);
			return;
		}
	}

	insertBefore(
		parent: NgtRendererNode,
		newChild: NgtRendererNode,
		// TODO: we might need these?
		// _refChild: NgtRendererNode,
		// _isMove?: boolean | undefined,
	): void {
		// NOTE: not sure why this is here. investigate when we have time
		// if (parent instanceof HTMLElement && (newChild instanceof HTMLElement || newChild instanceof Text)) {
		// 	return this.delegate.appendChild(parent, newChild);
		// }

		if (parent == null || !parent.__ngt_renderer__ || parent === newChild) return;
		this.appendChild(parent, newChild);
	}

	removeChild(
		parent: NgtRendererNode | null,
		oldChild: NgtRendererNode,
		isHostElement?: boolean | undefined,
		calledByNgt = false,
	): void {
		if (!calledByNgt && parent == null) {
			parent = this.parentNode(oldChild);
			return this.removeChild(parent, oldChild, isHostElement, true);
		}

		if (parent == null) {
			parent = (untracked(() => getLocalState(oldChild)?.parent?.()) ||
				oldChild.__ngt_renderer__?.[NgtRendererClassId.parent]) as NgtRendererNode;
		}

		const cRS = oldChild.__ngt_renderer__;

		// if parent is still falsy, we don't know what to do with the parent.
		// we'll just remove the child and destroy it
		if (parent == null) {
			if (cRS) {
				// if the child is the root scene, we don't want to destroy it
				if (is.scene(oldChild) && oldChild.name === '__ngt_root_scene__') return;

				if (cRS[NgtRendererClassId.type] === 'three') {
					removeThreeChild(oldChild, undefined, true);
				}

				// otherwise, we'll destroy it
				this.destroyInternal(oldChild, undefined);
			}

			return;
		}

		const pRS = parent.__ngt_renderer__;

		if (
			(!cRS || !pRS) &&
			parent instanceof Element &&
			(oldChild instanceof Element || oldChild instanceof Text || oldChild instanceof Comment)
		) {
			this.delegate.removeChild(parent, oldChild);
			this.destroyInternal(oldChild, parent);
			return;
		}

		if (cRS[NgtRendererClassId.type] === 'dom' && (!pRS || pRS[NgtRendererClassId.type] === 'dom')) {
			this.delegate.removeChild(parent, oldChild);
			this.destroyInternal(oldChild, parent);
			return;
		}

		if (pRS[NgtRendererClassId.type] === 'three' && cRS[NgtRendererClassId.type] === 'three') {
			removeThreeChild(oldChild, parent, true);
			this.destroyInternal(oldChild, parent);
			return;
		}

		if (
			pRS[NgtRendererClassId.type] === 'portal' &&
			pRS[NgtRendererClassId.portalContainer]?.__ngt_renderer__[NgtRendererClassId.type] === 'three'
		) {
			this.removeChild(pRS[NgtRendererClassId.portalContainer], oldChild, isHostElement);
			return;
		}

		if (pRS[NgtRendererClassId.type] === 'three') {
			this.destroyInternal(oldChild, parent);
			return;
		}

		const closestGrandparentInstance = getClosestParentWithInstance(parent);
		if (closestGrandparentInstance) this.removeChild(closestGrandparentInstance, oldChild, isHostElement);
		this.destroyInternal(oldChild, closestGrandparentInstance as NgtRendererNode);
	}

	parentNode(node: NgtRendererNode) {
		const rS = node.__ngt_renderer__;
		if (rS?.[NgtRendererClassId.parent]) return rS[NgtRendererClassId.parent];
		return this.delegate.parentNode(node);
	}

	private setAttributeInternal(
		el: NgtRendererNode,
		name: string,
		value: string,
		_namespace?: string | null | undefined,
	): boolean {
		const rS = el.__ngt_renderer__;
		if (rS[NgtRendererClassId.destroyed]) return false;

		if (rS[NgtRendererClassId.type] === 'three') {
			if (name === SPECIAL_PROPERTIES.RENDER_PRIORITY) {
				// NOTE: priority needs to be set as an attribute string so that they can be set as early as possible
				// we convert that string to a number. if it's invalid, default 0
				let priority = Number(value);
				if (isNaN(priority)) {
					priority = 0;
					console.warn(`[NGT] "priority" is an invalid number, default to 0`);
				}
				const localState = getLocalState(el);
				if (localState) localState.priority = priority;
			} else if (name === SPECIAL_PROPERTIES.ATTACH) {
				// NOTE: handle attach as string
				const paths = value.split('.');
				if (paths.length) {
					const localState = getLocalState(el);
					if (localState) localState.attach = paths;
				}
			} else {
				// NOTE: coercion
				let maybeCoerced: string | number | boolean = value;
				if (maybeCoerced === '' || maybeCoerced === 'true' || maybeCoerced === 'false') {
					maybeCoerced = maybeCoerced === 'true' || maybeCoerced === '';
				} else if (!isNaN(Number(maybeCoerced))) {
					maybeCoerced = Number(maybeCoerced);
				}

				if (name === SPECIAL_PROPERTIES.RAW_VALUE) {
					rS[NgtRendererClassId.rawValue] = maybeCoerced;
				} else {
					applyProps(el, { [name]: maybeCoerced });
				}
			}

			return false;
		}

		return true;
	}

	setAttribute(el: NgtRendererNode, name: string, value: string, namespace?: string | null | undefined): void {
		const useDelegate = this.setAttributeInternal(el, name, value, namespace);

		if (useDelegate) {
			this.delegate.setAttribute(el, name, value);
		}
	}

	removeAttribute(el: NgtRendererNode, name: string, namespace?: string | null | undefined): void {
		const useDelegate = this.setAttributeInternal(el, name, undefined!, namespace);

		if (useDelegate) {
			this.delegate.removeAttribute(el, name, namespace);
		}
	}

	setProperty(el: NgtRendererNode, name: string, value: any): void {
		const rS = el.__ngt_renderer__;
		if (!rS || rS[NgtRendererClassId.destroyed]) return;

		const localState = getLocalState(el);

		if (rS[NgtRendererClassId.type] === 'three') {
			if (name === SPECIAL_PROPERTIES.PARAMETERS) {
				// NOTE: short-cut for null raycast to prevent upstream from creating a nullRaycast property
				if ('raycast' in value && value['raycast'] === null) {
					value['raycast'] = () => null;
				}
				applyProps(el, value);

				if ('geometry' in value && value['geometry'].isBufferGeometry) {
					localState?.updateGeometryStamp();
				}

				return;
			}

			const parent = localState?.instanceStore.get('parent') || rS[NgtRendererClassId.parent];

			// [rawValue]
			if (localState?.isRaw && name === SPECIAL_PROPERTIES.RAW_VALUE) {
				rS[NgtRendererClassId.rawValue] = value;
				if (parent) attachThreeChild(parent, el);
				return;
			}

			// [attach]
			if (name === SPECIAL_PROPERTIES.ATTACH) {
				if (localState)
					localState.attach = Array.isArray(value)
						? value.map((v) => v.toString())
						: typeof value === 'function'
							? value
							: typeof value === 'string'
								? value.split('.')
								: [value];
				if (parent) attachThreeChild(parent, el);
				return;
			}

			// NOTE: short-cut for null raycast to prevent upstream from creating a nullRaycast property
			if (name === 'raycast' && value === null) {
				value = () => null;
			}

			applyProps(el, { [name]: value });

			if (name === 'geometry' && value.isBufferGeometry) {
				localState?.updateGeometryStamp();
			}

			return;
		}

		return this.delegate.setProperty(el, name, value);
	}

	listen(target: NgtRendererNode, eventName: string, callback: (event: any) => boolean | void): () => void {
		const rS = target.__ngt_renderer__;

		// if the target doesn't have __ngt_renderer__, we delegate
		// if target is DOM node, we delegate
		if (!rS || isDOM(target)) {
			return this.delegate.listen(target, eventName, callback);
		}

		if (rS[NgtRendererClassId.type] === 'three') {
			const instance = target;
			const localState = getLocalState(instance);
			const priority = localState?.priority ?? 0;
			return processThreeEvent(instance, priority, eventName, callback);
		}

		// @ts-expect-error - we know that target is not DOM node
		if (target === this.rootStore.snapshot.scene) {
			let [domTarget, event] = eventName.split(':');
			if (event == null) {
				event = domTarget;
				domTarget = '';
			}
			const eventTarget =
				domTarget === 'window'
					? (target as NgtAnyRecord)['ownerDocument']['defaultView']
					: (target as NgtAnyRecord)['ownerDocument'];
			return this.delegate.listen(eventTarget, event, callback);
		}

		return () => {};
	}

	private destroyInternal(node: NgtRendererNode, parent?: NgtRendererNode) {
		const rS = node.__ngt_renderer__;
		if (!rS || rS[NgtRendererClassId.destroyed]) return;
		if (rS[NgtRendererClassId.type] === 'three') {
			const localState = getLocalState(node);
			if (localState?.instanceStore) {
				localState.instanceStore.get('objects').forEach((obj) => this.destroyInternal(obj, parent));
				localState.instanceStore.get('nonObjects').forEach((obj) => this.destroyInternal(obj, parent));
			}

			if (localState?.onUpdate) delete localState.onUpdate;
			if (localState?.onAttach) delete localState.onAttach;

			delete (localState as NgtAnyRecord)['objects'];
			delete (localState as NgtAnyRecord)['nonObjects'];
			delete (localState as NgtAnyRecord)['parent'];
			delete (localState as NgtAnyRecord)['add'];
			delete (localState as NgtAnyRecord)['remove'];
			delete (localState as NgtAnyRecord)['store'];
			delete (localState as NgtAnyRecord)['handlers'];

			if (!localState?.primitive) {
				delete (node as NgtAnyRecord)['__ngt__'];
			}
		}

		if (rS[NgtRendererClassId.type] === 'comment') {
			rS[NgtRendererClassId.debugNode] = null!;
			rS[NgtRendererClassId.debugNodeFactory] = null!;
			delete (node as NgtAnyRecord)[SPECIAL_INTERNAL_ADD_COMMENT];
			this.removeCommentNode(node, this.argsCommentNodes);
		}

		if (rS[NgtRendererClassId.type] === 'portal') {
			rS[NgtRendererClassId.debugNode] = null!;
			rS[NgtRendererClassId.debugNodeFactory] = null!;
			this.removeCommentNode(node, this.portalCommentsNodes);
		}

		// nullify parent
		rS[NgtRendererClassId.parent] = null;
		for (const renderChild of rS[NgtRendererClassId.children] || []) {
			if (renderChild.__ngt_renderer__?.[NgtRendererClassId.type] === 'three' && parent) {
				if (parent.__ngt_renderer__?.[NgtRendererClassId.type] === 'three') {
					removeThreeChild(renderChild, parent, true);
					continue;
				}

				const closestInstance = getClosestParentWithInstance(parent);
				if (closestInstance) {
					removeThreeChild(renderChild, closestInstance, true);
				}
			}
			this.destroyInternal(renderChild, parent);
		}

		rS[NgtRendererClassId.children] = [];
		rS[NgtRendererClassId.destroyed] = true;
		if (parent) {
			removeChild(parent, node);
		}
	}

	private removeCommentNode(node: NgtRendererNode, nodes: NgtRendererNode[]) {
		const index = nodes.findIndex((comment) => comment === node);
		if (index > -1) {
			nodes.splice(index, 1);
		}
	}

	private processPortalContainer(portal: NgtRendererNode) {
		const injector = portal.__ngt_renderer__[NgtRendererClassId.debugNodeFactory]?.()?.injector;
		if (!injector) return;

		const portalStore = injector.get(NGT_STORE, null);
		if (!portalStore) return;

		const portalContainer = portalStore.get('scene');
		if (!portalContainer) return;

		const localState = getLocalState(portalContainer);
		if (localState) {
			localState.store = portalStore;
		}

		portal.__ngt_renderer__[NgtRendererClassId.portalContainer] = createNode('three', portalContainer, this.document);
	}

	private shouldFindGrandparentInstance(pRS: NgtRendererState, cRS: NgtRendererState, child: NgtRendererNode) {
		const pType = pRS[NgtRendererClassId.type];
		const cType = cRS[NgtRendererClassId.type];

		const cLS = getLocalState(child);
		// if child is three but haven't been attached to a parent yet
		const isDanglingThreeChild = cType === 'three' && !cLS?.instanceStore?.get('parent');
		// or both parent and child are DOM elements
		// or they are compound AND haven't had a THREE instance yet
		const isParentStillDOM = pType === 'dom';
		const isChildStillDOM = cType === 'dom';

		return isDanglingThreeChild || (isParentStillDOM && isChildStillDOM) || isParentStillDOM;
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

	createText = this.delegate.createText.bind(this.delegate);
	destroy = this.delegate.destroy.bind(this.delegate);
	destroyNode: ((node: any) => void) | null = null;
	selectRootElement = this.delegate.selectRootElement.bind(this.delegate);
	nextSibling = this.delegate.nextSibling.bind(this.delegate);
	addClass = this.delegate.addClass.bind(this.delegate);
	removeClass = this.delegate.removeClass.bind(this.delegate);
	setStyle = this.delegate.setStyle.bind(this.delegate);
	removeStyle = this.delegate.removeStyle.bind(this.delegate);
	setValue = this.delegate.setValue.bind(this.delegate);
	get data(): { [key: string]: any } {
		return this.delegate.data;
	}
}

export function provideNgtRenderer(store: NgtSignalStore<NgtState>) {
	const providers = [
		NgtRendererFactory,
		{ provide: RendererFactory2, useExisting: NgtRendererFactory },
		provideStore(() => store),
	];

	return makeEnvironmentProviders(providers);
}

export { extend } from './catalogue';
export { HTML, NON_ROOT, ROUTED_SCENE } from './constants';
