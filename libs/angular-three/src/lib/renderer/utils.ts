import { ChangeDetectorRef, EventEmitter, NgZone, untracked } from '@angular/core';
import { supportedEvents } from '../dom/events';
import { removeInteractivity } from '../events';
import type { NgtEventHandlers, NgtInstanceNode } from '../types';
import { attach, detach } from '../utils/attach';
import { getLocalState, invalidateInstance } from '../utils/instance';
import { is } from '../utils/is';
import { safeDetectChanges } from '../utils/safe-detect-changes';
import { NgtRendererClassId } from './enums';

export const ROUTED_SCENE = '__ngt_renderer_is_routed_scene__';
export const SPECIAL_INTERNAL_ADD_COMMENT = '__ngt_renderer_add_comment__';

export const SPECIAL_DOM_TAG = {
    NGT_PORTAL: 'ngt-portal',
    NGT_PRIMITIVE: 'ngt-primitive',
    NGT_VALUE: 'ngt-value',
} as const;

export const SPECIAL_PROPERTIES = {
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

export function attachThreeChild(parent: NgtInstanceNode, child: NgtInstanceNode) {
    const pLS = getLocalState(parent);
    const cLS = getLocalState(child);

    if (!pLS || !cLS) {
        throw new Error(`[NGT] THREE instances need to be prepared with local state.`);
    }

    // whether the child is added to the parent with parent.add()
    let added = false;

    // assign store on child if not already exist
    // or child store is the parent of parent store
    if (!cLS.store || cLS.store === pLS.store.get('previousStore')) {
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
                cLS.parent.set(parent);
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

    cLS.parent.set(parent);

    if (cLS.afterAttach) cLS.afterAttach.emit({ parent, node: child });

    invalidateInstance(child);
    invalidateInstance(parent);
}

export function removeThreeChild(parent: NgtInstanceNode, child: NgtInstanceNode, dispose?: boolean) {
    const pLS = getLocalState(parent);
    const cLS = getLocalState(child);

    // clear parent ref
    cLS.parent?.set(null);

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

export function processThreeEvent(
    instance: NgtInstanceNode,
    priority: number,
    eventName: string,
    callback: (event: any) => void,
    zone: NgZone,
    cdr: ChangeDetectorRef
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
            safeDetectChanges(cdr);
            // cdr.detectChanges();
        });
    };

    Object.assign(lS.handlers, { [eventName]: eventToHandler(updatedCallback) });

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

export function eventToHandler(callback: (event: any) => void) {
    return (event: Parameters<Exclude<NgtEventHandlers[(typeof supportedEvents)[number]], undefined>>[0]) => {
        callback(event);
    };
}

export function kebabToPascal(str: string): string {
    // split the string at each hyphen
    const parts = str.split('-');

    // map over the parts, capitalizing the first letter of each part
    const pascalParts = parts.map((part) => part.charAt(0).toUpperCase() + part.slice(1));

    // join the parts together to create the final PascalCase string
    return pascalParts.join('');
}
