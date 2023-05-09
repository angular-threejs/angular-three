import { signal, type CreateSignalOptions, type WritableSignal } from '@angular/core';

export function createSignal<TValue>(initialValue: TValue, options: CreateSignalOptions<TValue> = {}) {
    const original = signal(initialValue, options);

    const originalSet = original.set.bind(original);
    const originalUpdate = original.update.bind(original);

    original.set = (...args: Parameters<WritableSignal<TValue>['set']>) => {
        try {
            originalSet(...args);
        } catch {
            requestAnimationFrame(() => originalSet(...args));
        }
    };

    original.update = (...args: Parameters<WritableSignal<TValue>['update']>) => {
        try {
            originalUpdate(...args);
        } catch {
            requestAnimationFrame(() => originalUpdate(...args));
        }
    };

    return original;
}
