import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
	standalone: true,
	template: `
		<div class="h-svh">
			<router-outlet />
		</div>

		<div class="absolute left-12 bottom-12 grid grid-cols-6 gap-4">
			@for (example of examples; track example) {
				<div class="h-6 w-6">
					<a
						[routerLink]="['/cannon', example]"
						[routerLinkActiveOptions]="{ exact: true }"
						[title]="'Navigate to ' + example"
						class="block rounded-full w-full h-full bg-white"
						routerLinkActive="bg-red-500"
					></a>
				</div>
			}
		</div>
	`,
	imports: [RouterOutlet, RouterLink, RouterLinkActive],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'cannon' },
})
export default class Cannon {
	examples = ['basic', 'kinematic-cube', 'compound', 'chain', 'cube-heap'];
}
