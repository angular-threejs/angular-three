import { ChangeDetectorRef, getDebugNode, Injector } from '@angular/core';
import { NgtQueueOpClassId, NgtRendererClassId } from './enums';

export type NgtRendererRootState = {
    cdr: ChangeDetectorRef;
    compoundPrefixes: string[];
};

export type NgtQueueOp = [type: 'op' | 'cleanUp', op: () => void, done?: true];

export type NgtRendererState = [
    type: 'three' | 'compound' | 'portal' | 'comment' | 'dom',
    parent: NgtRendererNode | null,
    children: NgtRendererNode[],
    removed: boolean,
    compound: [applyFirst: boolean, props: Record<string, any>],
    compoundParent: NgtRendererNode,
    compounded: NgtRendererNode,
    queueOps: Set<NgtQueueOp>,
    attributes: Record<string, any>,
    properties: Record<string, any>,
    rawValue: any,
    ref: any,
    portalContainer: NgtRendererNode
];

export type NgtRendererNode = {
    __ngt_renderer__: NgtRendererState;
};

export class NgtRendererStore {
    private readonly comments = new Set<() => Injector>();
    private readonly portals = new Map<NgtRendererNode, () => Injector>();

    constructor(private readonly root: NgtRendererRootState) {}

    createNode(type: NgtRendererState[NgtRendererClassId.type], node: any) {
        const state = [
            type,
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
        ] as NgtRendererState;

        const rendererNode = Object.assign(node, { __ngt_renderer__: state });

        if (state[NgtRendererClassId.type] === 'comment') {
            rendererNode['__ngt_renderer_add_comment__'] = () => {
                this.comments.add(() => getDebugNode(rendererNode)!.injector);
            };
            return rendererNode;
        }

        if (state[NgtRendererClassId.type] === 'portal') {
            this.portals.set(rendererNode, () => getDebugNode(rendererNode)!.injector);
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

    queueOperation(node: NgtRendererNode, op: NgtQueueOp) {
        node.__ngt_renderer__[NgtRendererClassId.queueOps].add(op);
    }

    executeOperation(node: NgtRendererNode, type: NgtQueueOp[NgtQueueOpClassId.type] = 'op') {
        if (node.__ngt_renderer__[NgtRendererClassId.queueOps]?.size) {
            node.__ngt_renderer__[NgtRendererClassId.queueOps].forEach((op) => {
                if (op[NgtQueueOpClassId.type] === type) {
                    op[NgtQueueOpClassId.op]();
                    node.__ngt_renderer__[NgtRendererClassId.queueOps].delete(op);
                }
            });
        }
    }

    processPortalContainer(portal: NgtRendererNode) {
        const injectorFactory = this.portals.get(portal);
        const injector = injectorFactory?.();
        if (!injector) return;

        const portalStore = injector.get('', null);
        if (!portalStore) return;

        const portalContainer = portalStore.get('scene');
        if (!portalContainer) return;

        portal.__ngt_renderer__[NgtRendererClassId.portalContainer] = this.createNode('three', portalContainer);
    }
}
