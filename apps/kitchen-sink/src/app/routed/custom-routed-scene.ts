import { Component, CUSTOM_ELEMENTS_SCHEMA, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { injectBeforeRender, NgtArgs, NgtRouterOutlet, ROUTED_SCENE } from 'angular-three';
import { NgtpEffectComposer, NgtpTiltShift2 } from 'angular-three-postprocessing';
import { NgtpN8AO } from 'angular-three-postprocessing/n8ao';
import { NgtsContactShadows, NgtsEnvironment, NgtsFloat, NgtsLightformer } from 'angular-three-soba/staging';
import { easing } from 'maath';
import { filter, map, startWith } from 'rxjs';
import { CurrentRoute } from './current-route';

@Component({
	template: `
		<ngt-color *args="['#e0e0e0']" attach="background" />
		<ngt-spot-light
			[position]="[20, 20, 10]"
			[penumbra]="1"
			[castShadow]="true"
			[angle]="0.2"
			[decay]="0"
			[intensity]="Math.PI"
		/>

		<app-current-route [position]="[0, 0, -10]" [text]="currentRoute()" />

		<ngts-float [options]="{ floatIntensity: 2 }">
			<ngt-router-outlet />
		</ngts-float>

		<ngts-contact-shadows [options]="{ scale: 100, position: [0, -7.5, 0], blur: 1, far: 100, opacity: 0.85 }" />
		<ngts-environment [options]="{ preset: 'city' }">
			<ngts-lightformer
				*
				[options]="{ position: [10, 5, 0], scale: [10, 50, 1], intensity: Math.PI * 8, target: [0, 0, 0] }"
			/>
		</ngts-environment>

		<ngtp-effect-composer [options]="{ enableNormalPass: false }">
			<ngtp-n8ao [options]="{ aoRadius: 1, intensity: Math.PI * 2 }" />
			<ngtp-tilt-shift2 [options]="{ blur: 0.2 }" />
		</ngtp-effect-composer>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	imports: [
		NgtRouterOutlet,
		NgtArgs,
		NgtsFloat,
		CurrentRoute,
		NgtsContactShadows,
		NgtsEnvironment,
		NgtsLightformer,
		NgtpEffectComposer,
		NgtpN8AO,
		NgtpTiltShift2,
	],
})
export class CustomRoutedScene {
	static [ROUTED_SCENE] = true;

	protected readonly Math = Math;

	private router = inject(Router);
	protected currentRoute = toSignal(
		this.router.events.pipe(
			filter((ev): ev is NavigationEnd => ev instanceof NavigationEnd),
			map((ev) => ev.urlAfterRedirects.split('/routed').at(-1) as string),
			startWith(this.router.url.split('/routed').at(-1) as string),
		),
		{ initialValue: '/knot' },
	);

	constructor() {
		injectBeforeRender(({ camera, pointer, delta }) => {
			easing.damp3(
				camera.position,
				[Math.sin(-pointer.x) * 5, pointer.y * 3.5, 15 + Math.cos(pointer.x) * 10],
				0.2,
				delta,
			);
			camera.lookAt(0, 0, 0);
		});
	}
}
