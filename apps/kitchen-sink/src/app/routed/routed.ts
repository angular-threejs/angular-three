import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { extend, NgtCanvas } from 'angular-three';
import * as THREE from 'three';
import { CustomRoutedScene } from './custom-routed-scene';

extend(THREE);

@Component({
	template: `
		<div class="h-svh">
			<ngt-canvas [sceneGraph]="routedScene" shadows [camera]="{ position: [0, 0, 20], fov: 50 }" />
		</div>

		<ul class="absolute bottom-0 left-0 flex items-center gap-2">
			<li>
				<a
					routerLink="knot"
					class="underline"
					routerLinkActive="text-blue-500"
					[routerLinkActiveOptions]="{ exact: true }"
				>
					knot
				</a>
			</li>
			<li>
				<a
					routerLink="torus"
					class="underline"
					routerLinkActive="text-blue-500"
					[routerLinkActiveOptions]="{ exact: true }"
				>
					torus
				</a>
			</li>
			<li>
				<a
					routerLink="bomb"
					class="underline"
					routerLinkActive="text-blue-500"
					[routerLinkActiveOptions]="{ exact: true }"
				>
					bomb
				</a>
			</li>
		</ul>
	`,
	imports: [NgtCanvas, RouterLink, RouterLinkActive],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'routed' },
})
export default class Routed {
	protected routedScene = CustomRoutedScene;
}
