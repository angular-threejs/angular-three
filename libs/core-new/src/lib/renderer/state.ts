import { getDebugNode } from '@angular/core';
import { NgtInstanceNode } from '../instance';
import { NGT_STORE } from '../store';
import { NgtAnyRecord } from '../types';

interface NgtRendererState {
	name: string;
	destroyed?: boolean;
	parentNode?: NgtRendererNode;
	childNodes?: NgtRendererNode[];
	trackedBy?: NgtRendererNode;
}

interface NgtInstanceRendererState {
	type: 'three';
}

type NgtInstanceRendererNode = NgtInstanceNode<NgtAnyRecord> & {
	__ngt_renderer__: NgtRendererState & NgtInstanceRendererState;
};

interface NgtCommentRendererState {
	type: 'comment' | 'commentForElement';
	attributes?: NgtAnyRecord;
}

export type NgtCommentRendererNode = Comment & {
	__ngt_renderer__: NgtRendererState & NgtCommentRendererState;
};

interface NgtPortalRendererState {
	type: 'portal';
	attributes?: NgtAnyRecord;
	container?: NgtRendererNode;
}

type NgtPortalRendererNode = Comment & {
	__ngt_renderer__: NgtRendererState & NgtPortalRendererState;
};

export type NgtRendererNode = NgtInstanceRendererNode | NgtCommentRendererNode | NgtPortalRendererNode;
type NgtRendererNodeState = NgtRendererNode['__ngt_renderer__'];

export function createRendererNode<TState extends NgtRendererNodeState>(
	node: NgtInstanceNode | Comment,
	data: NgtRendererNodeState,
): TState['type'] extends 'three'
	? NgtInstanceRendererNode
	: TState['type'] extends 'portal'
		? NgtPortalRendererNode
		: NgtCommentRendererNode {
	if ('__ngt_renderer__' in node) {
		Object.assign(node.__ngt_renderer__, data);
		return node;
	}

	return Object.assign(node, { __ngt_renderer__: data });
}

export function isRendererNode(node: unknown): node is NgtRendererNode {
	return !!node && typeof node === 'object' && '__ngt_renderer__' in node && !!node.__ngt_renderer__;
}

export function getRendererNode(node: unknown): NgtRendererNode | null {
	return isRendererNode(node) ? node : null;
}

export function isCommentNode(
	node: NgtRendererNode,
	specificType?: NgtCommentRendererState['type'],
): node is NgtCommentRendererNode {
	if (specificType) return node.__ngt_renderer__.type === specificType;
	return node.__ngt_renderer__.type === 'commentForElement' || node.__ngt_renderer__.type === 'comment';
}

export function isInstanceNode(node: NgtRendererNode): node is NgtInstanceRendererNode {
	return node.__ngt_renderer__.type === 'three';
}

export function isPortalNode(node: NgtRendererNode): node is NgtPortalRendererNode {
	return node.__ngt_renderer__.type === 'portal';
}

export function trackChildNode(node: NgtRendererNode, child: NgtRendererNode) {
	node.__ngt_renderer__.childNodes ??= [];

	if (!node.__ngt_renderer__.childNodes.includes(child) && !child.__ngt_renderer__.trackedBy) {
		node.__ngt_renderer__.childNodes.push(child);
		child.__ngt_renderer__.trackedBy = node;
	}
}

export function setParentNode(node: NgtRendererNode, parent: NgtRendererNode) {
	if (!node.__ngt_renderer__.parentNode) {
		node.__ngt_renderer__.parentNode = parent;
	}
}

export function getPortalContainer(portalNode: NgtPortalRendererNode) {
	const injector = getDebugNode(portalNode)?.injector;
	if (!injector) return null;

	const store = injector.get(NGT_STORE, null);
	if (!store) return null;

	let portalContainer = store.snapshot.scene as unknown as NgtRendererNode;

	if (!portalContainer) return null;

	if (!isRendererNode(portalContainer)) {
		portalContainer = createRendererNode(portalContainer, {
			type: 'three',
			name: 'PortalScene',
			parentNode: portalNode,
		});
	}

	return portalContainer;
}
