import { ChangeDetectorRef, EnvironmentInjector, inject, OnDestroy, Pipe, PipeTransform } from '@angular/core';
import { isObservable, ObservableInput, Subscription } from 'rxjs';
import { safeDetectChanges } from '../utils/safe-detect-changes';

function isPromise(value: unknown): value is Promise<unknown> {
    return (
        (value instanceof Promise || Object.prototype.toString.call(value) === '[object Promise]') &&
        typeof (value as Promise<unknown>)['then'] === 'function'
    );
}

@Pipe({ name: 'ngtPush', pure: false, standalone: true })
export class NgtPush<T> implements PipeTransform, OnDestroy {
    private readonly cdr = inject(ChangeDetectorRef);
    private readonly parentCdr = inject(ChangeDetectorRef, { skipSelf: true, optional: true });
    private readonly envCdr = inject(EnvironmentInjector).get(ChangeDetectorRef, null);

    private sub?: Subscription;
    private obj?: ObservableInput<T>;
    private latestValue?: T;

    transform(value: ObservableInput<T>, defaultValue: T = null!): T {
        if (this.obj === value) return this.latestValue as T;

        this.obj = value;
        this.latestValue = defaultValue;

        if (this.sub) this.sub.unsubscribe();

        if (isObservable(this.obj)) this.sub = this.obj.subscribe(this.updateValue.bind(this));
        else if (isPromise(this.obj)) (this.obj as Promise<T>).then(this.updateValue.bind(this));
        else throw new Error(`[NGT] Invalid value passed to ngtPush pipe`);

        return this.latestValue as T;
    }

    private updateValue(val: T) {
        this.latestValue = val;
        safeDetectChanges(this.cdr);
        safeDetectChanges(this.parentCdr);
        safeDetectChanges(this.envCdr);
    }

    ngOnDestroy() {
        if (this.sub) this.sub.unsubscribe();
        this.latestValue = undefined;
        this.obj = undefined;
    }
}
