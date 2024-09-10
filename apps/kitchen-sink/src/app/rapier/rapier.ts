import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { extend } from 'angular-three';
import * as THREE from 'three';

import { SCENES_MAP } from './constants';

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
						[routerLink]="['/rapier', example]"
						[title]="'Navigate to ' + example"
					></a>
				</li>
			}
		</ul>
	`,
	imports: [RouterOutlet, RouterLink, RouterLinkActive],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'rapier' },
})
export default class Rapier {
	protected examples = Object.keys(SCENES_MAP);
}
