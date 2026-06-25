import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivationEnd, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';

@Component({
	selector: 'app-root',
	template: `
		<router-outlet />

		<div class="absolute bottom-4 right-4 flex gap-4 items-center">
			<div class="relative">
				<select
					class="h-11 min-w-44 appearance-none rounded-full border border-white/20 bg-black/55 py-0 pl-5 pr-11 font-mono text-sm font-medium text-white shadow-2xl shadow-black/30 backdrop-blur-md transition hover:border-white/35 hover:bg-black/65 focus:outline-none focus:ring-2 focus:ring-white/35"
					[value]="currentRoute()"
					(change)="onChange($event)"
				>
					<option class="bg-neutral-950 text-white" value="soba">/soba</option>
					<option class="bg-neutral-950 text-white" value="cannon">/cannon</option>
					<option class="bg-neutral-950 text-white" value="postprocessing">/postprocessing</option>
					<option class="bg-neutral-950 text-white" value="rapier">/rapier</option>
					<option class="bg-neutral-950 text-white" value="theatre">/theatre</option>
					<option class="bg-neutral-950 text-white" value="misc">/misc</option>
					<option class="bg-neutral-950 text-white" value="routed">/routed</option>
					<option class="bg-neutral-950 text-white" value="routed-rocks">/routed-rocks</option>
				</select>
				<svg
					class="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/70"
					viewBox="0 0 20 20"
					fill="currentColor"
					aria-hidden="true"
				>
					<path
						fill-rule="evenodd"
						d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z"
						clip-rule="evenodd"
					/>
				</svg>
			</div>

			<a
				class="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/55 text-white shadow-2xl shadow-black/30 backdrop-blur-md transition hover:border-white/35 hover:bg-black/65 focus:outline-none focus:ring-2 focus:ring-white/35"
				[href]="currentSourcePath()"
				target="_blank"
				title="View source"
			>
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
		return `https://github.com/angular-threejs/angular-three/tree/main/apps/examples/src/app/${paths.join('/')}`;
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
