import { DebugNode } from '@angular/core';
import { NgtAnyRecord } from '../types';
import { NgtRendererClassId } from './utils';

export type NgtRendererState = [
	type: 'three' | 'portal' | 'comment' | 'dom',
	parent: NgtRendererNode | null,
	children: NgtRendererNode[],
	destroyed: boolean,
	rawValue: any,
	portalContainer: NgtRendererNode,
	debugNode: DebugNode | undefined,
	debugNodeFactory: () => DebugNode | undefined,
];

export interface NgtRendererNode {
	__ngt_renderer__: NgtRendererState;
	__ngt_dom_parent__?: HTMLElement;
}

export function createNode(type: NgtRendererState[NgtRendererClassId.type], node: NgtAnyRecord, document: Document) {
	const state = [type, null, [], false, undefined!, undefined!, undefined!, undefined!] as NgtRendererState;

	const rendererNode = Object.assign(node, { __ngt_renderer__: state });

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

export function isDOM(node: NgtAnyRecord) {
	const rS = node['__ngt_renderer__'];
	return !rS || node instanceof Element || node instanceof Document || node instanceof Window;
}

export function getClosestParentWithInstance(node: NgtRendererNode): NgtRendererNode | null {
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

export function setParent(node: NgtRendererNode, parent: NgtRendererNode) {
	if (!node.__ngt_renderer__[NgtRendererClassId.parent]) {
		node.__ngt_renderer__[NgtRendererClassId.parent] = parent;
	}
}

export function addChild(node: NgtRendererNode, child: NgtRendererNode) {
	if (!node.__ngt_renderer__[NgtRendererClassId.children].includes(child)) {
		node.__ngt_renderer__[NgtRendererClassId.children].push(child);
	}
}

export function removeChild(node: NgtRendererNode, child: NgtRendererNode) {
	const index = node.__ngt_renderer__?.[NgtRendererClassId.children].findIndex((c) => child === c);
	if (index >= 0) {
		node.__ngt_renderer__[NgtRendererClassId.children].splice(index, 1);
	}
}
