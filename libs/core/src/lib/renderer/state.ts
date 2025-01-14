import { DebugNode } from '@angular/core';
import type { NgtAnyRecord, NgtState } from '../types';
import { SignalState } from '../utils/signal-state';
import { NGT_RENDERER_NODE_FLAG } from './constants';
import { NgtRendererClassId } from './utils';

export type NgtRendererState = [
	type: 'three' | 'portal' | 'comment' | 'platform' | 'text',
	parent: NgtRendererNode | null,
	children: NgtRendererNode[],
	destroyed: boolean,
	rawValue: any,
	portalContainer: NgtRendererNode,
	debugNode: DebugNode | undefined,
	debugNodeFactory: (() => DebugNode | undefined) | undefined,
	store: SignalState<NgtState>,
];

export interface NgtRendererNode {
	[NGT_RENDERER_NODE_FLAG]: NgtRendererState;
	__ngt_dom_parent__?: HTMLElement;
}

export function isRendererNode(node: unknown): node is NgtRendererNode {
	return !!node && typeof node === 'object' && NGT_RENDERER_NODE_FLAG in node;
}

export function createRendererNode(
	type: NgtRendererState[NgtRendererClassId.type],
	store: SignalState<NgtState>,
	node: NgtAnyRecord,
	document: Document,
) {
	const state = [type, null, [], false, undefined!, undefined!, undefined!, undefined!, store] as NgtRendererState;
	const rendererNode = Object.assign(node, { [NGT_RENDERER_NODE_FLAG]: state });

	// NOTE: assign ownerDocument to node so we can use HostListener in Component
	if (!rendererNode['ownerDocument']) rendererNode['ownerDocument'] = document;

	// NOTE: assign injectorFactory on non-three type since
	// rendererNode is an instance of DOM Node
	if (state[NgtRendererClassId.type] !== 'three') {
		state[NgtRendererClassId.debugNodeFactory] = () => {
			if (!state[NgtRendererClassId.debugNode]) {
				state[NgtRendererClassId.debugNode] = new DebugNode(rendererNode as unknown as Node);
			}
			return state[NgtRendererClassId.debugNode];
		};
	}

	return rendererNode;
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
