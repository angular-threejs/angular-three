import { ChangeDetectorRef, Component, effect } from '@angular/core';
import { ActivationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';

@Component({
	selector: 'ngt-routed-scene',
	template: `
		<router-outlet />
	`,
	imports: [RouterOutlet],
})
export class NgtRoutedScene {
	constructor(router: Router, cdr: ChangeDetectorRef) {
		effect((onCleanup) => {
			const sub = router.events
				.pipe(filter((event) => event instanceof ActivationEnd))
				.subscribe(cdr.detectChanges.bind(cdr));
			onCleanup(() => sub.unsubscribe());
		});
	}
}
