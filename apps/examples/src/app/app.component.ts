import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivationEnd, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';

@Component({
	selector: 'app-root',
	template: `
		<router-outlet />

		<div class="absolute bottom-4 right-4 flex gap-4 items-center">
			<select [value]="currentRoute()" (change)="onChange($event)">
				<option value="soba">/soba</option>
				<option value="cannon">/cannon</option>
				<option value="postprocessing">/postprocessing</option>
				<option value="rapier">/rapier</option>
				<option value="theatre">/theatre</option>
				<option value="misc">/misc</option>
				<option value="routed">/routed</option>
				<option value="routed-rocks">/routed-rocks</option>
			</select>

			<div class="bg-white rounded-full p-2 text-black border border-white border-dashed">
				<a class="cursor-pointer" [href]="currentSourcePath()" target="_blank" title="View source">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="1.5"
						stroke="currentColor"
						class="h-6 w-6"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5"
						/>
					</svg>
				</a>
			</div>
		</div>

		@if (currentActivatedRouteCredits(); as credits) {
			<div class="absolute top-2 right-2 font-mono" [class]="credits.class">
				Credits:
				<a class="underline" [href]="credits.link" target="_blank" rel="noreferrer">{{ credits.title }}</a>
			</div>
		}
	`,
	imports: [RouterOutlet],
})
export class AppComponent {
	private router = inject(Router);

	private navigationEnd = toSignal(this.router.events.pipe(filter((event) => event instanceof NavigationEnd)));
	private activationEnd = toSignal(this.router.events.pipe(filter((event) => event instanceof ActivationEnd)));

	protected currentRoute = computed(() => {
		const navigationEnd = this.navigationEnd();
		if (!navigationEnd) return 'soba';
		const [segment] = navigationEnd.urlAfterRedirects.split('/').filter(Boolean);
		return segment;
	});

	protected currentSourcePath = computed(() => {
		const navigationEnd = this.navigationEnd();
		if (!navigationEnd) return '';
		const paths = navigationEnd.urlAfterRedirects.split('/').filter(Boolean);
		return `https://github.com/angular-threejs/angular-three/tree/v4-next/apps/examples/src/app/${paths.join('/')}`;
	});

	protected currentActivatedRouteCredits = computed(() => {
		const activationEnd = this.activationEnd();
		if (!activationEnd) return null;

		let deepestChild = activationEnd.snapshot;
		while (deepestChild && deepestChild.firstChild) {
			deepestChild = deepestChild.firstChild;
		}

		if (!deepestChild) return null;

		return deepestChild.data['credits'] as { title: string; link: string; class: string };
	});

	protected onChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		void this.router.navigate([target.value]);
	}
}
