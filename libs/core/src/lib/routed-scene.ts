import { ChangeDetectorRef, Component, effect } from '@angular/core';
import { ActivationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';

/**
 * Component for rendering Three.js scenes based on Angular Router routes.
 *
 * This component wraps a router-outlet and ensures proper change detection
 * when routes change. Use this when you want to have different Three.js scenes
 * for different routes in your application.
 *
 * @example
 * ```typescript
 * // In your routes configuration
 * const routes: Routes = [
 *   { path: 'scene1', component: Scene1Component },
 *   { path: 'scene2', component: Scene2Component },
 * ];
 *
 * // In your template
 * <ngt-canvas>
 *   <ngt-routed-scene *canvasContent />
 * </ngt-canvas>
 * ```
 */
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
