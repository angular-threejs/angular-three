import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@Component({
	selector: 'app-lighting',
	template: `
		<ngt-ambient-light [intensity]="0.4" color="#fff" />
		<ngt-directional-light
			[intensity]="1.5"
			color="#ffeedd"
			[position]="[5, 8, 3]"
			castShadow
			[shadow.mapSize.width]="2048"
			[shadow.mapSize.height]="2048"
			[shadow.normalBias]="0.04"
			[shadow.camera.near]="0.5"
			[shadow.camera.far]="50"
			[shadow.camera.left]="-10"
			[shadow.camera.right]="10"
			[shadow.camera.top]="10"
			[shadow.camera.bottom]="-10"
		/>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Lighting {}
