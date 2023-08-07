import { NgIf } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, Component, Input, forwardRef, signal } from '@angular/core';
import { NgtArgs, NgtSpotLight, extend, injectNgtRef } from 'angular-three';
import { createInjectionToken } from 'libs/core/src/lib/utils/create-injection-token';
import { Group, SpotLight, SpotLightHelper } from 'three';
import { NgtsSpotLightInput, type NgtsSpotLightInputState } from './spot-light-input';
import { NgtsVolumetricMesh } from './volumetric-mesh';

extend({ SpotLight, SpotLightHelper, Group });

declare global {
	interface HTMLElementTagNameMap {
		/**
		 * @extends ngt-spot-light
		 */
		'ngts-spot-light': NgtsSpotLightInputState & NgtSpotLight;
	}
}

export const [injectNgtsSpotLightApi, provideNgtsSpotLightApi] = createInjectionToken(
	(spotLight: NgtsSpotLight) => ({ spotLight: spotLight.spotLightRef, debug: spotLight.debug }),
	{ isRoot: false, deps: [forwardRef(() => NgtsSpotLight)] },
);

@Component({
	selector: 'ngts-spot-light',
	standalone: true,
	template: `
		<ngt-group>
			<ng-container *ngIf="debug() && spotLightRef.nativeElement">
				<ngt-spot-light-helper *args="[spotLightRef.nativeElement]" />
			</ng-container>
			<ngt-spot-light
				[ref]="spotLightRef"
				[color]="color()"
				[distance]="distance()"
				[angle]="angle()"
				[castShadow]="true"
				ngtCompound
			>
				<ngts-volumetric-mesh *ngIf="volumetric()" />
			</ngt-spot-light>
			<ng-content />
		</ngt-group>
	`,
	imports: [NgtsVolumetricMesh, NgIf, NgtArgs],
	providers: [provideNgtsSpotLightApi(), { provide: NgtsSpotLightInput, useExisting: NgtsSpotLight }],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsSpotLight extends NgtsSpotLightInput {
	@Input() spotLightRef = injectNgtRef<SpotLight>();

	volumetric = signal(true);
	@Input({ alias: 'volumetric' }) set _volumetric(volumetric: boolean) {
		this.volumetric.set(volumetric);
	}

	constructor() {
		super();
		this.inputs.set({
			opacity: 1,
			color: 'white',
			distance: 5,
			angle: 0.15,
			attenuation: 5,
			anglePower: 5,
			debug: false,
		});
	}
}
