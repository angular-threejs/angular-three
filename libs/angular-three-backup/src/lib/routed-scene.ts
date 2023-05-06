import { Component } from '@angular/core';
import { ActivationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, takeUntil } from 'rxjs';
import { injectNgtDestroy } from './di/destroy';
import { safeDetectChanges } from './utils/safe-detect-changes';

@Component({
    standalone: true,
    selector: 'ngt-routed-scene',
    template: `<router-outlet />`,
    imports: [RouterOutlet],
})
export class NgtRoutedScene {
    static isRoutedScene = true;

    constructor(router: Router) {
        const { destroy$, cdr } = injectNgtDestroy();
        router.events
            .pipe(
                filter((event) => event instanceof ActivationEnd),
                takeUntil(destroy$)
            )
            .subscribe(() => safeDetectChanges(cdr));
    }
}
