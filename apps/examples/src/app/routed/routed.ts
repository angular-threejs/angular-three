import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { extend } from 'angular-three';
import { NgtCanvas } from 'angular-three/dom';
import * as THREE from 'three';
import { RoutedScene } from './routed-scene';

extend(THREE);

@Component({
	template: `
		<div class="h-svh">
			<ngt-canvas shadows [camera]="{ position: [0, 0, 20], fov: 50 }">
				<app-routed-scene *canvasContent />
			</ngt-canvas>
		</div>

		<ul class="absolute top-4 left-4 flex items-center gap-2">
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
	imports: [RoutedScene, RouterLink, RouterLinkActive, NgtCanvas],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'routed' },
})
export default class Routed {}
