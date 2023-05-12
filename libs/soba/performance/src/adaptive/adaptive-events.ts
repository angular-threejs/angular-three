import { Directive, effect, inject } from '@angular/core';
import { NgtStore } from 'angular-three';

@Directive({
    selector: 'ngts-adaptive-events',
    standalone: true,
})
export class NgtsAdaptiveEvents {
    constructor() {
        const store = inject(NgtStore);
        effect(
            (onCleanup) => {
                const enabled = store.get('events', 'enabled');
                onCleanup(() => {
                    const setEvents = store.get('setEvents');
                    setEvents({ enabled });
                });
            },
            { allowSignalWrites: true }
        );

        const performanceCurrent = store.select('performance', 'current');
        effect(
            () => {
                const setEvents = store.get('setEvents');
                setEvents({ enabled: performanceCurrent() === 1 });
            },
            { allowSignalWrites: true }
        );
    }
}
