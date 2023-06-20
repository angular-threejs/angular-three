import { DOCUMENT } from '@angular/common';
import {
	ChangeDetectorRef,
	EventEmitter,
	Injectable,
	InjectionToken,
	Injector,
	NgZone,
	Renderer2,
	RendererFactory2,
	RendererType2,
	effect,
	getDebugNode,
	inject,
	makeEnvironmentProviders,
	provideZoneChangeDetection,
	signal,
	untracked,
	type Type,
} from '@angular/core';
import { NgtArgs } from './args';
import type { NgtCommonDirective } from './common';
import { NGT_CATALOGUE } from './di';
import { removeInteractivity } from './events';
import { getLocalState, invalidateInstance, prepare, type NgtInstanceNode } from './instance';
import { NgtParent } from './parent';
import type { NgtInjectedRef } from './ref';
import { NGT_STORE, injectNgtStore, type NgtState } from './store';
import type { NgtAnyRecord } from './types';
import { applyProps, attach, detach, is, safeDetectChanges, type NgtSignalStore } from './utils';

// @internal
const enum NgtRendererClassId {
	type,
	parent,
	injectedParent,
	children,
	destroyed,
	compound,
	compoundParent,
	compounded,
	queueOps,
	attributes,
	properties,
	rawValue,
	ref,
	portalContainer,
	injectorFactory,
}

// @internal
const enum NgtCompoundClassId {
	applyFirst,
	props,
}

// @internal
const enum NgtQueueOpClassId {
	type,
	op,
	done,
}

export const NGT_COMPOUND_PREFIXES = new InjectionToken<string[]>('NgtCompoundPrefixes');

const ROUTED_SCENE = '__ngt_renderer_is_routed_scene__';
export const SPECIAL_INTERNAL_ADD_COMMENT = '__ngt_renderer_add_comment__';

const SPECIAL_DOM_TAG = {
	NGT_PORTAL: 'ngt-portal',
	NGT_PRIMITIVE: 'ngt-primitive',
	NGT_VALUE: 'ngt-value',
} as const;

const SPECIAL_PROPERTIES = {
	COMPOUND: 'ngtCompound',
	RENDER_PRIORITY: 'priority',
	ATTACH: 'attach',
	VALUE: 'rawValue',
	REF: 'ref',
} as const;

const SPECIAL_EVENTS = {
	BEFORE_RENDER: 'beforeRender',
	AFTER_UPDATE: 'afterUpdate',
	AFTER_ATTACH: 'afterAttach',
} as const;

type NgtRendererRootState = {
	store: NgtSignalStore<NgtState>;
	compoundPrefixes: string[];
	document: Document;
	portals: Array<NgtRendererNode>;
};

type NgtQueueOp = [type: 'op' | 'cleanUp', op: () => void, done?: true];

type NgtRendererState = [
	type: 'three' | 'compound' | 'portal' | 'comment' | 'dom',
	parent: NgtRendererNode | null,
	injectedParent: NgtRendererNode | NgtInjectedRef<NgtRendererNode> | null,
	children: NgtRendererNode[],
	destroyed: boolean,
	compound: [applyFirst: boolean, props: Record<string, any>],
	compoundParent: NgtRendererNode,
	compounded: NgtRendererNode,
	queueOps: Set<NgtQueueOp>,
	attributes: Record<string, any>,
	properties: Record<string, any>,
	rawValue: any,
	ref: any,
	portalContainer: NgtRendererNode,
	injectorFactory: () => Injector,
];

type NgtRendererNode = {
	__ngt_renderer__: NgtRendererState;
};

class NgtRendererStore {
	private readonly comments = [] as Array<NgtRendererNode>;

	constructor(private readonly root: NgtRendererRootState) {}

	createNode(type: NgtRendererState[NgtRendererClassId.type], node: NgtAnyRecord) {
		const state = [
			type,
			null,
			null,
			[],
			false,
			undefined!,
			undefined!,
			undefined!,
			undefined!,
			undefined!,
			undefined!,
			undefined!,
			undefined!,
			undefined!,
			undefined!,
		] as NgtRendererState;

		const rendererNode = Object.assign(node, { __ngt_renderer__: state });

		// NOTE: assign ownerDocument to node so we can use HostListener in Component
		if (!rendererNode['ownerDocument']) rendererNode['ownerDocument'] = this.root.document;

		// NOTE: assign injectorFactory on non-three type since
		// rendererNode is an instance of DOM Node
		if (state[NgtRendererClassId.type] !== 'three') {
			state[NgtRendererClassId.injectorFactory] = () => getDebugNode(rendererNode)!.injector;
		}

		if (state[NgtRendererClassId.type] === 'comment') {
			// NOTE: we attach an arrow function to the Comment node
			// In our directives, we can call this function to then start tracking the RendererNode
			// this is done to limit the amount of Nodes we need to process for getCreationState
			rendererNode[SPECIAL_INTERNAL_ADD_COMMENT] = (node?: NgtRendererNode) => {
				if (node && node.__ngt_renderer__[NgtRendererClassId.type] === 'portal') {
					this.portals.push(node);
				} else {
					this.comments.push(rendererNode);
				}
			};
			return rendererNode;
		}

		if (state[NgtRendererClassId.type] === 'compound') {
			state[NgtRendererClassId.queueOps] = new Set();
			state[NgtRendererClassId.attributes] = {};
			state[NgtRendererClassId.properties] = {};
			return rendererNode;
		}

		return rendererNode;
	}

	setParent(node: NgtRendererNode, parent: NgtRendererNode) {
		if (!node.__ngt_renderer__[NgtRendererClassId.parent]) {
			node.__ngt_renderer__[NgtRendererClassId.parent] = parent;
		}
	}

	addChild(node: NgtRendererNode, child: NgtRendererNode) {
		if (!node.__ngt_renderer__[NgtRendererClassId.children].includes(child)) {
			node.__ngt_renderer__[NgtRendererClassId.children].push(child);
		}
	}

	removeChild(node: NgtRendererNode, child: NgtRendererNode) {
		const index = node.__ngt_renderer__[NgtRendererClassId.children].findIndex((c) => child === c);
		if (index >= 0) {
			node.__ngt_renderer__[NgtRendererClassId.children].splice(index, 1);
		}
	}

	setCompound(compound: NgtRendererNode, instance: NgtRendererNode) {
		const rS = compound.__ngt_renderer__;
		rS[NgtRendererClassId.compounded] = instance;
		const attributes = Object.keys(rS[NgtRendererClassId.attributes]);
		const properties = Object.keys(rS[NgtRendererClassId.properties]);

		for (const key of attributes) {
			this.applyAttribute(instance, key, rS[NgtRendererClassId.attributes][key]);
		}

		for (const key of properties) {
			this.applyProperty(instance, key, rS[NgtRendererClassId.properties][key]);
		}

		this.executeOperation(compound);
	}

	queueOperation(node: NgtRendererNode, op: NgtQueueOp) {
		node.__ngt_renderer__[NgtRendererClassId.queueOps].add(op);
	}

	private executeOperation(node: NgtRendererNode, type: NgtQueueOp[NgtQueueOpClassId.type] = 'op') {
		const rS = node.__ngt_renderer__;
		if (rS[NgtRendererClassId.queueOps]?.size) {
			rS[NgtRendererClassId.queueOps].forEach((op) => {
				if (op[NgtQueueOpClassId.type] === type) {
					op[NgtQueueOpClassId.op]();
					rS[NgtRendererClassId.queueOps].delete(op);
				}
			});
		}
	}

	processPortalContainer(portal: NgtRendererNode) {
		const injectorFactory = portal.__ngt_renderer__[NgtRendererClassId.injectorFactory];
		const injector = injectorFactory?.();
		if (!injector) return;

		const portalStore = injector.get(NGT_STORE, null);
		if (!portalStore) return;

		const portalContainer = portalStore.get('scene');
		if (!portalContainer) return;

		portal.__ngt_renderer__[NgtRendererClassId.portalContainer] = this.createNode('three', portalContainer);
	}

	applyAttribute(node: NgtRendererNode, name: string, value: string) {
		const rS = node.__ngt_renderer__;
		if (rS[NgtRendererClassId.destroyed]) return;
		if (name === SPECIAL_PROPERTIES.RENDER_PRIORITY) {
			// priority needs to be set as an attribute string so that they can be set as early as possible
			// we convert that string to a number. if it's invalid, 0
			let priority = Number(value);
			if (isNaN(priority)) {
				priority = 0;
				console.warn(`[NGT] "priority" is an invalid number, default to 0`);
			}
			getLocalState(node).priority = priority;
		}

		if (name === SPECIAL_PROPERTIES.COMPOUND) {
			// we set the compound property on instance node now so we know that this instance is being compounded
			rS[NgtRendererClassId.compound] = [value === '' || value === 'first', {}];
			return;
		}

		if (name === SPECIAL_PROPERTIES.ATTACH) {
			// handle attach as tring
			const paths = value.split('.');
			if (paths.length) getLocalState(node).attach = paths;
			return;
		}

		if (name === SPECIAL_PROPERTIES.VALUE) {
			// coercion
			let maybeCoerced: any = value;
			if (maybeCoerced === '' || maybeCoerced === 'true' || maybeCoerced === 'false') {
				maybeCoerced = maybeCoerced === 'true' || maybeCoerced === '';
			} else if (!isNaN(Number(maybeCoerced))) {
				maybeCoerced = Number(maybeCoerced);
			}
			rS[NgtRendererClassId.rawValue] = maybeCoerced;
			return;
		}

		applyProps(node, { [name]: value });
		this.updateNativeProps(node, name, value);
	}

	applyProperty(node: NgtRendererNode, name: string, value: any) {
		const rS = node.__ngt_renderer__;
		if (rS[NgtRendererClassId.destroyed]) return;

		// [ref]
		if (name === SPECIAL_PROPERTIES.REF && is.ref(value)) {
			rS[NgtRendererClassId.ref] = value;
			value.nativeElement = node;
			return;
		}

		const parent = getLocalState(node).parent() || rS[NgtRendererClassId.parent];

		// [rawValue]
		if (getLocalState(node).isRaw && name === SPECIAL_PROPERTIES.VALUE) {
			rS[NgtRendererClassId.rawValue] = value;
			if (parent) attachThreeChild(parent, node);
			return;
		}

		// [attach]
		if (name === SPECIAL_PROPERTIES.ATTACH) {
			getLocalState(node).attach = Array.isArray(value) ? value.map((v) => v.toString()) : value;
			if (parent) attachThreeChild(parent, node);
			return;
		}

		const compound = rS[NgtRendererClassId.compound];
		if (
			compound?.[NgtCompoundClassId.props] &&
			name in compound[NgtCompoundClassId.props] &&
			!compound[NgtCompoundClassId.applyFirst]
		) {
			value = compound[NgtCompoundClassId.props][name];
		}
		applyProps(node, { [name]: value });
		this.updateNativeProps(node, name, value);
	}

	isCompound(name: string) {
		return this.root.compoundPrefixes.some((prefix) => name.startsWith(prefix));
	}

	isDOM(node: NgtAnyRecord) {
		const rS = node['__ngt_renderer__'];
		return (
			!rS ||
			(rS[NgtRendererClassId.type] !== 'compound' &&
				(node instanceof Element || node instanceof Document || node instanceof Window))
		);
	}

	get rootScene() {
		return this.root.store.get('scene');
	}

	get portals() {
		return this.root.portals;
	}

	getClosestParentWithInstance(node: NgtRendererNode): NgtRendererNode | null {
		let parent = node.__ngt_renderer__[NgtRendererClassId.parent];
		while (parent && parent.__ngt_renderer__[NgtRendererClassId.type] !== 'three') {
			parent = parent.__ngt_renderer__[NgtRendererClassId.portalContainer]
				? parent.__ngt_renderer__[NgtRendererClassId.portalContainer]
				: parent.__ngt_renderer__[NgtRendererClassId.parent];
		}

		return parent;
	}

	getClosestParentWithCompound(node: NgtRendererNode) {
		if (node.__ngt_renderer__[NgtRendererClassId.compoundParent]) {
			return node.__ngt_renderer__[NgtRendererClassId.compoundParent];
		}

		let parent = node.__ngt_renderer__[NgtRendererClassId.parent];
		if (
			parent &&
			parent.__ngt_renderer__[NgtRendererClassId.type] === 'compound' &&
			!parent.__ngt_renderer__[NgtRendererClassId.compounded]
		) {
			return parent;
		}

		while (
			parent &&
			(parent.__ngt_renderer__[NgtRendererClassId.type] === 'three' ||
				!parent.__ngt_renderer__[NgtRendererClassId.compoundParent] ||
				parent.__ngt_renderer__[NgtRendererClassId.type] !== 'compound')
		) {
			parent = parent.__ngt_renderer__[NgtRendererClassId.parent];
		}

		if (!parent) return;

		if (
			parent.__ngt_renderer__[NgtRendererClassId.type] === 'three' &&
			parent.__ngt_renderer__[NgtRendererClassId.compoundParent]
		) {
			return parent.__ngt_renderer__[NgtRendererClassId.compoundParent];
		}

		if (!parent.__ngt_renderer__[NgtRendererClassId.compounded]) {
			return parent;
		}

		return null;
	}

	getCreationState() {
		const injectedArgs = this.firstNonInjectedDirective(NgtArgs)?.args || [];
		const injectedParent = this.firstNonInjectedDirective(NgtParent)?.parent || null;
		const store = this.tryGetPortalStore();
		return { injectedArgs, injectedParent, store };
	}

	destroy(node: NgtRendererNode, parent?: NgtRendererNode) {
		const rS = node.__ngt_renderer__;
		if (rS[NgtRendererClassId.destroyed]) return;
		if (rS[NgtRendererClassId.type] === 'three') {
			rS[NgtRendererClassId.compound] = undefined!;
			rS[NgtRendererClassId.compoundParent] = undefined!;

			const localState = getLocalState(node);
			if (localState.objects) {
				untracked(localState.objects).forEach((obj) => this.destroy(obj, parent));
			}

			if (localState.nonObjects) {
				untracked(localState.nonObjects).forEach((obj) => this.destroy(obj, parent));
			}

			if (localState.afterUpdate) localState.afterUpdate.complete();
			if (localState.afterAttach) localState.afterAttach.complete();

			delete (localState as NgtAnyRecord)['objects'];
			delete (localState as NgtAnyRecord)['nonObjects'];
			delete (localState as NgtAnyRecord)['nativeProps'];
			delete (localState as NgtAnyRecord)['add'];
			delete (localState as NgtAnyRecord)['remove'];
			delete (localState as NgtAnyRecord)['afterUpdate'];
			delete (localState as NgtAnyRecord)['afterAttach'];
			delete (localState as NgtAnyRecord)['store'];
			delete (localState as NgtAnyRecord)['handlers'];

			if (!localState.primitive) {
				delete (node as NgtAnyRecord)['__ngt__'];
			}
		}

		if (rS[NgtRendererClassId.type] === 'comment') {
			rS[NgtRendererClassId.injectorFactory] = null!;
			delete (node as NgtAnyRecord)[SPECIAL_INTERNAL_ADD_COMMENT];
			const index = this.comments.findIndex((comment) => comment === node);
			if (index > -1) {
				this.comments.splice(index, 1);
			}
		}

		if (rS[NgtRendererClassId.type] === 'portal') {
			rS[NgtRendererClassId.injectorFactory] = null!;
			const index = this.portals.findIndex((portal) => portal === node);
			if (index > -1) {
				this.portals.splice(index, 1);
			}
		}

		if (rS[NgtRendererClassId.type] === 'compound') {
			rS[NgtRendererClassId.compounded] = undefined!;
			rS[NgtRendererClassId.attributes] = null!;
			rS[NgtRendererClassId.properties] = null!;
			this.executeOperation(node, 'cleanUp');
			rS[NgtRendererClassId.queueOps].clear();
			rS[NgtRendererClassId.queueOps] = null!;
		}

		if (rS[NgtRendererClassId.ref]) {
			// nullify ref
			rS[NgtRendererClassId.ref].nativeElement = null;
			rS[NgtRendererClassId.ref] = undefined!;
		}

		// nullify parent
		rS[NgtRendererClassId.parent] = null;
		for (const renderChild of rS[NgtRendererClassId.children] || []) {
			if (renderChild.__ngt_renderer__[NgtRendererClassId.type] === 'three' && parent) {
				removeThreeChild(parent, renderChild, true);
			}
			this.destroy(renderChild, parent);
		}

		rS[NgtRendererClassId.children] = [];
		rS[NgtRendererClassId.destroyed] = true;
		if (parent) {
			this.removeChild(parent, node);
		}
	}

	private updateNativeProps(node: NgtInstanceNode, key: string, value: any) {
		const localState = getLocalState(node);
		if (!localState || !localState.nativeProps) return;
		queueMicrotask(() => {
			localState.nativeProps.set({ [key]: value });
		});
	}

	private firstNonInjectedDirective<T extends NgtCommonDirective>(dir: Type<T>) {
		let directive: T | undefined;

		let i = this.comments.length - 1;
		while (i >= 0) {
			const comment = this.comments[i];
			if (comment.__ngt_renderer__[NgtRendererClassId.destroyed]) {
				i--;
				continue;
			}
			const injector = comment.__ngt_renderer__[NgtRendererClassId.injectorFactory]();
			if (!injector) {
				i--;
				continue;
			}
			const instance = injector.get(dir, null);
			if (instance && instance.validate()) {
				directive = instance;
				break;
			}

			i--;
		}

		return directive;
	}

	private tryGetPortalStore() {
		let store: NgtSignalStore<NgtState> | undefined;
		// we only care about the portal states because NgtStore only differs per Portal
		let i = this.portals.length - 1;
		while (i >= 0) {
			// loop through the portal state backwards to find the closest NgtStore
			const portal = this.portals[i];
			if (portal.__ngt_renderer__[NgtRendererClassId.destroyed]) {
				i--;
				continue;
			}

			const injector = portal.__ngt_renderer__[NgtRendererClassId.injectorFactory]();
			if (!injector) {
				i--;
				continue;
			}
			const instance = injector.get(NGT_STORE, null);
			// only the instance with previousRoot should pass
			if (instance && instance.get('previousRoot')) {
				store = instance;
				break;
			}
			i--;
		}
		return store || this.root!.store;
	}
}

@Injectable()
class NgtRendererFactory implements RendererFactory2 {
	private delegateRendererFactory = inject(RendererFactory2, { skipSelf: true });
	private catalogue = inject(NGT_CATALOGUE);
	private zone = inject(NgZone);
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
		const delegateRenderer = this.delegateRendererFactory.createRenderer(hostElement, type);
		if (!type) return delegateRenderer;
		// TODO: handle html in canvas
		// if ((type as NgtAnyRecord)['type']['isHtml']) {
		// return delegateRenderer;
		// }
		if ((type as NgtAnyRecord)['type'][ROUTED_SCENE]) {
			this.routedSet.add(type.id);
		}
		let renderer = this.rendererMap.get(type.id);
		if (!renderer) {
			renderer = new NgtRenderer(
				delegateRenderer,
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
		private catalogue: Record<string, new (...args: any[]) => any>,
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
		// TODO: just ignore text node for now
		if (newChild instanceof Text) return;
		const cRS = newChild.__ngt_renderer__;
		const pRS = parent.__ngt_renderer__;

		if (cRS[NgtRendererClassId.type] === 'comment') {
			this.store.setParent(newChild, parent);
			return;
		}

		if (cRS[NgtRendererClassId.injectedParent]) {
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
		if (cRS[NgtRendererClassId.type] === 'portal') {
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
		if (pRS[NgtRendererClassId.type] === 'three' && cRS[NgtRendererClassId.type] === 'three') {
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
			for (const renderChild of cRS[NgtRendererClassId.children]) {
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

		const shouldFindGrandparentInstance =
			// if child is three but haven't been attached to a parent yet
			(cRS[NgtRendererClassId.type] === 'three' && !untracked(getLocalState(newChild).parent)) ||
			// or both parent and child are DOM elements
			// or they are compound AND haven't had a THREE instance yet
			((pRS[NgtRendererClassId.type] === 'dom' ||
				(pRS[NgtRendererClassId.type] === 'compound' && !pRS[NgtRendererClassId.compounded])) &&
				(cRS[NgtRendererClassId.type] === 'dom' ||
					(cRS[NgtRendererClassId.type] === 'compound' && !cRS[NgtRendererClassId.compounded])));

		if (shouldFindGrandparentInstance) {
			// we'll try to get the grandparent instance here so that we can run appendChild with both instances
			const closestGrandparentInstance = this.store.getClosestParentWithInstance(parent);
			if (closestGrandparentInstance) this.appendChild(closestGrandparentInstance, newChild);
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

		if (rS[NgtRendererClassId.type] === 'three') this.store.applyAttribute(el, name, value);
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
				Object.assign(rS[NgtRendererClassId.compounded].__ngt_renderer__[NgtRendererClassId.compound], {
					props: Object.assign(
						rS[NgtRendererClassId.compounded].__ngt_renderer__[NgtRendererClassId.compound],
						{ [name]: value },
					),
				});
			}
			this.setProperty(rS[NgtRendererClassId.compounded], name, value);
			return;
		}

		if (rS[NgtRendererClassId.type] === 'three') this.store.applyProperty(el, name, value);
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

function processThreeEvent(
	instance: NgtInstanceNode,
	priority: number,
	eventName: string,
	callback: (event: any) => void,
	zone: NgZone,
	cdr: ChangeDetectorRef,
	targetCdr?: ChangeDetectorRef | null,
): () => void {
	const lS = getLocalState(instance);
	if (eventName === SPECIAL_EVENTS.BEFORE_RENDER) {
		return lS.store
			.get('internal')
			.subscribe((state) => callback({ state, object: instance }), priority || lS.priority || 0);
	}

	if (eventName === SPECIAL_EVENTS.AFTER_UPDATE || eventName === SPECIAL_EVENTS.AFTER_ATTACH) {
		let emitter = lS[eventName];
		if (!emitter) emitter = lS[eventName] = new EventEmitter();
		const sub = emitter.subscribe(callback);
		return sub.unsubscribe.bind(sub);
	}

	if (!lS.handlers) lS.handlers = {};

	// try to get the previous handler. compound might have one, the THREE object might also have one with the same name
	const previousHandler = lS.handlers[eventName as keyof typeof lS.handlers];
	// readjust the callback
	const updatedCallback: typeof callback = (event) => {
		if (previousHandler) previousHandler(event);
		zone.run(() => {
			callback(event);
			safeDetectChanges(targetCdr);
			safeDetectChanges(cdr);
		});
	};

	Object.assign(lS.handlers, { [eventName]: updatedCallback });

	// increment the count everytime
	lS.eventCount += 1;
	// but only add the instance (target) to the interaction array (so that it is handled by the EventManager with Raycast)
	// the first time eventCount is incremented
	if (lS.eventCount === 1 && instance['raycast']) lS.store.get('internal', 'interaction').push(instance);

	// clean up the event listener by removing the target from the interaction array
	return () => {
		const localState = getLocalState(instance);
		if (localState && localState.eventCount) {
			const index = localState.store
				.get('internal', 'interaction')
				.findIndex((obj) => obj.uuid === instance.uuid);
			if (index >= 0) localState.store.get('internal', 'interaction').splice(index, 1);
		}
	};
}

function attachThreeChild(parent: NgtInstanceNode, child: NgtInstanceNode) {
	const pLS = getLocalState(parent);
	const cLS = getLocalState(child);

	if (!pLS || !cLS) {
		throw new Error(`[NGT] THREE instances need to be prepared with local state.`);
	}

	// whether the child is added to the parent with parent.add()
	let added = false;

	// assign store on child if not already exist
	// or child store is the parent of parent store
	if (!cLS.store || cLS.store === pLS.store.get('previousRoot')) {
		cLS.store = pLS.store;
	}

	if (cLS.attach) {
		const attachProp = cLS.attach;

		if (typeof attachProp === 'function') {
			const attachCleanUp = attachProp(parent, child, cLS.store);
			if (attachCleanUp) cLS.previousAttach = attachCleanUp;
		} else {
			// we skip attach none if set explicitly
			if (attachProp[0] === 'none') {
				invalidateInstance(child);
				return;
			}

			// handle material array
			if (
				attachProp[0] === 'material' &&
				attachProp[1] &&
				typeof Number(attachProp[1]) === 'number' &&
				is.material(child) &&
				!Array.isArray(parent['material'])
			) {
				parent['material'] = [];
			}

			// attach
			if (cLS.isRaw) {
				if (cLS.parent) {
					untracked(() => {
						cLS.parent.set(parent);
					});
				}
				// at this point we don't have rawValue yet, so we bail and wait until the Renderer recalls attach
				if (child.__ngt_renderer__[NgtRendererClassId.rawValue] === undefined) return;
				attach(parent, child.__ngt_renderer__[NgtRendererClassId.rawValue], attachProp);
			} else {
				attach(parent, child, attachProp);
			}
			// save value
			cLS.previousAttach = attachProp.reduce((value, property) => value[property], parent);
		}
	} else if (is.object3D(parent) && is.object3D(child)) {
		parent.add(child);
		added = true;
	}

	pLS.add(child, added ? 'objects' : 'nonObjects');

	if (cLS.parent) {
		untracked(() => {
			cLS.parent.set(parent);
		});
	}

	if (cLS.afterAttach) cLS.afterAttach.emit({ parent, node: child });

	invalidateInstance(child);
	invalidateInstance(parent);
}

function removeThreeChild(parent: NgtInstanceNode, child: NgtInstanceNode, dispose?: boolean) {
	const pLS = getLocalState(parent);
	const cLS = getLocalState(child);

	// clear parent ref
	untracked(() => {
		cLS.parent?.set(null);
	});

	// remove child from parent
	if (untracked(pLS.objects)) pLS.remove(child, 'objects');
	if (untracked(pLS.nonObjects)) pLS.remove(child, 'nonObjects');

	if (cLS.attach) {
		detach(parent, child, cLS.attach);
	} else if (is.object3D(parent) && is.object3D(child)) {
		parent.remove(child);
		removeInteractivity(cLS.store || pLS.store, child);
	}

	const isPrimitive = cLS.primitive;
	if (!isPrimitive) {
		removeThreeRecursive(cLS.objects ? untracked(cLS.objects) : [], child, !!dispose);
		removeThreeRecursive(child.children, child, !!dispose);
	}

	// dispose
	if (!isPrimitive && child['dispose'] && !is.scene(child)) {
		queueMicrotask(() => child['dispose']());
	}

	invalidateInstance(parent);
}

function removeThreeRecursive(array: NgtInstanceNode[], parent: NgtInstanceNode, dispose: boolean) {
	if (array) [...array].forEach((child) => removeThreeChild(parent, child, dispose));
}

function kebabToPascal(str: string): string {
	// split the string at each hyphen
	const parts = str.split('-');

	// map over the parts, capitalizing the first letter of each part
	const pascalParts = parts.map((part) => part.charAt(0).toUpperCase() + part.slice(1));

	// join the parts together to create the final PascalCase string
	return pascalParts.join('');
}

export type NgtRendererProviderOptions = {
	store: NgtSignalStore<NgtState>;
	changeDetectorRef: ChangeDetectorRef;
	compoundPrefixes?: string[];
};

export function provideNgtRenderer({ store, changeDetectorRef, compoundPrefixes = [] }: NgtRendererProviderOptions) {
	if (!compoundPrefixes.includes('ngts')) compoundPrefixes.push('ngts');
	if (!compoundPrefixes.includes('ngtp')) compoundPrefixes.push('ngtp');

	return makeEnvironmentProviders([
		{ provide: RendererFactory2, useClass: NgtRendererFactory },
		{ provide: NGT_STORE, useValue: store },
		{ provide: ChangeDetectorRef, useValue: changeDetectorRef },
		{ provide: NGT_COMPOUND_PREFIXES, useValue: compoundPrefixes },
		provideZoneChangeDetection({ runCoalescing: true, eventCoalescing: true }),
	]);
}
