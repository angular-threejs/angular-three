import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgtCanvas } from 'angular-three';
import { NgtsLoader } from 'angular-three-soba/loaders';
import { NgtsStats } from 'angular-three-soba/stats';
import { Experience } from './experience';

@Component({
	standalone: true,
	template: `
		<ngt-canvas stats [sceneGraph]="scene" frameloop="demand" [camera]="{ position: [0, 0, 40] }" />
		<ngts-loader />
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtCanvas, NgtsLoader, NgtsStats],
	host: { class: 'lod-soba' },
})
export default class LOD {
	protected scene = Experience;
}
