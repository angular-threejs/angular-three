import { Component, effect, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map, tap } from 'rxjs';

@Component({
	selector: 'app-root',
	standalone: true,
	template: `
		<router-outlet />
		<select class="absolute bottom-4 right-4 font-mono" [value]="currentRoute()" (change)="onChange($event)">
			<option value="soba">/soba</option>
			<option value="cannon">/cannon</option>
			<option value="postprocessing">/postprocessing</option>
		</select>
	`,
	imports: [RouterOutlet],
})
export class AppComponent {
	currentRoute = signal('soba');

	private router = inject(Router);

	constructor() {
		effect((onCleanup) => {
			const sub = this.router.events
				.pipe(
					filter((event) => event instanceof NavigationEnd),
					map(() => this.router.url),
					tap((url) => {
						const [segment] = url.split('/').filter(Boolean);
						this.currentRoute.set(segment);
					}),
				)
				.subscribe();

			onCleanup(() => sub.unsubscribe());
		});
	}

	onChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		void this.router.navigate([target.value]);
	}
}
