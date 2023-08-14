import { DOCUMENT } from '@angular/common';
import {
	ChangeDetectorRef,
	Injectable,
	Injector,
	NgZone,
	RendererFactory2,
	effect,
	getDebugNode,
	inject,
	makeEnvironmentProviders,
	provideZoneChangeDetection,
	signal,
	untracked,
	type Renderer2,
	type RendererType2,
} from '@angular/core';
import { getLocalState, prepare } from '../instance';
import type { NgtInjectedRef } from '../ref';
import { injectNgtStore, provideNgtStore, type NgtStore } from '../store';
import type { NgtAnyRecord } from '../types';
import { is } from '../utils/is';
import { injectNgtCatalogue, type NgtAnyConstructor } from './catalogue';
import { HTML, ROUTED_SCENE, SPECIAL_DOM_TAG } from './constants';
import { NGT_COMPOUND_PREFIXES, NgtRendererStore, type NgtRendererNode, type NgtRendererState } from './store';
import {
	NgtCompoundClassId,
	NgtRendererClassId,
	attachThreeChild,
	kebabToPascal,
	processThreeEvent,
	removeThreeChild,
} from './utils';

@Injectable()
class NgtRendererFactory implements RendererFactory2 {
	private delegateRendererFactory = inject(RendererFactory2, { skipSelf: true });
	private zone = inject(NgZone);
	private catalogue = injectNgtCatalogue();
	private cdr = inject(ChangeDetectorRef);

	private rendererMap = new Map<string, Renderer2>();
	private routedSet = new Set<string>();

	// all Renderer instances share the same Store
	private rendererStore = new NgtRendererStore({
		portals: [],
		store: injectNgtStore(),
		compoundPrefixes: inject(NGT_COMPOUND_PREFIXES),
		document: inject(DOCUMENT),
	});

	createRenderer(hostElement: any, type: RendererType2 | null): Renderer2 {
		const delegate = this.delegateRendererFactory.createRenderer(hostElement, type);
		if (!type) return delegate;
		// TODO: handle html in canvas
		if ((type as NgtAnyRecord)['type'][HTML]) {
			this.rendererMap.set(type.id, delegate);
			return delegate;
		}
		if ((type as NgtAnyRecord)['type'][ROUTED_SCENE]) {
			this.routedSet.add(type.id);
		}

		let renderer = this.rendererMap.get(type.id);

		if (!renderer) {
			renderer = new NgtRenderer(
				delegate,
				this.rendererStore,
				this.catalogue,
				this.zone,
				this.cdr,
				// setting root scene if there's no routed scene OR this component is the routed Scene
				!hostElement && (this.routedSet.size === 0 || this.routedSet.has(type.id)),
			);
			this.rendererMap.set(type.id, renderer);
		}
		return renderer;
	}
}

/**
 * Anything abbreviated with rS/RS stands for RendererState
 */
class NgtRenderer implements Renderer2 {
	constructor(
		private delegate: Renderer2,
		private store: NgtRendererStore,
		private catalogue: Record<string, NgtAnyConstructor>,
		private zone: NgZone,
		private cdr: ChangeDetectorRef,
		private root = true,
	) {}

	createElement(name: string, namespace?: string | null | undefined) {
		const element = this.delegate.createElement(name, namespace);

		// on first pass, we return the Root Scene as the root node
		if (this.root) {
			this.root = false;
			const node = this.store.createNode('three', this.store.rootScene);
			node.__ngt_renderer__[NgtRendererClassId.injectorFactory] = () => getDebugNode(element)!.injector;
			return node;
		}

		// handle compound
		if (this.store.isCompound(name)) {
			return this.store.createNode('compound', element);
		}

		// handle portal
		if (name === SPECIAL_DOM_TAG.NGT_PORTAL) {
			return this.store.createNode('portal', element);
		}

		// handle raw value
		if (name === SPECIAL_DOM_TAG.NGT_VALUE) {
			return this.store.createNode(
				'three',
				Object.assign(
					{ __ngt_renderer__: { rawValue: undefined } },
					// NOTE: we assign this manually to a raw value node
					// because we say it is a 'three' node but we're not using prepare()
					{ __ngt__: { isRaw: true, parent: signal(null) } },
				),
			);
		}

		const { injectedArgs, injectedParent, store } = this.store.getCreationState();

		let parent = injectedParent as NgtRendererState[NgtRendererClassId.injectedParent];
		if (typeof injectedParent === 'string') {
			parent = store
				.get('scene')
				.getObjectByName(injectedParent) as unknown as NgtRendererState[NgtRendererClassId.injectedParent];
		}

		// handle primitive
		if (name === SPECIAL_DOM_TAG.NGT_PRIMITIVE) {
			if (!injectedArgs[0]) throw new Error(`[NGT] ngt-primitive without args is invalid`);
			const object = injectedArgs[0];
			let localState = getLocalState(object);
			if (!Object.keys(localState).length) {
				// NOTE: if an object isn't already "prepared", we prepare it
				localState = getLocalState(prepare(object, { store, args: injectedArgs, primitive: true }));
			}
			if (!localState.store) localState.store = store;
			const node = this.store.createNode('three', object);
			if (parent) {
				node.__ngt_renderer__[NgtRendererClassId.injectedParent] = parent;
			}
			return node;
		}

		const threeTag = name.startsWith('ngt') ? name.slice(4) : name;
		const threeName = kebabToPascal(threeTag);
		const threeTarget = this.catalogue[threeName];
		// we have the THREE constructor here, handle it
		if (threeTarget) {
			const instance = prepare(new threeTarget(...injectedArgs), { store, args: injectedArgs });
			const node = this.store.createNode('three', instance);
			const localState = getLocalState(instance);

			// auto-attach for geometry and material
			if (is.geometry(instance)) {
				localState.attach = ['geometry'];
			} else if (is.material(instance)) {
				localState.attach = ['material'];
			}

			if (parent) {
				node.__ngt_renderer__[NgtRendererClassId.injectedParent] = parent;
			}

			return node;
		}

		return this.store.createNode('dom', element);
	}

	createComment(value: string) {
		return this.store.createNode('comment', this.delegate.createComment(value));
	}

	appendChild(parent: NgtRendererNode, newChild: NgtRendererNode): void {
		const pRS = parent.__ngt_renderer__;
		const cRS = newChild.__ngt_renderer__;

		if (
			pRS[NgtRendererClassId.type] === 'dom' &&
			(newChild instanceof Text || cRS[NgtRendererClassId.type] === 'dom')
		) {
			this.store.addChild(parent, newChild);
			this.delegate.appendChild(parent, newChild);
			return;
		}

		if (cRS?.[NgtRendererClassId.type] === 'comment') {
			this.store.setParent(newChild, parent);
			return;
		}

		if (cRS?.[NgtRendererClassId.injectedParent]) {
			if (is.ref(cRS[NgtRendererClassId.injectedParent])) {
				const injector = cRS[NgtRendererClassId.injectorFactory]().get(Injector, null);
				if (!injector) {
					console.warn(
						`[NGT] NgtRenderer is attempting to start an effect for injectedParent but no Injector is found.`,
					);
					return;
				}
				const watcher = effect(
					() => {
						const injectedParent = (
							cRS[NgtRendererClassId.injectedParent] as NgtInjectedRef<NgtRendererNode>
						).nativeElement;
						if (injectedParent && injectedParent !== parent) {
							this.appendChild(injectedParent, newChild);
							// only run this effect once
							// as soon as we re-run appendChild with the injectedParent, we stop the effect
							watcher.destroy();
						}
					},
					{ injector, manualCleanup: true },
				);
				return;
			} else if (parent !== cRS[NgtRendererClassId.injectedParent]) {
				this.appendChild(cRS[NgtRendererClassId.injectedParent], newChild);
				return;
			}
		}

		this.store.setParent(newChild, parent);
		this.store.addChild(parent, newChild);

		// if new child is a portal
		if (cRS?.[NgtRendererClassId.type] === 'portal') {
			this.store.processPortalContainer(newChild);
			if (cRS[NgtRendererClassId.portalContainer]) {
				this.appendChild(parent, cRS[NgtRendererClassId.portalContainer]);
			}
			return;
		}

		// if parent is a portal
		if (pRS[NgtRendererClassId.type] === 'portal') {
			this.store.processPortalContainer(parent);
			if (pRS[NgtRendererClassId.portalContainer]) {
				this.appendChild(pRS[NgtRendererClassId.portalContainer], newChild);
			}
			return;
		}

		// if both are three instances, straightforward case
		if (pRS[NgtRendererClassId.type] === 'three' && cRS?.[NgtRendererClassId.type] === 'three') {
			// if child already attached to a parent, skip
			if (getLocalState(newChild).parent && untracked(getLocalState(newChild).parent)) return;
			// attach THREE child
			attachThreeChild(parent, newChild);
			// here, we handle the special case of if the parent has a compoundParent, which means this child is part of a compound parent template
			if (!cRS[NgtRendererClassId.compound]) return;
			const closestGrandparentWithCompound = this.store.getClosestParentWithCompound(parent);
			if (!closestGrandparentWithCompound) return;
			this.appendChild(closestGrandparentWithCompound, newChild);
			return;
		}

		// if only the parent is the THREE instance
		if (pRS[NgtRendererClassId.type] === 'three') {
			for (const renderChild of cRS?.[NgtRendererClassId.children]) {
				this.appendChild(parent, renderChild);
			}
		}

		// if parent is a compound
		if (pRS[NgtRendererClassId.type] === 'compound') {
			// if compound doesn't have a THREE instance set yet
			if (!pRS[NgtRendererClassId.compounded] && cRS[NgtRendererClassId.type] === 'three') {
				// if child is indeed an ngtCompound
				if (cRS[NgtRendererClassId.compound]) this.store.setCompound(parent, newChild);
				// if not, we track the parent (that is supposedly the compound component) on this three instance
				else if (!cRS[NgtRendererClassId.compoundParent]) cRS[NgtRendererClassId.compoundParent] = parent;
			}

			// reset the compound if it's changed
			if (
				pRS[NgtRendererClassId.compounded] &&
				cRS[NgtRendererClassId.type] === 'three' &&
				cRS[NgtRendererClassId.compound] &&
				pRS[NgtRendererClassId.compounded] !== newChild
			) {
				this.store.setCompound(parent, newChild);
			}
		}

		if (this.shouldFindGrandparentInstance(pRS, cRS, newChild)) {
			// we'll try to get the grandparent instance here so that we can run appendChild with both instances
			const closestGrandparentInstance = this.store.getClosestParentWithInstance(parent);
			if (closestGrandparentInstance) this.appendChild(closestGrandparentInstance, newChild);
			return;
		}
	}

	insertBefore(
		parent: NgtRendererNode,
		newChild: NgtRendererNode,
		// TODO: we might need these?
		// refChild: NgtRendererNode
		// isMove?: boolean | undefined
	): void {
		if (parent == null || !parent.__ngt_renderer__ || parent === newChild) return;
		this.appendChild(parent, newChild);
	}

	removeChild(parent: NgtRendererNode, oldChild: NgtRendererNode, isHostElement?: boolean | undefined): void {
		const pRS = parent.__ngt_renderer__;
		const cRS = oldChild.__ngt_renderer__;

		if (
			(!cRS || !pRS) &&
			parent instanceof Element &&
			(oldChild instanceof Element || oldChild instanceof Text || oldChild instanceof Comment)
		) {
			this.delegate.removeChild(parent, oldChild);
			this.store.destroy(oldChild, parent);
			return;
		}

		if (cRS[NgtRendererClassId.type] === 'dom' && (!pRS || pRS[NgtRendererClassId.type] === 'dom')) {
			this.delegate.removeChild(parent, oldChild);
			this.store.destroy(oldChild, parent);
			return;
		}

		if (pRS[NgtRendererClassId.type] === 'three' && cRS[NgtRendererClassId.type] === 'three') {
			removeThreeChild(parent, oldChild, true);
			this.store.destroy(oldChild, parent);
			return;
		}

		if (pRS[NgtRendererClassId.type] === 'compound' && pRS[NgtRendererClassId.parent]) {
			this.removeChild(pRS[NgtRendererClassId.parent], oldChild, isHostElement);
			return;
		}

		if (pRS[NgtRendererClassId.type] === 'three') {
			this.store.destroy(oldChild, parent);
			return;
		}

		const closestGrandparentInstance = this.store.getClosestParentWithInstance(parent);
		if (closestGrandparentInstance) this.removeChild(closestGrandparentInstance, oldChild, isHostElement);
		this.store.destroy(oldChild, closestGrandparentInstance as NgtRendererNode);
	}

	parentNode(node: NgtRendererNode) {
		const rS = node.__ngt_renderer__;
		if (rS?.[NgtRendererClassId.parent]) return rS[NgtRendererClassId.parent];
		return this.delegate.parentNode(node);
	}

	setAttribute(el: NgtRendererNode, name: string, value: string, namespace?: string | null | undefined): void {
		const rS = el.__ngt_renderer__;
		if (rS[NgtRendererClassId.type] === 'compound') {
			// we don't have the compound instance yet
			rS[NgtRendererClassId.attributes][name] = value;
			if (!rS[NgtRendererClassId.compounded]) {
				this.store.queueOperation(el, ['op', () => this.setAttribute(el, name, value, namespace)]);
				return;
			}

			this.setAttribute(rS[NgtRendererClassId.compounded], name, value, namespace);
			return;
		}

		if (rS[NgtRendererClassId.type] === 'three') {
			this.store.applyAttribute(el, name, value);
			return;
		}

		return this.delegate.setAttribute(el, name, value);
	}

	setProperty(el: NgtRendererNode, name: string, value: any): void {
		const rS = el.__ngt_renderer__;
		if (rS[NgtRendererClassId.type] === 'compound') {
			// we don't have the compound instance yet
			rS[NgtRendererClassId.properties][name] = value;
			if (!rS[NgtRendererClassId.compounded]) {
				this.store.queueOperation(el, ['op', () => this.setProperty(el, name, value)]);
				return;
			}

			if (rS[NgtRendererClassId.compounded].__ngt_renderer__[NgtRendererClassId.compound]) {
				Object.assign(
					rS[NgtRendererClassId.compounded].__ngt_renderer__[NgtRendererClassId.compound][
						NgtCompoundClassId.props
					],
					{ [name]: value },
				);
			}
			this.setProperty(rS[NgtRendererClassId.compounded], name, value);
			return;
		}

		if (rS[NgtRendererClassId.type] === 'three') {
			this.store.applyProperty(el, name, value);
			return;
		}

		return this.delegate.setProperty(el, name, value);
	}

	listen(target: NgtRendererNode, eventName: string, callback: (event: any) => boolean | void): () => void {
		const rS = target.__ngt_renderer__;

		// if the target doesn't have __ngt_renderer__, we delegate
		// if target is DOM node, then we pass that to delegate Renderer
		if (!rS || this.store.isDOM(target)) {
			return this.delegate.listen(target, eventName, callback);
		}

		if (
			rS[NgtRendererClassId.type] === 'three' ||
			(rS[NgtRendererClassId.type] === 'compound' && rS[NgtRendererClassId.compounded])
		) {
			const instance = rS[NgtRendererClassId.compounded] || target;
			const priority = getLocalState(target).priority;
			const targetCdr =
				rS[NgtRendererClassId.injectorFactory]?.().get(ChangeDetectorRef, null) ||
				rS[NgtRendererClassId.parent]?.__ngt_renderer__?.[NgtRendererClassId.injectorFactory]?.().get(
					ChangeDetectorRef,
					null,
				);

			return processThreeEvent(instance, priority || 0, eventName, callback, this.zone, this.cdr, targetCdr);
		}

		if (rS[NgtRendererClassId.type] === 'compound' && !rS[NgtRendererClassId.compounded]) {
			this.store.queueOperation(target, [
				'op',
				() => this.store.queueOperation(target, ['cleanUp', this.listen(target, eventName, callback)]),
			]);
			return () => {};
		}

		// @ts-expect-error - we know that target is not DOM node
		if (target === this.store.rootScene) {
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

	private shouldFindGrandparentInstance(pRS: NgtRendererState, cRS: NgtRendererState, child: NgtRendererNode) {
		const pType = pRS[NgtRendererClassId.type];
		const cType = cRS[NgtRendererClassId.type];
		const isParentCompounded = pRS[NgtRendererClassId.compounded];
		const isChildCompounded = cRS[NgtRendererClassId.compounded];

		// if child is three but haven't been attached to a parent yet
		const isDanglingThreeChild = cType === 'three' && !untracked(getLocalState(child).parent);
		// or both parent and child are DOM elements
		// or they are compound AND haven't had a THREE instance yet
		const isParentStillDOM = pType === 'dom' || (pType === 'compound' && !isParentCompounded);
		const isChildStillDOM = cType === 'dom' || (cType === 'compound' && !isChildCompounded);
		// and the child is a compounded compound
		const isCompoundChildCompounded = cType === 'compound' && !!isChildCompounded;

		return (
			isDanglingThreeChild ||
			(isParentStillDOM && isChildStillDOM) ||
			(isParentStillDOM && isCompoundChildCompounded)
		);
	}

	createText = this.delegate.createText.bind(this.delegate);
	destroy = this.delegate.destroy.bind(this.delegate);
	destroyNode: ((node: any) => void) | null = null;
	selectRootElement = this.delegate.selectRootElement.bind(this.delegate);
	nextSibling = this.delegate.nextSibling.bind(this.delegate);
	removeAttribute = this.delegate.removeAttribute.bind(this.delegate);
	addClass = this.delegate.addClass.bind(this.delegate);
	removeClass = this.delegate.removeClass.bind(this.delegate);
	setStyle = this.delegate.setStyle.bind(this.delegate);
	removeStyle = this.delegate.removeStyle.bind(this.delegate);
	setValue = this.delegate.setValue.bind(this.delegate);
	get data(): { [key: string]: any } {
		return this.delegate.data;
	}
}

export function provideNgtRenderer(store: NgtStore, compoundPrefixes: string[], cdr: ChangeDetectorRef) {
	if (!compoundPrefixes.includes('ngts')) compoundPrefixes.push('ngts');
	if (!compoundPrefixes.includes('ngtp')) compoundPrefixes.push('ngtp');

	return makeEnvironmentProviders([
		{ provide: RendererFactory2, useClass: NgtRendererFactory },
		{ provide: NGT_COMPOUND_PREFIXES, useValue: compoundPrefixes },
		{ provide: ChangeDetectorRef, useValue: cdr },
		provideNgtStore(store),
		provideZoneChangeDetection({ runCoalescing: true, eventCoalescing: true }),
	]);
}

export { extend } from './catalogue';
export { HTML } from './constants';
