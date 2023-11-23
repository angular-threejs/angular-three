import { ChangeDetectorRef, Component } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { ROUTED_SCENE } from './renderer/constants';

@Component({
	standalone: true,
	selector: 'ngt-routed-scene',
	template: `
		<router-outlet />
	`,
	imports: [RouterOutlet],
})
export class NgtRoutedScene {
	static [ROUTED_SCENE] = true;

	constructor(router: Router, cdr: ChangeDetectorRef) {
		router.events
			.pipe(
				filter((event) => event instanceof ActivationEnd),
				takeUntilDestroyed(),
			)
			.subscribe(cdr.detectChanges.bind(cdr));
	}
}
