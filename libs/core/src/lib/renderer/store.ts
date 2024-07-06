import { Injector, getDebugNode } from '@angular/core';
import { NgtArgs } from '../directives/args';
import { getLocalState } from '../instance';
import { NGT_STORE, NgtState } from '../store';
import { NgtAnyRecord } from '../types';
import { applyProps } from '../utils/apply-props';
import { NgtSignalStore } from '../utils/signal-store';
import { SPECIAL_INTERNAL_ADD_COMMENT, SPECIAL_PROPERTIES } from './constants';
import { NgtRendererClassId, attachThreeChild, removeThreeChild } from './utils';

export type NgtRendererState = [
	type: 'three' | 'portal' | 'comment' | 'dom',
	parent: NgtRendererNode | null,
	children: NgtRendererNode[],
	destroyed: boolean,
	rawValue: any,
	portalContainer: NgtRendererNode,
	injectorFactory: () => Injector | undefined,
];

export interface NgtRendererNode {
	__ngt_renderer__: NgtRendererState;
}

type NgtRendererRootState = {
	store: NgtSignalStore<NgtState>;
	document: Document;
};

export class NgtRendererStore {
	private argsCommentNodes: Array<NgtRendererNode> = [];
	private portalCommentsNodes: Array<NgtRendererNode> = [];

	constructor(private rootState: NgtRendererRootState) {}

	createNode(type: NgtRendererState[NgtRendererClassId.type], node: NgtAnyRecord) {
		const state = [type, null, [], false, undefined!, undefined!, undefined!] as NgtRendererState;

		const rendererNode = Object.assign(node, { __ngt_renderer__: state });

		// NOTE: assign ownerDocument to node so we can use HostListener in Component
		if (!rendererNode['ownerDocument']) rendererNode['ownerDocument'] = this.rootState.document;

		// NOTE: assign injectorFactory on non-three type since
		// rendererNode is an instance of DOM Node
		if (state[NgtRendererClassId.type] !== 'three') {
			state[NgtRendererClassId.injectorFactory] = () => getDebugNode(rendererNode)?.injector;
		}

		if (state[NgtRendererClassId.type] === 'comment') {
			// NOTE: we attach an arrow function to the Comment node
			// In our directives, we can call this function to then start tracking the RendererNode
			// this is done to limit the amount of Nodes we need to process for getCreationState
			rendererNode[SPECIAL_INTERNAL_ADD_COMMENT] = (node: NgtRendererNode | 'args') => {
				if (node === 'args') {
					this.argsCommentNodes.push(rendererNode);
				} else if (typeof node === 'object') {
					this.portalCommentsNodes.push(node);
				}
			};
			return rendererNode;
		}

		return rendererNode;
	}

	isDOM(node: NgtAnyRecord) {
		const rS = node['__ngt_renderer__'];
		return (
			!rS ||
			(rS[NgtRendererClassId.type] !== 'compound' &&
				(node instanceof Element || node instanceof Document || node instanceof Window))
		);
	}

	getClosestParentWithInstance(node: NgtRendererNode): NgtRendererNode | null {
		let parent = node.__ngt_renderer__[NgtRendererClassId.parent];

		if (
			parent &&
			parent.__ngt_renderer__[NgtRendererClassId.type] === 'portal' &&
			parent.__ngt_renderer__[NgtRendererClassId.portalContainer]?.__ngt_renderer__[NgtRendererClassId.type] === 'three'
		) {
			return parent.__ngt_renderer__[NgtRendererClassId.portalContainer];
		}

		while (parent && parent.__ngt_renderer__[NgtRendererClassId.type] !== 'three') {
			parent = parent.__ngt_renderer__[NgtRendererClassId.portalContainer]
				? parent.__ngt_renderer__[NgtRendererClassId.portalContainer]
				: parent.__ngt_renderer__[NgtRendererClassId.parent];
		}

		return parent;
	}

	processPortalContainer(portal: NgtRendererNode) {
		const injector = portal.__ngt_renderer__[NgtRendererClassId.injectorFactory]?.();
		if (!injector) return;

		const portalStore = injector.get(NGT_STORE, null);
		if (!portalStore) return;

		const portalContainer = portalStore.get('scene');
		if (!portalContainer) return;

		portal.__ngt_renderer__[NgtRendererClassId.portalContainer] = this.createNode('three', portalContainer);
	}

	getCreationState() {
		return [this.getNgtArgs()?.value || [], this.tryGetPortalStore()] as const;
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
		const index = node.__ngt_renderer__?.[NgtRendererClassId.children].findIndex((c) => child === c);
		if (index >= 0) {
			node.__ngt_renderer__[NgtRendererClassId.children].splice(index, 1);
		}
	}

	applyAttribute(node: NgtRendererNode, name: string, value: string) {
		const rS = node.__ngt_renderer__;
		if (rS[NgtRendererClassId.destroyed]) return;
		if (name === SPECIAL_PROPERTIES.RENDER_PRIORITY) {
			// NOTE: priority needs to be set as an attribute string so that they can be set as early as possible
			// we convert that string to a number. if it's invalid, default 0
			let priority = Number(value);
			if (isNaN(priority)) {
				priority = 0;
				console.warn(`[NGT] "priority" is an invalid number, default to 0`);
			}
			const localState = getLocalState(node);
			if (localState) {
				localState.priority = priority;
			}
		}

		if (name === SPECIAL_PROPERTIES.ATTACH) {
			// NOTE: handle attach as string
			const paths = value.split('.');
			if (paths.length) {
				const localState = getLocalState(node);
				if (localState) {
					localState.attach = paths;
				}
			}
			return;
		}

		if (name === SPECIAL_PROPERTIES.RAW_VALUE) {
			// NOTE: coercion
			let maybeCoerced: string | number | boolean = value;
			if (maybeCoerced === '' || maybeCoerced === 'true' || maybeCoerced === 'false') {
				maybeCoerced = maybeCoerced === 'true' || maybeCoerced === '';
			} else if (!isNaN(Number(maybeCoerced))) {
				maybeCoerced = Number(maybeCoerced);
			}
			rS[NgtRendererClassId.rawValue] = maybeCoerced;
			return;
		}

		applyProps(node, { [name]: value });
	}

	applyProperty(node: NgtRendererNode, name: string, value: any) {
		const rS = node.__ngt_renderer__;
		if (rS[NgtRendererClassId.destroyed]) return;

		const localState = getLocalState(node);
		const parent = localState?.instanceStore.get('parent') || rS[NgtRendererClassId.parent];

		// [rawValue]
		if (localState?.isRaw && name === SPECIAL_PROPERTIES.RAW_VALUE) {
			rS[NgtRendererClassId.rawValue] = value;
			if (parent) attachThreeChild(parent, node);
			return;
		}

		// [attach]
		if (name === SPECIAL_PROPERTIES.ATTACH) {
			if (localState)
				localState.attach = Array.isArray(value)
					? value.map((v) => v.toString())
					: typeof value === 'function'
						? value
						: [value];
			if (parent) attachThreeChild(parent, node);
			return;
		}

		applyProps(node, { [name]: value });
	}

	applyParameters(node: NgtRendererNode, parameters: NgtAnyRecord) {
		const rS = node.__ngt_renderer__;
		if (rS[NgtRendererClassId.destroyed]) return;

		applyProps(node, parameters);
	}

	get rootScene() {
		return this.rootState.store.get('scene');
	}

	destroy(node: NgtRendererNode, parent?: NgtRendererNode) {
		const rS = node.__ngt_renderer__;
		if (!rS || rS[NgtRendererClassId.destroyed]) return;
		if (rS[NgtRendererClassId.type] === 'three') {
			const localState = getLocalState(node);
			if (localState?.instanceStore) {
				localState.instanceStore.get('objects').forEach((obj) => this.destroy(obj, parent));
				localState.instanceStore.get('nonObjects').forEach((obj) => this.destroy(obj, parent));
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
			rS[NgtRendererClassId.injectorFactory] = null!;
			delete (node as NgtAnyRecord)[SPECIAL_INTERNAL_ADD_COMMENT];
			this.removeCommentNode(node, this.argsCommentNodes);
		}

		if (rS[NgtRendererClassId.type] === 'portal') {
			rS[NgtRendererClassId.injectorFactory] = null!;
			this.removeCommentNode(node, this.portalCommentsNodes);
		}

		// nullify parent
		rS[NgtRendererClassId.parent] = null;
		for (const renderChild of rS[NgtRendererClassId.children] || []) {
			if (renderChild.__ngt_renderer__?.[NgtRendererClassId.type] === 'three' && parent) {
				if (parent.__ngt_renderer__?.[NgtRendererClassId.type] === 'three') {
					removeThreeChild(parent, renderChild, true);
					continue;
				}

				const closestInstance = this.getClosestParentWithInstance(parent);
				if (closestInstance) {
					removeThreeChild(closestInstance, renderChild, true);
				}
			}
			this.destroy(renderChild, parent);
		}

		rS[NgtRendererClassId.children] = [];
		rS[NgtRendererClassId.destroyed] = true;
		if (parent) {
			this.removeChild(parent, node);
		}
	}

	private removeCommentNode(node: NgtRendererNode, nodes: NgtRendererNode[]) {
		const index = nodes.findIndex((comment) => comment === node);
		if (index > -1) {
			nodes.splice(index, 1);
			return true;
		}
		return false;
	}

	private getNgtArgs() {
		let directive: NgtArgs | undefined;

		const destroyed = [];

		let i = this.argsCommentNodes.length - 1;
		while (i >= 0) {
			const comment = this.argsCommentNodes[i];
			if (comment.__ngt_renderer__[NgtRendererClassId.destroyed]) {
				destroyed.push(i);
				i--;
				continue;
			}
			const injector = comment.__ngt_renderer__[NgtRendererClassId.injectorFactory]();
			if (!injector) {
				i--;
				continue;
			}
			const instance = injector.get(NgtArgs, null);
			if (instance && instance.validate()) {
				directive = instance;
				break;
			}

			i--;
		}

		destroyed.forEach((index) => {
			this.argsCommentNodes.splice(index, 1);
		});

		return directive;
	}

	private tryGetPortalStore() {
		let store: NgtSignalStore<NgtState> | undefined;
		const destroyed = [];
		// we only care about the portal states because NgtStore only differs per Portal
		let i = this.portalCommentsNodes.length - 1;
		while (i >= 0) {
			// loop through the portal state backwards to find the closest NgtStore
			const portal = this.portalCommentsNodes[i];
			if (portal.__ngt_renderer__[NgtRendererClassId.destroyed]) {
				destroyed.push(i);
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

		destroyed.forEach((index) => {
			this.portalCommentsNodes.splice(index, 1);
		});

		return store || this.rootState.store;
	}
}
