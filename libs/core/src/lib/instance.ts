import { EventEmitter, WritableSignal, signal, untracked } from '@angular/core';
import { type NgtEventHandlers } from './events';
import { type NgtState } from './store';
import type { NgtAnyRecord } from './types';
import { checkUpdate, signalStore, type NgtSignalStore } from './utils';

export type NgtAttachFunction<TChild = any, TParent = any> = (
    parent: TParent,
    child: TChild,
    store: NgtSignalStore<NgtState>
) => void | (() => void);

export type NgtAfterAttach<
    TParent extends NgtInstanceNode = NgtInstanceNode,
    TChild extends NgtInstanceNode = NgtInstanceNode
> = { parent: TParent; node: TChild };

export type NgtInstanceLocalState = {
    /** the state getter of the canvas that the instance is being rendered to */
    store: NgtSignalStore<NgtState>;
    // objects and parent are used when children are added with `attach` instead of being added to the Object3D scene graph
    nonObjects: WritableSignal<NgtInstanceNode[]>;
    // objects that are Object3D
    objects: WritableSignal<NgtInstanceNode[]>;
    // shortcut to add/remove object to list
    add: (instance: NgtInstanceNode, type: 'objects' | 'nonObjects') => void;
    remove: (instance: NgtInstanceNode, type: 'objects' | 'nonObjects') => void;
    // native props signal
    nativeProps: NgtSignalStore<NgtAnyRecord>;
    // parent based on attach three instance
    parent: WritableSignal<NgtInstanceNode | null>;
    // if this THREE instance is a ngt-primitive
    primitive?: boolean;
    // if this THREE object has any events bound to it
    eventCount: number;
    // list of handlers to handle the events
    handlers: Partial<NgtEventHandlers>;
    // previous args
    args?: unknown[];
    // attach information so that we can detach as well as reset
    attach?: string[] | NgtAttachFunction;
    // previously attach information so we can reset as well as clean up
    previousAttach?: unknown | (() => void);
    // is raw value
    isRaw?: boolean;
    // priority for before render
    priority?: number;
    // emitter after props update
    afterUpdate?: EventEmitter<NgtInstanceNode>;
    // emitter after attaching to parent
    afterAttach?: EventEmitter<NgtAfterAttach>;
};

export type NgtInstanceNode<TNode = any> = {
    __ngt__: NgtInstanceLocalState;
} & NgtAnyRecord &
    TNode;

export function getLocalState<TInstance extends object = NgtAnyRecord>(
    obj: TInstance | undefined
): NgtInstanceLocalState {
    if (!obj) return {} as unknown as NgtInstanceLocalState;
    return (obj as NgtAnyRecord)['__ngt__'] || ({} as NgtInstanceLocalState);
}

export function invalidateInstance<TInstance extends object>(instance: TInstance) {
    const state = getLocalState(instance).store?.get();
    if (state && state.internal.frames === 0) state.invalidate();
    checkUpdate(instance);
}

export function prepare<TInstance extends object = NgtAnyRecord>(
    object: TInstance,
    localState?: Partial<NgtInstanceLocalState>
): NgtInstanceNode<TInstance> {
    const instance = object as unknown as NgtInstanceNode<TInstance>;

    if (localState?.primitive || !instance.__ngt__) {
        const {
            objects = signal<NgtInstanceNode[]>([]),
            nonObjects = signal<NgtInstanceNode[]>([]),
            ...rest
        } = localState || {};

        instance.__ngt__ = {
            previousAttach: null,
            store: null,
            parent: signal(null),
            memoized: {},
            eventCount: 0,
            handlers: {},
            objects,
            nonObjects,
            nativeProps: signalStore<NgtAnyRecord>(),
            add: (object, type) => {
                untracked(() => {
                    const current = untracked(instance.__ngt__[type]);
                    const foundIndex = current.indexOf((obj: NgtInstanceNode) => obj === object);
                    if (foundIndex > -1) {
                        // if we add an object with the same reference, then we switch it out
                        // and update the BehaviorSubject
                        current.splice(foundIndex, 1, object);
                        instance.__ngt__[type].set(current);
                    } else {
                        instance.__ngt__[type].update((prev) => [...prev, object]);
                    }
                    notifyAncestors(untracked(instance.__ngt__.parent));
                });
            },
            remove: (object, type) => {
                untracked(() => {
                    instance.__ngt__[type].update((prev) => prev.filter((o) => o !== object));
                    notifyAncestors(untracked(instance.__ngt__.parent));
                });
            },
            ...rest,
        } as NgtInstanceLocalState;
    }

    return instance;
}

function notifyAncestors(instance: NgtInstanceNode | null) {
    if (!instance) return;
    const localState = getLocalState(instance);
    if (localState.objects) localState.objects.update((prev) => prev);
    if (localState.nonObjects) localState.nonObjects.update((prev) => prev);
    notifyAncestors(untracked(localState.parent));
}
