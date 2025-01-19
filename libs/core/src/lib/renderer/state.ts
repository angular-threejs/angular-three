import { Injector } from '@angular/core';
import type { NgtAnyRecord } from '../types';
import { NGT_DOM_PARENT_FLAG, NGT_GET_NODE_ATTRIBUTE_FLAG, NGT_RENDERER_NODE_FLAG } from './constants';
import { NgtRendererClassId } from './utils';

type ThreeRendererState = [
	type: 'three',
	destroyed: boolean,
	rawValue: any | undefined,
	portalContainer: never | undefined,
	injector: never | undefined,
	// ThreeRendererState is the case where *parent is used
	parent: NgtRendererNode<'platform' | 'portal' | 'three'> | undefined,
	children: Array<NgtRendererNode<'platform' | 'portal' | 'comment'>>,
];

type PortalRendererState = [
	type: 'portal',
	destroyed: boolean,
	rawValue: never | undefined,
	portalContainer: NgtRendererNode<'three'> | undefined,
	injector: Injector | undefined,
	parent: any | undefined,
	children: any[],
];

type PlatformRendererState = [
	type: 'platform',
	destroyed: boolean,
	rawValue: never | undefined,
	portalContainer: never | undefined,
	injector: never | undefined,
	parent: NgtRendererNode<'three' | 'portal'> | undefined,
	children: Array<NgtRendererNode<'three' | 'portal' | 'comment'>>,
];

type CommentRendererState = [
	type: 'comment',
	destroyed: boolean,
	rawValue: never | undefined,
	portalContainer: never | undefined,
	injector: Injector | undefined,
	parent: NgtRendererNode | undefined,
	children: NgtRendererNode[],
];

type TextRendererState = [
	type: 'text',
	destroyed: boolean,
	rawValue: never | undefined,
	portalContainer: never | undefined,
	injector: never | undefined,
	parent: NgtRendererNode | undefined,
	children: NgtRendererNode[],
];

type NgtRendererStateMap = {
	three: ThreeRendererState;
	portal: PortalRendererState;
	platform: PlatformRendererState;
	comment: CommentRendererState;
	text: TextRendererState;
};

export type NgtRendererState =
	| ThreeRendererState
	| PortalRendererState
	| PlatformRendererState
	| CommentRendererState
	| TextRendererState;

export interface NgtRendererNode<TType extends keyof NgtRendererStateMap = keyof NgtRendererStateMap>
	extends NgtAnyRecord {
	[NGT_RENDERER_NODE_FLAG]: NgtRendererStateMap[TType];
	[NGT_DOM_PARENT_FLAG]?: HTMLElement;
}

export function isRendererNode(node: unknown): node is NgtRendererNode {
	return !!node && typeof node === 'object' && NGT_RENDERER_NODE_FLAG in node;
}

export function createRendererNode<TType extends keyof NgtRendererStateMap>(
	type: TType,
	node: NgtAnyRecord,
	document: Document,
) {
	const state = [type, false, undefined, undefined, undefined, undefined, []] as NgtRendererState;
	const rendererNode = Object.assign(node, { [NGT_RENDERER_NODE_FLAG]: state });

	// NOTE: assign ownerDocument to node so we can use HostListener in Component
	if (!rendererNode['ownerDocument']) rendererNode['ownerDocument'] = document;

	// NOTE: Angular SSR calls `node.getAttribute()` to retrieve hydration info on a node
	if (!('getAttribute' in rendererNode) || typeof rendererNode['getAttribute'] !== 'function') {
		const getNodeAttribute = (name: string) => rendererNode[name];
		getNodeAttribute[NGT_GET_NODE_ATTRIBUTE_FLAG] = true;
		Object.defineProperty(rendererNode, 'getAttribute', { value: getNodeAttribute, configurable: true });
	}

	return rendererNode as NgtRendererNode<TType>;
}

export function setRendererParentNode(node: NgtRendererNode, parent: NgtRendererNode) {
	if (!node.__ngt_renderer__[NgtRendererClassId.parent]) {
		node.__ngt_renderer__[NgtRendererClassId.parent] = parent;
	}
}

export function addRendererChildNode(node: NgtRendererNode, child: NgtRendererNode) {
	if (!node.__ngt_renderer__[NgtRendererClassId.children].includes(child)) {
		node.__ngt_renderer__[NgtRendererClassId.children].push(child);
	}
}
