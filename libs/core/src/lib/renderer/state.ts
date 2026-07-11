import { Injector } from '@angular/core';
import type { NgtAnyRecord, NgtState } from '../types';
import type { SignalState } from '../utils/signal-state';
import { NGT_DOM_PARENT_FLAG, NGT_GET_NODE_ATTRIBUTE_FLAG, NGT_RENDERER_NODE_FLAG } from './constants';

// @internal
export const enum NgtRendererClassId {
	type,
	destroyed,
	rawValue,
	portalContainer,
	parent,
	children,
	parentOverride,
	anchor,
	owner,
	ownedNodes,
}

export type NgtRendererAnchor =
	| {
			kind: 'canvas' | 'portal';
			store: SignalState<NgtState>;
			domParent?: NgtRendererNode<'portal'>;
	  }
	| { kind: 'args' | 'parent'; injector: Injector };

type ThreeRendererState = [
	type: 'three',
	destroyed: boolean,
	rawValue: any | undefined,
	portalContainer: never | undefined,
	// ThreeRendererState is the case where *parent is used
	parent: NgtRendererNode | undefined,
	children: NgtRendererNode[],
	parentOverride: NgtRendererNode<'three'> | undefined,
	anchor: NgtRendererAnchor | undefined,
	owner: NgtRendererNode | undefined,
	ownedNodes: Set<NgtRendererNode> | undefined,
];

type PortalRendererState = [
	type: 'portal',
	destroyed: boolean,
	rawValue: never | undefined,
	portalContainer: NgtRendererNode<'three'> | undefined,
	parent: NgtRendererNode | undefined,
	children: NgtRendererNode[],
	parentOverride: never | undefined,
	anchor: NgtRendererAnchor | undefined,
	owner: NgtRendererNode | undefined,
	ownedNodes: Set<NgtRendererNode> | undefined,
];

type PlatformRendererState = [
	type: 'platform',
	destroyed: boolean,
	rawValue: never | undefined,
	portalContainer: never | undefined,
	parent: NgtRendererNode | undefined,
	children: NgtRendererNode[],
	parentOverride: never | undefined,
	anchor: NgtRendererAnchor | undefined,
	owner: NgtRendererNode | undefined,
	ownedNodes: Set<NgtRendererNode> | undefined,
];

type CommentRendererState = [
	type: 'comment',
	destroyed: boolean,
	rawValue: never | undefined,
	portalContainer: never | undefined,
	parent: NgtRendererNode | undefined,
	children: NgtRendererNode[],
	parentOverride: never | undefined,
	anchor: NgtRendererAnchor | undefined,
	owner: NgtRendererNode | undefined,
	ownedNodes: Set<NgtRendererNode> | undefined,
];

type TextRendererState = [
	type: 'text',
	destroyed: boolean,
	rawValue: never | undefined,
	portalContainer: never | undefined,
	parent: NgtRendererNode | undefined,
	children: NgtRendererNode[],
	parentOverride: never | undefined,
	anchor: NgtRendererAnchor | undefined,
	owner: NgtRendererNode | undefined,
	ownedNodes: Set<NgtRendererNode> | undefined,
];

type NgtRendererStateMap = {
	three: ThreeRendererState;
	portal: PortalRendererState;
	platform: PlatformRendererState;
	comment: CommentRendererState;
	text: TextRendererState;
};

export type NgtRendererNodeType = keyof NgtRendererStateMap;

export type NgtRendererState =
	| ThreeRendererState
	| PortalRendererState
	| PlatformRendererState
	| CommentRendererState
	| TextRendererState;

export interface NgtRendererNode<TType extends NgtRendererNodeType = NgtRendererNodeType> extends NgtAnyRecord {
	[NGT_RENDERER_NODE_FLAG]: NgtRendererStateMap[TType];
	[NGT_DOM_PARENT_FLAG]?: HTMLElement;
}

export function isRendererNode(node: unknown): node is NgtRendererNode {
	return !!node && typeof node === 'object' && NGT_RENDERER_NODE_FLAG in node;
}

export function isRendererNodeType<TType extends NgtRendererNodeType>(
	node: unknown,
	type: TType,
): node is NgtRendererNode<TType> {
	return isRendererNode(node) && node.__ngt_renderer__[NgtRendererClassId.type] === type;
}

export function createRendererNode<TType extends NgtRendererNodeType, TNode extends NgtAnyRecord>(
	type: TType,
	node: TNode,
	document: Document,
) {
	const state = [
		type,
		false,
		undefined,
		undefined,
		undefined,
		[],
		undefined,
		undefined,
		undefined,
		undefined,
	] as NgtRendererState;
	const rendererNode = Object.assign(node, { [NGT_RENDERER_NODE_FLAG]: state }) as NgtAnyRecord & {
		[NGT_RENDERER_NODE_FLAG]: NgtRendererState;
	};

	// NOTE: assign ownerDocument to node so we can use HostListener in Component
	if (!rendererNode['ownerDocument']) rendererNode['ownerDocument'] = document;

	// NOTE: Angular SSR calls `node.getAttribute()` to retrieve hydration info on a node
	if (!('getAttribute' in rendererNode) || typeof rendererNode['getAttribute'] !== 'function') {
		const getNodeAttribute = (name: string) => rendererNode[name];
		getNodeAttribute[NGT_GET_NODE_ATTRIBUTE_FLAG] = true;
		Object.defineProperty(rendererNode, 'getAttribute', { value: getNodeAttribute, configurable: true });
	}

	return rendererNode as TNode & NgtRendererNode<TType>;
}

export function removeRendererChildNode(parent: NgtRendererNode, child: NgtRendererNode) {
	const parentState = parent.__ngt_renderer__;
	const childState = child.__ngt_renderer__;
	const childIndex = parentState[NgtRendererClassId.children].indexOf(child);
	if (childIndex >= 0) parentState[NgtRendererClassId.children].splice(childIndex, 1);
	if (childState[NgtRendererClassId.parent] === parent) {
		childState[NgtRendererClassId.parent] = undefined;
	}
}

export function insertRendererChildNode(
	parent: NgtRendererNode,
	child: NgtRendererNode,
	refChild?: NgtRendererNode | null,
) {
	if (parent === child || refChild === child) return;

	const childState = child.__ngt_renderer__;
	const previousParent = childState[NgtRendererClassId.parent];
	if (previousParent && isRendererNode(previousParent)) {
		removeRendererChildNode(previousParent, child);
	}

	const children = parent.__ngt_renderer__[NgtRendererClassId.children];
	const refIndex = refChild ? children.indexOf(refChild) : -1;
	children.splice(refIndex >= 0 ? refIndex : children.length, 0, child);
	childState[NgtRendererClassId.parent] = parent;
	assignRendererOwner(parent, child, refChild);
}

export function getRendererNextSibling(node: NgtRendererNode) {
	const parent = node.__ngt_renderer__[NgtRendererClassId.parent];
	if (!parent || !isRendererNode(parent)) return null;
	const siblings = parent.__ngt_renderer__[NgtRendererClassId.children];
	const index = siblings.indexOf(node);
	return index >= 0 ? (siblings[index + 1] ?? null) : null;
}

export function setRendererAnchor(node: unknown, anchor: NgtRendererAnchor) {
	if (!isRendererNode(node)) return false;
	node.__ngt_renderer__[NgtRendererClassId.anchor] = anchor;
	return true;
}

export function getRendererAnchor(node: unknown): NgtRendererAnchor | undefined {
	return isRendererNode(node) ? node.__ngt_renderer__[NgtRendererClassId.anchor] : undefined;
}

export function markRendererViewHost(node: NgtRendererNode) {
	const state = node.__ngt_renderer__;
	state[NgtRendererClassId.ownedNodes] ??= new Set();
}

export function assignRendererOwner(
	parent: NgtRendererNode,
	child: NgtRendererNode,
	reference?: NgtRendererNode | null,
) {
	const parentState = parent.__ngt_renderer__;
	const childState = child.__ngt_renderer__;
	if (childState[NgtRendererClassId.owner]) return;

	const parentOwner = parentState[NgtRendererClassId.ownedNodes] ? parent : parentState[NgtRendererClassId.owner];
	// Canvas and portal anchors are owned by their declaring view but are not logical
	// children of the Three scene returned from parentNode(). Angular still supplies the
	// anchor as the insertion reference, making it the lifecycle bridge into that scene.
	const referenceOwner = isRendererNode(reference) ? reference.__ngt_renderer__[NgtRendererClassId.owner] : undefined;
	const owner = parentOwner ?? referenceOwner;
	if (!owner) return;
	childState[NgtRendererClassId.owner] = owner;
	owner.__ngt_renderer__[NgtRendererClassId.ownedNodes]?.add(child);
}

export function releaseRendererOwner(node: NgtRendererNode, clear = true) {
	const state = node.__ngt_renderer__;
	const owner = state[NgtRendererClassId.owner];
	if (owner !== node) owner?.__ngt_renderer__[NgtRendererClassId.ownedNodes]?.delete(node);
	if (clear) state[NgtRendererClassId.owner] = undefined;
}
