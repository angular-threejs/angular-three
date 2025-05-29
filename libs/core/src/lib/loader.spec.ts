import { effect, signal, Signal, WritableSignal } from '@angular/core';
// import { TestBed } from '@angular/core/testing'; // Not using TestBed for now
import { _injectLoader, normalizeInputs as actualNormalizeInputs } from './loader'; // Target function
import *  as loaderModule from './loader'; // To spy on normalizeInputs

// Mock the load function (the first argument to _injectLoader's factory)
// This function itself returns cachedResultPromisesEffect
const mockLoadFactory = jest.fn();

// Mock assertInjector
jest.mock('ngxtension/assert-injector', () => ({
    assertInjector: jest.fn((fn, injector, callback) => callback()),
}));

describe('_injectLoader Effect Optimization', () => {
    let inputsSignal: WritableSignal<string | string[] | Record<string, string>>;
    let normalizeInputsSpy: jest.SpyInstance;
    let mockCachedResultPromisesEffect: jest.Mock; // This is the function returned by loadFactory()

    // Helper to run Angular effects and other microtasks
    const flushEffects = () => new Promise((resolve) => setTimeout(resolve, 0));

    beforeEach(() => {
        mockLoadFactory.mockReset();
        
        // Spy on the actual normalizeInputs function from the module
        normalizeInputsSpy = jest.spyOn(loaderModule, 'normalizeInputs');

        // Default setup for mockCachedResultPromisesEffect
        mockCachedResultPromisesEffect = jest.fn().mockReturnValue([Promise.resolve('defaultData')]);
        // mockLoadFactory is called by _injectLoader, it should return a function (cachedResultPromisesEffect)
        mockLoadFactory.mockReturnValue(mockCachedResultPromisesEffect);
        
        inputsSignal = signal<string | string[] | Record<string, string>>('');
    });

    afterEach(() => {
        normalizeInputsSpy.mockRestore(); // Restore original normalizeInputs
    });

    // Test Case 1: No Change in Normalized URLs
    it('should NOT re-process loading if normalized URLs do not change', async () => {
        normalizeInputsSpy
            .mockReturnValueOnce(['url1']) // For first call to normalizeInputs within effect
            .mockReturnValueOnce(['url1']); // For second call

        // Call _injectLoader - this sets up the effect
        const loaderSignal = _injectLoader(() => mockLoadFactory as any, inputsSignal, {});
        
        // Initial run
        inputsSignal.set('initial_input');
        await flushEffects(); // Allow effect to run

        expect(normalizeInputsSpy).toHaveBeenCalledTimes(1);
        // mockLoadFactory is called once to get cachedResultPromisesEffect
        // cachedResultPromisesEffect itself is then called once inside the effect
        expect(mockCachedResultPromisesEffect).toHaveBeenCalledTimes(1);
        // Check signal value (optional, but good for sanity)
        expect(loaderSignal()).toBe('defaultData'); // Assuming string input, string output

        // Trigger effect again with new input, but normalizeInputs spy ensures same normalized URLs
        inputsSignal.set('changed_input_same_normalized_urls');
        await flushEffects(); // Allow effect to run again

        expect(normalizeInputsSpy).toHaveBeenCalledTimes(2); // normalizeInputs is called again by the effect to check
        // Assert that the core loading logic (cachedResultPromisesEffect) was NOT called the second time
        expect(mockCachedResultPromisesEffect).toHaveBeenCalledTimes(1); // Still 1, not called again
        // Signal value should remain unchanged
        expect(loaderSignal()).toBe('defaultData');
    });

    // Test Case 2: Change in Normalized URLs
    it('should re-process loading if normalized URLs change', async () => {
        normalizeInputsSpy
            .mockReturnValueOnce(['url1']) // For first call
            .mockReturnValueOnce(['url2']); // For second call (different URLs)

        // Update mockCachedResultPromisesEffect to return different data for the second call
        mockCachedResultPromisesEffect
            .mockReturnValueOnce([Promise.resolve('data1')])
            .mockReturnValueOnce([Promise.resolve('data2')]);
        
        const loaderSignal = _injectLoader(() => mockLoadFactory as any, inputsSignal, {});

        // Initial run
        inputsSignal.set('initial_input_url1');
        await flushEffects();

        expect(normalizeInputsSpy).toHaveBeenCalledTimes(1);
        expect(mockCachedResultPromisesEffect).toHaveBeenCalledTimes(1);
        expect(loaderSignal()).toBe('data1');

        // Trigger effect again with new input, normalizeInputs returns different URLs
        inputsSignal.set('input_causing_url2');
        await flushEffects();

        expect(normalizeInputsSpy).toHaveBeenCalledTimes(2);
        // Assert that core loading logic WAS called again
        expect(mockCachedResultPromisesEffect).toHaveBeenCalledTimes(2);
        expect(loaderSignal()).toBe('data2'); // Signal updated with new data
    });

    it('should correctly structure object results and update signal', async () => {
        normalizeInputsSpy.mockImplementation((input: Record<string,string>) => {
            if (typeof input === 'object' && !Array.isArray(input)) return Object.values(input);
            return [input as string];
        });

        mockCachedResultPromisesEffect.mockReturnValue([
            Promise.resolve('dataForUrlA'),
            Promise.resolve('dataForUrlB'),
        ]);
        
        const loaderSignal = _injectLoader(() => mockLoadFactory as any, inputsSignal, {});

        const inputObject = { keyA: 'urlA', keyB: 'urlB' };
        inputsSignal.set(inputObject);
        await flushEffects();

        expect(normalizeInputsSpy).toHaveBeenCalledWith(inputObject);
        expect(mockCachedResultPromisesEffect).toHaveBeenCalledTimes(1);
        expect(loaderSignal()).toEqual({
            keyA: 'dataForUrlA',
            keyB: 'dataForUrlB',
        });
    });
});

</tbody>
</table>
