import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { NgtsEnvironment } from 'angular-three-soba/staging';
import { Model } from './model';

@Component({
	template: `
		<ngt-ambient-light [intensity]="Math.PI" />
		<app-model />
		<ngts-environment [options]="{ preset: 'city' }" />
	`,
	imports: [Model, NgtsEnvironment],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'camera-scroll-soba-experience' },
})
export class Experience {
	protected readonly Math = Math;
}
