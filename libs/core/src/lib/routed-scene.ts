import {
	ChangeDetectorRef,
	Component,
	createEnvironmentInjector,
	Directive,
	effect,
	EnvironmentInjector,
	inject,
	InjectFlags,
	InjectOptions,
	ProviderToken,
	RendererFactory2,
	runInInjectionContext,
} from '@angular/core';
import { ActivatedRoute, ActivationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { ROUTED_SCENE } from './renderer/constants';

/**
 * This is a custom EnvironmentInjector that returns the RendererFactory2 from the `ngtEnvironmentInjector`
 * for `NgtRendererFactory`
 */
class NgtOutletEnvironmentInjector extends EnvironmentInjector {
	constructor(
		private readonly routeEnvInjector: EnvironmentInjector,
		private readonly ngtEnvInjector: EnvironmentInjector,
	) {
		super();
	}

	override get<T>(
		token: ProviderToken<T>,
		notFoundValue?: unknown,
		flags: InjectFlags | InjectOptions = InjectFlags.Default,
	): any {
		const options: InjectOptions = {};

		if (typeof flags === 'object') {
			Object.assign(options, flags);
		} else {
			Object.assign(options, {
				optional: !!(flags & InjectFlags.Optional),
				host: !!(flags & InjectFlags.Host),
				self: !!(flags & InjectFlags.Self),
				skipSelf: !!(flags & InjectFlags.SkipSelf),
			});
		}

		if (token === RendererFactory2) {
			return this.ngtEnvInjector.get(token, notFoundValue, options);
		}

		return this.routeEnvInjector.get(token, notFoundValue, options);
	}

	override runInContext<ReturnT>(fn: () => ReturnT): ReturnT {
		try {
			return runInInjectionContext(this.routeEnvInjector, fn);
		} catch {}

		return runInInjectionContext(this.ngtEnvInjector, fn);
	}

	override destroy(): void {
		this.routeEnvInjector.destroy();
	}
}

@Directive({ selector: 'ngt-router-outlet' })
/**
 * This is a custom RouterOutlet that modifies `activateWith` to inherit the `EnvironmentInjector`
 * that contains the custom `NgtRendererFactory`.
 *
 * Use this with extreme caution.
 */
export class NgtRouterOutlet extends RouterOutlet {
	private environmentInjector = inject(EnvironmentInjector);

	override activateWith(activatedRoute: ActivatedRoute, environmentInjector: EnvironmentInjector): void {
		const activateWithEnvInjector =
			this.environmentInjector === environmentInjector
				? environmentInjector
				: createEnvironmentInjector(
						[],
						new NgtOutletEnvironmentInjector(environmentInjector, this.environmentInjector),
					);

		return super.activateWith(activatedRoute, activateWithEnvInjector);
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
	static [ROUTED_SCENE] = true;

	constructor(router: Router, cdr: ChangeDetectorRef) {
		effect((onCleanup) => {
			const sub = router.events
				.pipe(filter((event) => event instanceof ActivationEnd))
				.subscribe(cdr.detectChanges.bind(cdr));
			onCleanup(() => sub.unsubscribe());
		});
	}
}
