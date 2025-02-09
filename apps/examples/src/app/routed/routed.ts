import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { extend, NgtRoutedScene } from 'angular-three';
import { NgtCanvas } from 'angular-three/dom';
import * as THREE from 'three';

extend(THREE);

@Component({
	template: `
		<div class="h-svh">
			<ngt-canvas>
				<ngt-routed-scene *canvasContent />
			</ngt-canvas>
		</div>

		<ul class="absolute bottom-0 left-0 flex items-center gap-2">
			<li>
				<a
					routerLink="red"
					class="underline"
					routerLinkActive="text-blue-500"
					[routerLinkActiveOptions]="{ exact: true }"
				>
					red
				</a>
			</li>
			<li>
				<a
					routerLink="blue"
					class="underline"
					routerLinkActive="text-blue-500"
					[routerLinkActiveOptions]="{ exact: true }"
				>
					blue
				</a>
			</li>
		</ul>
	`,
	imports: [NgtRoutedScene, RouterLink, RouterLinkActive, NgtCanvas],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'routed' },
})
export default class Routed {}
