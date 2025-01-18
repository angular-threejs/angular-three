import { ChangeDetectorRef, Component, Directive, effect, EnvironmentInjector } from '@angular/core';
import { ActivatedRoute, ActivationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { NGT_MANUAL_INJECTED_STORE } from './renderer/constants';
import { injectStore } from './store';

@Directive({ selector: 'ngt-router-outlet' })
/**
 * More hax
 * Use this with extreme caution.
 *
 * Basically, we grab the store and try to assign it on the activated class
 */
export class NgtRouterOutlet extends RouterOutlet {
	private store = injectStore({ optional: true });

	override activateWith(activatedRoute: ActivatedRoute, environmentInjector: EnvironmentInjector): void {
		if (this.store && activatedRoute.component) {
			Object.assign(activatedRoute.component, { [NGT_MANUAL_INJECTED_STORE]: this.store });
		}

		return super.activateWith(activatedRoute, environmentInjector);
	}
}

@Component({
	selector: 'ngt-routed-scene',
	template: `
		<ngt-router-outlet />
	`,
	imports: [NgtRouterOutlet],
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
