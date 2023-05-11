import {
    ChangeDetectionStrategy,
    Component,
    ContentChild,
    Directive,
    InjectionToken,
    TemplateRef,
    ViewChild,
    ViewContainerRef,
    assertInInjectionContext,
    inject,
    signal,
    type Signal,
} from '@angular/core';
import { ObservableInput } from 'rxjs';

export type NgtSuspenseApi = {
    operations: Array<() => ObservableInput<unknown>>;
    unwrapped: Signal<unknown>;
};

export const SUSPENSE_API = new InjectionToken<NgtSuspenseApi>('Suspense API');

export function suspense<TValue>(cb: () => ObservableInput<TValue>): Signal<TValue> {
    assertInInjectionContext(suspense);
    const suspenseApi = inject(SUSPENSE_API);
    suspenseApi.operations.push(cb);
    return suspenseApi.unwrapped as Signal<TValue>;
}

@Directive({ selector: 'ng-template[fallback]', standalone: true })
export class NgtSuspenseFallback {}

@Component({
    selector: 'ngt-suspense',
    standalone: true,
    template: `
        <ng-template #content>
            <ng-content />
        </ng-template>
        <ng-container #anchor />
    `,
    host: { style: 'display: contents' },
    providers: [
        {
            provide: SUSPENSE_API,
            useValue: {
                operations: [],
                unwrapped: signal(null),
            },
        },
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgtSuspense {
    readonly #suspenseApi = inject(SUSPENSE_API, { self: true });

    @ContentChild(NgtSuspenseFallback, { read: TemplateRef }) fallbackTemplate?: TemplateRef<unknown>;
    @ViewChild('content', { read: TemplateRef, static: true }) contentTemplate!: TemplateRef<unknown>;
    @ViewChild('anchor', { read: ViewContainerRef, static: true }) anchor!: ViewContainerRef;

    ngOnInit() {}
}
