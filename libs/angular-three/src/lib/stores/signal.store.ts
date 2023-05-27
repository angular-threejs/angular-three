import {
    Inject,
    Injectable,
    Optional,
    computed,
    signal,
    untracked,
    type CreateComputedOptions,
    type Signal,
    type WritableSignal,
} from '@angular/core';
import type { NgtAnyRecord } from '../types';

const STORE_COMPUTED_KEY = '__ngt_store_computed__' as const;

@Injectable()
export class NgtSignalStore<TState extends object> {
    readonly #state: WritableSignal<TState>;
    readonly #computedCache = new Map();
    readonly state: Signal<TState>;

    constructor(
        @Optional()
        @Inject('INITIAL_STATE')
        initialState: Partial<TState> = {} as unknown as Partial<TState>
    ) {
        initialState ??= {};
        this.#state = signal(Object.assign(initialState, { __ngt_dummy_state__: Date.now() }) as TState);
        this.state = this.#state.asReadonly();
    }

    select<
        TKey1 extends keyof TState,
        TKey2 extends keyof TState[TKey1],
        TKey3 extends keyof TState[TKey1][TKey2],
        TKey4 extends keyof TState[TKey1][TKey2][TKey3]
    >(
        key1: TKey1,
        key2: TKey2,
        key3: TKey3,
        key4: TKey4,
        options?: CreateComputedOptions<TState[TKey1][TKey2][TKey3][TKey4]>
    ): Signal<TState[TKey1][TKey2][TKey3][TKey4]>;
    select<TKey1 extends keyof TState, TKey2 extends keyof TState[TKey1], TKey3 extends keyof TState[TKey1][TKey2]>(
        key1: TKey1,
        key2: TKey2,
        key3: TKey3,
        options?: CreateComputedOptions<TState[TKey1][TKey2][TKey3]>
    ): Signal<TState[TKey1][TKey2][TKey3]>;
    select<TKey1 extends keyof TState, TKey2 extends keyof TState[TKey1]>(
        key1: TKey1,
        key2: TKey2,
        options?: CreateComputedOptions<TState[TKey1][TKey2]>
    ): Signal<TState[TKey1][TKey2]>;
    select<TKey extends keyof TState>(key: TKey, options?: CreateComputedOptions<TState[TKey]>): Signal<TState[TKey]>;
    select(options?: CreateComputedOptions<TState>): Signal<TState>;
    select(...keysAndOptions: any[]) {
        if (keysAndOptions.length === 0) return this.state;
        if (keysAndOptions.length === 1 && typeof keysAndOptions[0] === 'object') {
            if (!this.#computedCache.has(STORE_COMPUTED_KEY)) {
                this.#computedCache.set(
                    STORE_COMPUTED_KEY,
                    computed(this.state, keysAndOptions as CreateComputedOptions<TState>)
                );
                return this.#computedCache.get(STORE_COMPUTED_KEY)!;
            }
        }
        const [keys, options] = parseOptions(keysAndOptions);

        const joinedKeys = keys.join('-');

        if (!this.#computedCache.has(joinedKeys)) {
            this.#computedCache.set(
                joinedKeys,
                computed(() => keys.reduce((value, key) => (value as NgtAnyRecord)[key], this.state()), options)
            );
        }

        return this.#computedCache.get(joinedKeys)!;
    }

    get<
        TKey1 extends keyof TState,
        TKey2 extends keyof TState[TKey1],
        TKey3 extends keyof TState[TKey1][TKey2],
        TKey4 extends keyof TState[TKey1][TKey2][TKey3]
    >(key1: TKey1, key2: TKey2, key3: TKey3, key4: TKey4): TState[TKey1][TKey2][TKey3][TKey4];
    get<TKey1 extends keyof TState, TKey2 extends keyof TState[TKey1], TKey3 extends keyof TState[TKey1][TKey2]>(
        key1: TKey1,
        key2: TKey2,
        key3: TKey3
    ): TState[TKey1][TKey2][TKey3];
    get<TKey1 extends keyof TState, TKey2 extends keyof TState[TKey1]>(key1: TKey1, key2: TKey2): TState[TKey1][TKey2];
    get<TKey extends keyof TState>(key: TKey): TState[TKey];
    get(): TState;
    get(...keys: string[]) {
        const state = untracked(this.state);
        if (keys.length === 0) return state;
        return keys.reduce((value, key) => (value as NgtAnyRecord)[key], state);
    }

    set(state: Partial<TState> | ((previous: TState) => Partial<TState>)) {
        const updater = (previous: TState) => {
            const partial = typeof state === 'function' ? state(previous) : state;
            Object.keys(partial).forEach((key) => {
                const partialKey = key as keyof TState;
                if (partial[partialKey] === undefined && previous[partialKey] != null) {
                    partial[partialKey] = previous[partialKey];
                }
            });
            return partial;
        };
        this.#state.update((previous) => ({ ...previous, ...updater(previous) }));
        // this.#state.update(previous => ({...previous, ...(typeof state === 'function' ? state(previous) : state)}))
    }

    patch(state: Partial<TState>) {
        const updater = (previous: TState) => {
            Object.keys(state).forEach((key) => {
                const partialKey = key as keyof TState;
                if (state[partialKey] === undefined && previous[partialKey] != null) {
                    state[partialKey] = previous[partialKey];
                }
            });
            return state;
        };
        this.#state.update((previous) => ({ ...updater(previous), ...previous }));
    }
}

function parseOptions(keysAndOptions: any[]): [string[], CreateComputedOptions<any>?] {
    if (typeof keysAndOptions.at(-1) === 'object') {
        return [keysAndOptions.slice(0, -1), keysAndOptions.at(-1)];
    }

    return [keysAndOptions];
}
