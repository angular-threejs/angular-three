import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, inject } from '@angular/core';
import { FlowShieldState } from './state';

@Component({
	selector: 'app-lighting',
	template: `
		<ngt-ambient-light [intensity]="state.lighting.ambientIntensity()" [color]="state.lighting.ambientColor()" />
		<ngt-directional-light
			[intensity]="state.lighting.directionalIntensity()"
			[color]="state.lighting.directionalColor()"
			[position]="state.lighting.directionalPosition()"
			castShadow
			[shadow.mapSize.width]="state.lighting.shadowMapWidth()"
			[shadow.mapSize.height]="state.lighting.shadowMapHeight()"
			[shadow.normalBias]="state.lighting.shadowNormalBias()"
			[shadow.camera.near]="state.lighting.shadowCameraNear()"
			[shadow.camera.far]="state.lighting.shadowCameraFar()"
			[shadow.camera.left]="state.lighting.shadowCameraLeft()"
			[shadow.camera.right]="state.lighting.shadowCameraRight()"
			[shadow.camera.top]="state.lighting.shadowCameraTop()"
			[shadow.camera.bottom]="state.lighting.shadowCameraBottom()"
		/>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Lighting {
	protected state = inject(FlowShieldState);
}
