import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';

@Component({
	selector: 'app-root',
	standalone: true,
	template: `
		<router-outlet />
		<select class="absolute bottom-4 right-4 font-mono" [value]="currentRoute()" (change)="onChange($event)">
			<option value="soba">/soba</option>
			<option value="cannon">/cannon</option>
			<option value="postprocessing">/postprocessing</option>
			<option value="rapier">/rapier</option>
			<option value="misc">/misc</option>
		</select>
	`,
	imports: [RouterOutlet],
})
export class AppComponent {
	private router = inject(Router);

	currentRoute = toSignal(
		this.router.events.pipe(
			filter((event) => event instanceof NavigationEnd),
			map(() => {
				const [segment] = this.router.url.split('/').filter(Boolean);
				return segment;
			}),
		),
		{ initialValue: 'soba' },
	);

	onChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		void this.router.navigate([target.value]);
	}
}
