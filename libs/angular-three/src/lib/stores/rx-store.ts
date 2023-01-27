import { Injectable } from '@angular/core';
import { RxState } from '@rx-angular/state';
import { MonoTypeOperatorFunction, Observable, startWith, tap } from 'rxjs';
import type { NgtAnyRecord } from '../types';
import { is } from '../utils/is';

export const startWithUndefined = <T>(): MonoTypeOperatorFunction<T> => startWith<T>(undefined! as T);

type EffectFn<TValue> = (
    value: TValue
) => void | undefined | ((cleanUpParams: { prev: TValue | undefined; complete: boolean; error: boolean }) => void);

/**
 * An extended `tap` operator that accepts an `effectFn` which:
 * - runs on every `next` notification from `source$`
 * - can optionally return a `cleanUp` function that
 * invokes from the 2nd `next` notification onward and on `unsubscribe` (destroyed)
 *
 *
 * @example
 * ```typescript
 * source$.pipe(
 *  tapEffect((sourceValue) = {
 *    const cb = () => {
 *      doStuff(sourceValue);
 *    };
 *    addListener('event', cb);
 *
 *    return () => {
 *      removeListener('event', cb);
 *    }
 *  })
 * )
 * ```
 */
export function tapEffect<TValue>(effectFn: EffectFn<TValue>): MonoTypeOperatorFunction<TValue> {
    let cleanupFn: (cleanUpParams: { prev: TValue | undefined; complete: boolean; error: boolean }) => void = () => {};
    let firstRun = false;
    let prev: TValue | undefined = undefined;

    const teardown = (error: boolean) => {
        return () => {
            if (cleanupFn) {
                cleanupFn({ prev, complete: true, error });
            }
        };
    };

    return tap<TValue>({
        next: (value: TValue) => {
            if (cleanupFn && firstRun) {
                cleanupFn({ prev, complete: false, error: false });
            }

            const cleanUpOrVoid = effectFn(value);
            if (cleanUpOrVoid) {
                cleanupFn = cleanUpOrVoid;
            }

            prev = value;

            if (!firstRun) {
                firstRun = true;
            }
        },
        complete: teardown(false),
        unsubscribe: teardown(false),
        error: teardown(true),
    });
}

@Injectable()
export class NgtRxStore<
    TState extends object = any,
    TRxState extends object = TState & Record<string, any>
> extends RxState<TRxState> {
    constructor() {
        super();
        // set a dummy property so that initial this.get() won't return undefined
        this.set({ __ngt_dummy__: '__ngt_dummy__' } as TRxState);
        // call initialize that might be setup by derived Stores
        this.initialize();
        // override set so our consumers don't have to handle undefined for state that already have default values
        const originalSet = this.set.bind(this);
        Object.defineProperty(this, 'set', {
            get: () => {
                // Parameters type does not do well with overloads (RxState#set). So we use any[] here
                return (...args: any[]) => {
                    const firstArg = args[0];
                    if (is.obj(firstArg)) {
                        const modArgs = Object.entries(firstArg).reduce((modded, [key, value]) => {
                            modded[key] = value === undefined ? this.get(key as keyof TRxState) : value;
                            return modded;
                        }, {} as NgtAnyRecord);
                        return originalSet(modArgs as Partial<TRxState>);
                    }
                    // @ts-expect-error not sure why ...args here doesn't pass tuple check
                    return originalSet(...args);
                };
            },
        });
    }

    protected initialize() {
        return;
    }

    effect<S>(obs: Observable<S>, sideEffectFn: EffectFn<S>): void {
        return this.hold(obs.pipe(tapEffect(sideEffectFn)));
    }
}
