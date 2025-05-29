import { signalState, SignalState } from './utils/signal-state';
import { getInstanceState, prepare, invalidateInstance } from './instance'; // Assuming notifyAncestors is not exported, test via public API if possible or export for test
import type { NgtInstanceNode, NgtInstanceState, NgtState, NgtInstanceHierarchyState, NgtEventHandlers } from './types';
import { computed, signal } from '@angular/core';

// Mock crypto.randomUUID
const mockRandomUUID = jest.fn();
global.crypto = {
    ...global.crypto,
    randomUUID: mockRandomUUID,
};

// Minimal NgtState mock
const getMockNgtState = (priority = 0, maxSkip = 5): Partial<NgtState> => ({
    events: { priority, enabled: true, compute: jest.fn(), filter: undefined },
    maxNotificationSkipCount: maxSkip,
    // other necessary properties
});

// Mock hierarchyStore that notifyAncestors interacts with
const mockHierarchyStore = {
    update: jest.fn(),
    snapshot: { parent: null, objects: [], nonObjects: [] } as NgtInstanceHierarchyState,
    parent: signal(null as NgtInstanceNode | null),
    objects: signal([] as NgtInstanceNode[]),
    nonObjects: signal([] as NgtInstanceNode[]),
    geometryStamp: signal(Date.now()),
};

// We need to be able to test notifyAncestors. If it's not exported, we have a problem.
// For this test, let's assume we can import it or it's exposed for testing.
// If not, we'd test a function that calls it.
// Let's assume it's been exported for testing:
let notifyAncestorsRef: (instance: NgtInstanceNode | null, type: 'objects' | 'nonObjects') => void;

jest.mock('./instance', () => {
    const originalModule = jest.requireActual('./instance');
    // This is tricky; notifyAncestors is not exported.
    // To test it, it would need to be exported from instance.ts: `export { notifyAncestors }`
    // Or, we test it via a side effect of another function if possible.
    // For now, we'll assume we can't directly import it.
    // We will test its effects via calls to 'add' or 'remove' on a prepared instance,
    // which internally call notifyAncestors.
    return {
        ...originalModule,
        // We can't easily assign notifyAncestorsRef here if it's not exported.
    };
});


describe('instance.ts', () => {
    beforeEach(() => {
        mockRandomUUID.mockClear();
        mockHierarchyStore.update.mockClear();
        // Resetting the cache for notifyAncestors would be ideal, but it's not directly accessible.
        // Since it's a WeakMap, it should clear between test runs if instances are not held.
        // Forcing GC is not reliable in tests.
        // The tests will use different instance objects to avoid cache interference where possible.
    });

    describe('prepare function', () => {
        it('should define setPointerEvent, addInteraction, and removeInteraction on __ngt__', () => {
            const obj = {} as NgtInstanceNode;
            mockRandomUUID.mockReturnValue('test-uuid');
            prepare(obj, 'testType');

            expect(obj.__ngt__).toBeDefined();
            expect(typeof obj.__ngt__?.setPointerEvent).toBe('function');
            expect(typeof obj.__ngt__?.addInteraction).toBe('function');
            expect(typeof obj.__ngt__?.removeInteraction).toBe('function');
        });

        it('setPointerEvent should increment eventCount and manage handlers', () => {
            const obj = {} as NgtInstanceNode;
            prepare(obj, 'testType');
            const instanceState = getInstanceState(obj)!;

            expect(instanceState.eventCount).toBe(0);
            expect(instanceState.handlers).toEqual({});

            const callback = jest.fn();
            const cleanup = instanceState.setPointerEvent!('click', callback);

            expect(instanceState.eventCount).toBe(1);
            expect(typeof instanceState.handlers.click).toBe('function');

            // Simulate event
            const mockEvent: any = { data: 'test' };
            instanceState.handlers.click!(mockEvent);
            expect(callback).toHaveBeenCalledWith(mockEvent);

            cleanup();
            expect(instanceState.eventCount).toBe(0);
            expect(instanceState.handlers.click).toBeUndefined();
        });
    });

    describe('notifyAncestors function (tested via instance add/remove methods)', () => {
        // We need to spy on hierarchyStore.update of the *parent* to see if notifyAncestors worked.
        // Setup: parent -(add child)-> child. Child calls notifyAncestors(parent).
        // We check if parent's hierarchyStore.update was called.

        let parent: NgtInstanceNode;
        let child: NgtInstanceNode;
        let mockParentHierarchyStoreUpdate: jest.Mock;
        let parentState: NgtInstanceState;

        beforeEach(() => {
            parent = {} as NgtInstanceNode;
            child = {} as NgtInstanceNode;
            
            mockRandomUUID.mockReturnValueOnce('parent-uuid').mockReturnValueOnce('child-uuid');

            // Prepare parent
            const parentInitialState = getMockNgtState(0, 3); // maxSkipCount = 3 for easier testing
            const parentHierarchyStore = signalState<NgtInstanceHierarchyState>({
                parent: null,
                objects: [],
                nonObjects: [],
                geometryStamp: Date.now(),
            });
            mockParentHierarchyStoreUpdate = jest.fn();
            parentHierarchyStore.update = mockParentHierarchyStoreUpdate;


            prepare(parent, 'parentType', {
                store: signalState(parentInitialState as NgtState) as any,
                hierarchyStore: parentHierarchyStore as any,
            });
            parentState = getInstanceState(parent)!;
            
            // Prepare child and link to parent
            prepare(child, 'childType', {
                store: signalState(getMockNgtState() as NgtState) as any,
                // child initially has no parent in its own hierarchyStore for this setup
            });
            // Manually set parent for child's __ngt__ state so add/remove can find it
            getInstanceState(child)!.hierarchyStore.set({ parent });
        });

        it('should call parent hierarchyStore.update initially, then throttle, then call again', () => {
            const childNgt = getInstanceState(child)!;

            // Call 1: Should update
            childNgt.add({} as NgtInstanceNode, 'objects');
            expect(mockParentHierarchyStoreUpdate).toHaveBeenCalledTimes(1);
            // Snapshot from parent's perspective
            expect(parentState.hierarchyStore.snapshot['objects'].length).toBe(0); // initial state not modified by child's add directly

            // Call 2: Should be skipped (skipCount 1 < 3)
            childNgt.add({} as NgtInstanceNode, 'objects');
            expect(mockParentHierarchyStoreUpdate).toHaveBeenCalledTimes(1);

            // Call 3: Should be skipped (skipCount 2 < 3)
            childNgt.add({} as NgtInstanceNode, 'objects');
            expect(mockParentHierarchyStoreUpdate).toHaveBeenCalledTimes(1);
            
            // Call 4: Should be skipped (skipCount 3 == 3, so next one will pass)
            // The logic is `skipCount > maxNotificationSkipCount`. So if maxSkipCount is 3,
            // skipCount needs to be 4 to pass.
            // Iteration:
            // 1. call: cached=undef. set skip=0. UPDATE.
            // 2. call: cached={skip:0}. skipCount=0 not > 3. set skip=1. NO UPDATE.
            // 3. call: cached={skip:1}. skipCount=1 not > 3. set skip=2. NO UPDATE.
            // 4. call: cached={skip:2}. skipCount=2 not > 3. set skip=3. NO UPDATE.
            // 5. call: cached={skip:3}. skipCount=3 not > 3. set skip=4. NO UPDATE.
            // This seems off. The condition is `!cached || cached.lastType !== type || cached.skipCount > maxNotificationSkipCount`
            // If maxNotificationSkipCount = 3.
            // Call 1: no cache. Set cache: {skipCount:0, type}. notify.
            // Call 2: cache: {skipCount:0, type}. skipCount (0) NOT > 3. Don't notify. cache.skipCount becomes 1.
            // Call 3: cache: {skipCount:1, type}. skipCount (1) NOT > 3. Don't notify. cache.skipCount becomes 2.
            // Call 4: cache: {skipCount:2, type}. skipCount (2) NOT > 3. Don't notify. cache.skipCount becomes 3.
            // Call 5: cache: {skipCount:3, type}. skipCount (3) NOT > 3. Don't notify. cache.skipCount becomes 4.
            // Call 6: cache: {skipCount:4, type}. skipCount (4) IS > 3. Notify! cache.skipCount becomes 0.

            childNgt.add({} as NgtInstanceNode, 'objects'); // skipCount becomes 3
            expect(mockParentHierarchyStoreUpdate).toHaveBeenCalledTimes(1);

            childNgt.add({} as NgtInstanceNode, 'objects'); // skipCount becomes 4
            expect(mockParentHierarchyStoreUpdate).toHaveBeenCalledTimes(1);

            // Call 6: Should update (skipCount 4 > 3)
            childNgt.add({} as NgtInstanceNode, 'objects');
            expect(mockParentHierarchyStoreUpdate).toHaveBeenCalledTimes(2);
        });

        it('should notify for different types without throttling', () => {
            const childNgt = getInstanceState(child)!;

            // Call 1: type 'objects'. Should update.
            childNgt.add({} as NgtInstanceNode, 'objects');
            expect(mockParentHierarchyStoreUpdate).toHaveBeenCalledTimes(1);
            // Cache for 'objects' is now {skipCount: 0}

            // Call 2: type 'nonObjects'. Should update because type is different.
            childNgt.add({} as NgtInstanceNode, 'nonObjects');
            expect(mockParentHierarchyStoreUpdate).toHaveBeenCalledTimes(2);
            // Cache for 'nonObjects' is now {skipCount: 0}

            // Call 3: type 'objects' again. Should update because lastType was 'nonObjects'.
            childNgt.add({} as NgtInstanceNode, 'objects');
            expect(mockParentHierarchyStoreUpdate).toHaveBeenCalledTimes(3);
        });
    });
});
</tbody>
</table>
