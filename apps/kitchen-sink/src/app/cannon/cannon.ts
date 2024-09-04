import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { extend } from 'angular-three';
import * as THREE from 'three';
import routes from './cannon.routes';

extend(THREE);

@Component({
	standalone: true,
	template: `
		<div class="h-svh">
			<router-outlet />
		</div>

		<ul class=" absolute left-12 bottom-12 grid grid-cols-6 gap-4">
			@for (example of examples; track example) {
				<li class="h-6 w-6">
					<a
						routerLinkActive
						#rla="routerLinkActive"
						class="inline-block h-full w-full rounded-full"
						[class]="rla.isActive ? 'bg-red-500' : 'bg-white'"
						[routerLinkActiveOptions]="{ exact: true }"
						[routerLink]="['/cannon', example]"
						[title]="'Navigate to ' + example"
					></a>
				</li>
			}
		</ul>
	`,
	imports: [RouterOutlet, RouterLink, RouterLinkActive],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'cannon' },
})
export default class Cannon {
	protected examples = routes.filter((route) => !!route.path).map((route) => route.path);
}
