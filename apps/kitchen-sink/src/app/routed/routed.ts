import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { extend, NgtCanvas } from 'angular-three';
import * as THREE from 'three';
import { CustomRoutedScene } from './custom-routed-scene';

extend(THREE);

@Component({
	template: `
		<div class="h-svh">
			<ngt-canvas [sceneGraph]="routedScene" />
		</div>

		<ul class="absolute bottom-0 left-0 flex items-center gap-2">
			<li>
				<a
					routerLink="red"
					class="underline"
					routerLinkActive="text-blue-500"
					[routerLinkActiveOptions]="{ exact: true }"
				>
					Red Cube
				</a>
			</li>
			<li>
				<a
					routerLink="blue"
					class="underline"
					routerLinkActive="text-blue-500"
					[routerLinkActiveOptions]="{ exact: true }"
				>
					Blue Cube
				</a>
			</li>
		</ul>
	`,
	imports: [NgtCanvas, RouterLink, RouterLinkActive],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'routed' },
})
export default class Routed {
	routedScene = CustomRoutedScene;
}
