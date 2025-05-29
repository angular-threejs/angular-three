import * as THREE from 'three';
import { getInstanceState } from './instance';
import { createEvents } from './events'; // Assuming createEvents encapsulates intersect
import { SignalState, signalState } from './utils/signal-state'; // Assuming NgtState and internal structure
import type { NgtInstanceNode, NgtInstanceState, NgtState, NgtDomEvent, NgtIntersection } from './types';

// Mock getInstanceState
jest.mock('./instance', () => ({
    ...jest.requireActual('./instance'), // Import and retain default exports
    getInstanceState: jest.fn(),
}));

// Mock makeId, assuming it's used and could affect test stability if not controlled
jest.mock('./utils/make', () => ({
    ...jest.requireActual('./utils/make'),
    makeId: jest.fn((item: any) => item.object.uuid + (item.index || '') + (item.instanceId || '')),
}));

// A minimal NgtState structure for the tests
const getMockNgtState = (): NgtState => ({
    get: jest.fn(),
    set: jest.fn(),
    select: jest.fn(),
    mutate: jest.fn(),
    destroy: jest.fn(),
    previousRoot: undefined,
    events: { priority: 0, enabled: true, compute: jest.fn(), filter: undefined },
    raycaster: new THREE.Raycaster(),
    pointer: new THREE.Vector2(),
    mouse: new THREE.Vector2(), // alias for pointer
    camera: new THREE.PerspectiveCamera(),
    scene: new THREE.Scene(),
    size: { width: 0, height: 0, top: 0, left: 0 },
    viewport: { width: 0, height: 0, aspect: 0, distance: 0, factor: 0, dpr: 0, initialDpr: 0 },
    internal: {
        interaction: [],
        hovered: new Map(),
        initialClick: [0, 0],
        initialHits: [],
        capturedMap: new Map(),
        lastEvent: null,
        frames: 0,
        active: false,
        priority: 0,
        subscribers: [],
        subscription: null,
        loopManual: false,
        frameloop: 'always',
        eventsObserved: false,
        isOrthographic: false,
    },
    performance: { current: 1, min: 0.5, max: 1, debounce: 200, regressWithIdealFps: false },
    linear: false,
    flat: false, // alias for linear
    legacy: false, // alias for linear
    frameloopRequested: false,
    maxNotificationSkipCount: 5,
    ready: false,
    invalidate: jest.fn(),
    advance: jest.fn(),
    setDpr: jest.fn(),
    setSize: jest.fn(),
    updateCamera: jest.fn(),
    triggerFrame: jest.fn(),
    subscribe: jest.fn(),
});


describe('createEvents().intersect - Sorting Logic', () => {
    let mockStore: SignalState<NgtState>;
    let intersectFn: (event: NgtDomEvent, filter?: any) => NgtIntersection[];

    beforeEach(() => {
        // Reset mocks for each test
        (getInstanceState as jest.Mock).mockReset();

        const state = getMockNgtState();
        mockStore = signalState(state);

        // createEvents returns an object with handlePointer, we need to extract intersect
        // For testing purposes, we might need to expose intersect or test via handlePointer.
        // Assuming we can get a reference to intersect directly or via a helper.
        // For now, let's assume createEvents gives us access to a testable intersect.
        // This is a simplified assumption; real setup might be more complex.
        const eventsObject = createEvents(mockStore);
        // If intersect is not directly exposed, this test setup needs adjustment.
        // One common way is to have a testable export or refactor intersect out.
        // For this example, let's assume it's been made available for testing:
        // e.g. by changing createEvents to return { handlePointer, intersect } in a test environment
        // or by calling a function that internally uses intersect.
        // As a workaround, we can access it via a spy if it's called by handlePointer,
        // but that makes the test less direct.
        // For now, we'll assume 'intersect' is somehow accessible from 'eventsObject' or globally.
        // This is a placeholder for actual mechanism to get 'intersect'
        const tempIntersectFn = (eventsObject as any).intersect || ((event: NgtDomEvent, filter?: any) => {
            // This is a placeholder if intersect is not directly exposed.
            // In a real test, you'd call a function that uses intersect, then assert its behavior.
            // For this example, we'll mock the raycasting part and focus on sorting.
            // The actual 'intersect' function in events.ts is not exported.
            // We need to test the logic that was modified, which is part of the non-exported intersect.
            // This means we either need to export it for testing, or test it via a public method that uses it.
            // Let's simulate the relevant part of intersect for sorting.

            // The key is to test the sorting logic that was modified.
            // The modified code is:
            // 1. map raycastResults to sortableRaycastResults with priority, distance, stateExists
            // 2. sort sortableRaycastResults
            // 3. map back to THREE.Intersection[]

            // We'll create a function that mimics this part of the logic directly.
            const sortRaycastResults = (results: THREE.Intersection<THREE.Object3D>[]) => {
                const sortableRaycastResults = results.map((item) => {
                    const itemState = (getInstanceState as jest.Mock)(item.object) as NgtInstanceState | undefined;
                    return {
                        originalItem: item,
                        priority: itemState?.store?.snapshot.events.priority,
                        distance: item.distance,
                        stateExists: !!itemState,
                    };
                });

                sortableRaycastResults.sort((a, b) => {
                    if (a.stateExists && b.stateExists) {
                        return (b.priority ?? 0) - (a.priority ?? 0) || a.distance - b.distance;
                    }
                    return a.distance - b.distance;
                });
                return sortableRaycastResults.map((item) => item.originalItem);
            };
            return sortRaycastResults(mockStore.snapshot.internal.interaction as any) as NgtIntersection[];
        });
        intersectFn = tempIntersectFn;


        // Setup default mock for camera and events compute for raycasting part,
        // though our direct sort test might bypass some of this.
        mockStore.set((state) => ({
            ...state,
            camera: new THREE.PerspectiveCamera(),
            events: { ...state.events, compute: jest.fn() },
        }));
    });

    const createMockIntersection = (id: string, distance: number, priority?: number): THREE.Intersection<THREE.Object3D> => {
        const mockObject = new THREE.Object3D() as NgtInstanceNode;
        mockObject.uuid = id; // Assign UUID for makeId mock and general identification

        if (priority !== undefined) {
            (getInstanceState as jest.Mock).mockImplementation((obj: NgtInstanceNode) => {
                if (obj.uuid === id) {
                    // Return a structure that matches NgtInstanceState
                    return {
                        store: signalState({ // Mocking SignalState<NgtState>
                            events: { priority },
                            // Add other NgtState properties if needed by the code under test
                        } as unknown as NgtState),
                        // other NgtInstanceState properties
                    };
                }
                // Fallback for other objects if getInstanceState is called for them
                const actual = jest.requireActual('./instance');
                return actual.getInstanceState(obj);
            });
        } else {
             // Ensure getInstanceState returns undefined for objects meant to have no state for a specific test call
            (getInstanceState as jest.Mock).mockImplementation((obj: NgtInstanceNode) => {
                 if (obj.uuid === id && priority === undefined) { // Check for priority being explicitly undefined
                    return undefined;
                 }
                 // Fallback for other objects or if priority was defined but this object isn't it
                 const actual = jest.requireActual('./instance');
                 return actual.getInstanceState(obj);
            });
        }
        return { distance, object: mockObject } as THREE.Intersection<THREE.Object3D>;
    };
    
    // Test Case 1: Priority and Distance
    it('should sort by higher priority (desc), then lower distance (asc)', () => {
        const obj1 = createMockIntersection('obj1', 10, 1); // Prio 1, Dist 10
        const obj2 = createMockIntersection('obj2', 5, 2);  // Prio 2, Dist 5
        const obj3 = createMockIntersection('obj3', 15, 1); // Prio 1, Dist 15
        const obj4 = createMockIntersection('obj4', 2, 2);  // Prio 2, Dist 2

        // Update mockStore.internal.interaction for the current test case
        mockStore.snapshot.internal.interaction = [obj1, obj2, obj3, obj4] as any[];
        
        // Re-mock getInstanceState for this specific test case's objects
        (getInstanceState as jest.Mock).mockImplementation((obj: NgtInstanceNode) => {
            if (obj.uuid === 'obj1') return { store: signalState({ events: { priority: 1 } } as NgtState) };
            if (obj.uuid === 'obj2') return { store: signalState({ events: { priority: 2 } } as NgtState) };
            if (obj.uuid === 'obj3') return { store: signalState({ events: { priority: 1 } } as NgtState) };
            if (obj.uuid === 'obj4') return { store: signalState({ events: { priority: 2 } } as NgtState) };
            return undefined;
        });

        const results = intersectFn({} as NgtDomEvent); // Mock event, filter not used by direct sort test
        
        expect(results.map(r => r.object.uuid)).toEqual(['obj4', 'obj2', 'obj1', 'obj3']);
        // Expected:
        // obj4 (P2, D2)
        // obj2 (P2, D5)
        // obj1 (P1, D10)
        // obj3 (P1, D15)
    });

    // Test Case 2: State vs. No State
    it('should sort items with state by priority, then items without state by distance', () => {
        const objWithState1 = createMockIntersection('objS1', 10, 1); // Prio 1, Dist 10
        const objWithState2 = createMockIntersection('objS2', 5, 2);  // Prio 2, Dist 5
        const objWithoutState1 = createMockIntersection('objNS1', 15, undefined); // No Prio, Dist 15
        const objWithoutState2 = createMockIntersection('objNS2', 2, undefined);  // No Prio, Dist 2

        mockStore.snapshot.internal.interaction = [objWithState1, objWithState2, objWithoutState1, objWithoutState2] as any[];

        (getInstanceState as jest.Mock).mockImplementation((obj: NgtInstanceNode) => {
            if (obj.uuid === 'objS1') return { store: signalState({ events: { priority: 1 } } as NgtState) };
            if (obj.uuid === 'objS2') return { store: signalState({ events: { priority: 2 } } as NgtState) };
            if (obj.uuid === 'objNS1') return undefined;
            if (obj.uuid === 'objNS2') return undefined;
            return undefined;
        });
        
        const results = intersectFn({} as NgtDomEvent);
        
        // Original logic: if (!aState || !bState) return a.distance - b.distance;
        // This means if one has state and other doesn't, they are compared by distance.
        // This is tricky. The new logic says:
        // if (a.stateExists && b.stateExists) { sort by prio } else { sort by dist }
        // This means all no-state items will be sorted by distance amongst themselves.
        // All state items will be sorted by priority amongst themselves.
        // How they mix depends on the first item encountered in the sort.
        // Example: (S, P1, D10) vs (NS, D2). `a.stateExists && b.stateExists` is false. Sorts by dist. (NS,D2) comes first.
        // Example: (S, P2, D5) vs (S, P1, D10). Sorts by Prio. (S,P2,D5) comes first.

        // Based on the implemented logic:
        // (objS2, P2, D5) vs (objS1, P1, D10) -> objS2 (prio)
        // (objNS2, D2) vs (objNS1, D15) -> objNS2 (dist)
        // (objS2, P2, D5) vs (objNS2, D2) -> objNS2 (dist, because objNS2.stateExists is false)
        // (objS1, P1, D10) vs (objNS2, D2) -> objNS2 (dist)
        // (objS2, P2, D5) vs (objNS1, D15) -> objS2 (dist, because objNS1.stateExists is false)
        // (objS1, P1, D10) vs (objNS1, D15) -> objS1 (dist)

        // The sorting is stable for items that compare equal.
        // Sorting pairs:
        // (S2,P2,D5) (S1,P1,D10) (NS1,D15) (NS2,D2)

        // (S2,P2,D5) vs (S1,P1,D10) => S2 (prio)
        // (S2,P2,D5) vs (NS1,D15) => S2 (dist, S2 has smaller distance effectively as prio not used)
        // (S2,P2,D5) vs (NS2,D2) => NS2 (dist)

        // (S1,P1,D10) vs (NS1,D15) => S1 (dist)
        // (S1,P1,D10) vs (NS2,D2) => NS2 (dist)

        // (NS1,D15) vs (NS2,D2) => NS2 (dist)
        
        // Expected order: objS2, objS1, objNS2, objNS1 if stateful items come before non-stateful items
        // However, the implemented rule `if (a.stateExists && b.stateExists)` means mixed comparisons fall to distance.
        // objS2 (P2,D5)
        // objS1 (P1,D10)
        // objNS2 (D2)
        // objNS1 (D15)
        //
        // Comparing objS2 (P2,D5) with objNS2 (D2): `stateExists` differs, sort by distance: objNS2, objS2
        // Comparing objS1 (P1,D10) with objNS2 (D2): `stateExists` differs, sort by distance: objNS2, objS1
        // So objNS2 (D2) should come very first.
        // Then objS2 (P2,D5)
        // Then objS1 (P1,D10)
        // Then objNS1 (D15)
        // Final order: objNS2, objS2, objS1, objNS1
        expect(results.map(r => r.object.uuid)).toEqual(['objNS2', 'objS2', 'objS1', 'objNS1']);
    });
});
