import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ecctrlExampleRoutes } from './ecctrl.routes';

@Component({
	template: `
		<div class="h-svh bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
			<router-outlet />
		</div>

		<ul class="absolute bottom-12 left-12 grid grid-cols-6 gap-4">
			@for (example of examples; track example) {
				<li class="h-6 w-6">
					<a
						routerLinkActive
						#rla="routerLinkActive"
						class="inline-block h-full w-full rounded-full"
						[class]="rla.isActive ? 'bg-orange-400' : 'bg-white'"
						[routerLinkActiveOptions]="{ exact: true }"
						[routerLink]="['/ecctrl', example]"
						[title]="'Navigate to ' + example"
					></a>
				</li>
			}
		</ul>
	`,
	imports: [RouterOutlet, RouterLink, RouterLinkActive],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'ecctrl' },
})
export default class Ecctrl {
	protected examples = ecctrlExampleRoutes.map((route) => route.path);
}
