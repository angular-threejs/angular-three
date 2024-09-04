import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgtCanvas } from 'angular-three';
import { Experience } from './experience';

@Component({
	standalone: true,
	template: `
		<ngt-canvas [sceneGraph]="scene" />
	`,
	imports: [NgtCanvas],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'hud-soba' },
})
export default class RenderTexture {
	protected scene = Experience;
}
