import { ChangeDetectorRef, inject, Injectable, Renderer2, RendererFactory2, RendererType2 } from '@angular/core';
import { ɵDomRendererFactory2 as DomRendererFactory2 } from '@angular/platform-browser';
import { NGT_CATALOGUE } from '../di/catalogue';
import { NgtStore } from '../stores/store';
import { getLocalState, prepare } from '../utils/instance';
import { is } from '../utils/is';
import { NGT_COMPOUND_PREFIXES } from './di';
import { NgtRendererClassId } from './enums';
import { NgtRendererNode, NgtRendererStore } from './state';
import { attachThreeChild, kebabToPascal, processThreeEvent, removeThreeChild, SPECIAL_DOM_TAG } from './utils';

@Injectable()
export class NgtRendererFactory implements RendererFactory2 {
    private readonly domRendererFactory = inject(DomRendererFactory2);
    private readonly cdr = inject(ChangeDetectorRef);
    private readonly store = inject(NgtStore);
    private readonly catalogue = inject(NGT_CATALOGUE);
    private readonly compoundPrefixes = inject(NGT_COMPOUND_PREFIXES);

    private readonly rendererStore = new NgtRendererStore({
        store: this.store,
        cdr: this.cdr,
        compoundPrefixes: this.compoundPrefixes,
    });

    private renderer?: NgtRenderer;

    createRenderer(hostElement: any, type: RendererType2 | null): Renderer2 {
        // TODO  we might need to check on "type" to return DomRenderer for that particular type to support HTML
        if (!this.renderer) {
            const domRenderer = this.domRendererFactory.createRenderer(hostElement, type);
            this.renderer = new NgtRenderer(domRenderer, this.rendererStore, this.catalogue);
        }
        return this.renderer;
    }
}

export class NgtRenderer implements Renderer2 {
    private first = false;

    constructor(
        private readonly domRenderer: Renderer2,
        private readonly store: NgtRendererStore,
        private readonly catalogue: Record<string, new (...args: any[]) => any>
    ) {}

    createElement(name: string, namespace?: string | null | undefined) {
        const element = this.domRenderer.createElement(name, namespace);

        // on first pass, we return the Root Scene as the root node
        if (!this.first) {
            this.first = true;
            return this.store.createNode('three', this.store.rootScene);
        }

        // handle compound
        if (this.store.isCompound(name)) return this.store.createNode('compound', element);

        // handle portal
        if (name === SPECIAL_DOM_TAG.NGT_PORTAL) {
            return this.store.createNode('portal', element);
        }

        // handle raw value
        if (name === SPECIAL_DOM_TAG.NGT_VALUE) {
            return this.store.createNode(
                'three',
                Object.assign({ __ngt_renderer__: { rawValue: undefined } }, { __ngt__: { isRaw: true } })
            );
        }

        const { injectedArgs, store } = this.store.getCreationState();

        // handle primitive
        if (name === SPECIAL_DOM_TAG.NGT_PRIMITIVE) {
            if (!injectedArgs[0]) throw new Error(`[NGT] ngt-primitive without args is invalid`);
            const object = injectedArgs[0];
            let localState = getLocalState(object);
            if (!Object.keys(localState).length) {
                prepare(object, { store, args: injectedArgs, primitive: true });
                localState = getLocalState(object);
            }
            if (!localState.store) localState.store = store;
            return this.store.createNode('three', object);
        }

        const threeTag = name.startsWith('ngt') ? name.slice(4) : name;
        const threeName = kebabToPascal(threeTag);
        const threeTarget = this.catalogue[threeName];
        // we have the THREE constructor here, handle it
        if (threeTarget) {
            const instance = prepare(new threeTarget(...injectedArgs), { store, args: injectedArgs });
            const node = this.store.createNode('three', instance);
            const localState = getLocalState(instance);
            if (is.geometry(instance)) {
                localState.attach = ['geometry'];
            } else if (is.material(instance)) {
                localState.attach = ['material'];
            }

            return node;
        }

        return this.store.createNode('dom', element);
    }

    createComment(value: string) {
        const comment = this.domRenderer.createComment(value);
        return this.store.createNode('comment', comment);
    }

    appendChild(parent: NgtRendererNode, newChild: NgtRendererNode): void {
        // TODO: just ignore text node for now
        if (newChild instanceof Text) return;

        if (newChild.__ngt_renderer__[NgtRendererClassId.type] === 'comment') {
            this.store.setParent(newChild, parent);
            return;
        }

        this.store.setParent(newChild, parent);
        this.store.addChild(parent, newChild);

        // if new chlid is a portal
        if (newChild.__ngt_renderer__[NgtRendererClassId.type] === 'portal') {
            this.store.processPortalContainer(newChild);
            if (newChild.__ngt_renderer__[NgtRendererClassId.portalContainer]) {
                this.appendChild(parent, newChild.__ngt_renderer__[NgtRendererClassId.portalContainer]);
            }
            return;
        }

        // if parent is a portal
        if (parent.__ngt_renderer__[NgtRendererClassId.type] === 'portal') {
            this.store.processPortalContainer(parent);
            if (parent.__ngt_renderer__[NgtRendererClassId.portalContainer]) {
                this.appendChild(parent.__ngt_renderer__[NgtRendererClassId.portalContainer], newChild);
            }
            return;
        }

        // if both are three instances, straightforward case
        if (
            parent.__ngt_renderer__[NgtRendererClassId.type] === 'three' &&
            newChild.__ngt_renderer__[NgtRendererClassId.type] === 'three'
        ) {
            attachThreeChild(parent, newChild);
            // here, we handle the special case of if the parent has a compoundParent, which means this child is part of a compound parent template
            if (!newChild.__ngt_renderer__[NgtRendererClassId.compound]) return;
            const closestGrandparentWithCompound = this.store.getClosestParentWithCompound(parent);
            if (!closestGrandparentWithCompound) return;
            this.appendChild(closestGrandparentWithCompound, newChild);
            return;
        }

        // if only the parent is the THREE instance
        if (parent.__ngt_renderer__[NgtRendererClassId.type] === 'three') {
            if (newChild.__ngt_renderer__[NgtRendererClassId.children].length) {
                for (const renderChild of newChild.__ngt_renderer__[NgtRendererClassId.children]) {
                    this.appendChild(parent, renderChild);
                }
            }
        }

        // if parent is a compound
        if (parent.__ngt_renderer__[NgtRendererClassId.type] === 'compound') {
            // if compound doesn't have a THREE instance set yet
            if (
                !parent.__ngt_renderer__[NgtRendererClassId.compounded] &&
                newChild.__ngt_renderer__[NgtRendererClassId.type] === 'three'
            ) {
                // if child is indeed an ngtCompound
                if (newChild.__ngt_renderer__[NgtRendererClassId.compound]) {
                    this.store.setCompound(parent, newChild);
                } else {
                    // if not, we track the parent (that is supposedly the compound component) on this three instance
                    if (!newChild.__ngt_renderer__[NgtRendererClassId.compoundParent]) {
                        newChild.__ngt_renderer__[NgtRendererClassId.compoundParent] = parent;
                    }
                }
            }

            // reset the compound if it's changed
            if (
                parent.__ngt_renderer__[NgtRendererClassId.compounded] &&
                newChild.__ngt_renderer__[NgtRendererClassId.type] === 'three' &&
                newChild.__ngt_renderer__[NgtRendererClassId.compound] &&
                parent.__ngt_renderer__[NgtRendererClassId.compounded] !== newChild
            ) {
                this.store.setCompound(parent, newChild);
            }
        }

        if (newChild.__ngt_renderer__[NgtRendererClassId.type] === 'three' && !getLocalState(newChild).parent) {
            // we'll try to get the grandparent instance here so that we can run appendChild with both instances
            const closestGrandparentInstance = this.store.getClosestParentWithInstance(parent);
            if (closestGrandparentInstance) {
                this.appendChild(closestGrandparentInstance, newChild);
            }
            return;
        }

        if (
            parent.__ngt_renderer__[NgtRendererClassId.type] === 'dom' &&
            newChild.__ngt_renderer__[NgtRendererClassId.type] === 'dom'
        ) {
            const closestGrandparentInstance = this.store.getClosestParentWithInstance(parent);
            if (closestGrandparentInstance) {
                this.appendChild(closestGrandparentInstance, newChild);
            }
        }
    }

    insertBefore(
        parent: NgtRendererNode,
        newChild: NgtRendererNode
        // TODO  we might need these?
        // refChild: NgtRendererNode,
        // isMove?: boolean | undefined
    ): void {
        if (!parent.__ngt_renderer__) return;
        this.appendChild(parent, newChild);
    }

    removeChild(parent: NgtRendererNode, oldChild: NgtRendererNode, isHostElement?: boolean | undefined): void {
        if (
            parent.__ngt_renderer__[NgtRendererClassId.type] === 'three' &&
            oldChild.__ngt_renderer__[NgtRendererClassId.type] === 'three'
        ) {
            removeThreeChild(parent, oldChild, true);
            this.store.destroy(oldChild, parent);
            return;
        }

        if (
            parent.__ngt_renderer__[NgtRendererClassId.type] === 'compound' &&
            parent.__ngt_renderer__[NgtRendererClassId.parent]
        ) {
            this.removeChild(parent.__ngt_renderer__[NgtRendererClassId.parent], oldChild, isHostElement);
            return;
        }

        if (parent.__ngt_renderer__[NgtRendererClassId.type] === 'three') {
            this.store.destroy(oldChild, parent);
            return;
        }

        const closestGrandparentInstance = this.store.getClosestParentWithInstance(parent);
        if (closestGrandparentInstance) {
            this.removeChild(closestGrandparentInstance, oldChild, isHostElement);
        }
        this.store.destroy(oldChild, closestGrandparentInstance as NgtRendererNode);
    }

    parentNode(node: NgtRendererNode) {
        if (node.__ngt_renderer__?.[NgtRendererClassId.parent]) return node.__ngt_renderer__[NgtRendererClassId.parent];
        return this.domRenderer.parentNode(node);
    }

    setAttribute(el: NgtRendererNode, name: string, value: string, namespace?: string | null | undefined): void {
        if (el.__ngt_renderer__[NgtRendererClassId.type] === 'compound') {
            // we don't have the compound instance yet
            el.__ngt_renderer__[NgtRendererClassId.attributes][name] = value;
            if (!el.__ngt_renderer__[NgtRendererClassId.compounded]) {
                this.store.queueOperation(el, ['op', () => this.setAttribute(el, name, value, namespace)]);
                return;
            }

            this.setAttribute(el.__ngt_renderer__[NgtRendererClassId.compounded], name, value, namespace);
            return;
        }

        if (el.__ngt_renderer__[NgtRendererClassId.type] === 'three') {
            this.store.applyAttribute(el, name, value);
        }
    }

    setProperty(el: NgtRendererNode, name: string, value: any): void {
        if (el.__ngt_renderer__[NgtRendererClassId.type] === 'compound') {
            // we don't have the compound instance yet
            el.__ngt_renderer__[NgtRendererClassId.properties][name] = value;
            if (!el.__ngt_renderer__[NgtRendererClassId.compounded]) {
                this.store.queueOperation(el, ['op', () => this.setProperty(el, name, value)]);
                return;
            }

            if (el.__ngt_renderer__[NgtRendererClassId.compounded].__ngt_renderer__[NgtRendererClassId.compound]) {
                Object.assign(
                    el.__ngt_renderer__[NgtRendererClassId.compounded].__ngt_renderer__[NgtRendererClassId.compound],
                    {
                        props: {
                            ...el.__ngt_renderer__[NgtRendererClassId.compounded].__ngt_renderer__[
                                NgtRendererClassId.compound
                            ],
                            [name]: value,
                        },
                    }
                );
            }
            this.setProperty(el.__ngt_renderer__[NgtRendererClassId.compounded], name, value);
            return;
        }

        if (el.__ngt_renderer__[NgtRendererClassId.type] === 'three') {
            this.store.applyProperty(el, name, value);
        }
    }

    listen(target: NgtRendererNode, eventName: string, callback: (event: any) => boolean | void): () => void {
        if (
            target.__ngt_renderer__[NgtRendererClassId.type] === 'three' ||
            (target.__ngt_renderer__[NgtRendererClassId.type] === 'compound' &&
                target.__ngt_renderer__[NgtRendererClassId.compounded])
        ) {
            const instance = target.__ngt_renderer__[NgtRendererClassId.compounded] || target;
            const priority = getLocalState(target).priority;
            return processThreeEvent(instance, priority || 0, eventName, callback, this.store.rootCdr);
        }

        if (
            target.__ngt_renderer__[NgtRendererClassId.type] === 'compound' &&
            !target.__ngt_renderer__[NgtRendererClassId.compounded]
        ) {
            this.store.queueOperation(target, [
                'op',
                () => this.store.queueOperation(target, ['cleanUp', this.listen(target, eventName, callback)]),
            ]);
        }
        return () => {};
    }

    get data(): { [key: string]: any } {
        return this.domRenderer.data;
    }
    createText = this.domRenderer.createText.bind(this.domRenderer);
    destroy = this.domRenderer.destroy.bind(this.domRenderer);
    destroyNode: ((node: any) => void) | null = null;
    selectRootElement = this.domRenderer.selectRootElement.bind(this.domRenderer);
    nextSibling = this.domRenderer.nextSibling.bind(this.domRenderer);
    removeAttribute = this.domRenderer.removeAttribute.bind(this.domRenderer);
    addClass = this.domRenderer.addClass.bind(this.domRenderer);
    removeClass = this.domRenderer.removeClass.bind(this.domRenderer);
    setStyle = this.domRenderer.setStyle.bind(this.domRenderer);
    removeStyle = this.domRenderer.removeStyle.bind(this.domRenderer);
    setValue = this.domRenderer.setValue.bind(this.domRenderer);
}
