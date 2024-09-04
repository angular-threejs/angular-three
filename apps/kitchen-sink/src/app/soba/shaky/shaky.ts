import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgtCanvas } from 'angular-three';
import { NgtsStats } from 'angular-three-soba/stats';
import { Experience } from './experience';

@Component({
	standalone: true,
	template: `
		<ngt-canvas
			[stats]="{ minimal: true }"
			[sceneGraph]="scene"
			[shadows]="true"
			[camera]="{ position: [0, 160, 160], fov: 20 }"
			[dpr]="[1, 2]"
		/>
	`,
	imports: [NgtCanvas, NgtsStats],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'shaky-soba' },
	styles: `
		:host {
			display: block;
			height: 100%;
			width: 100%;
			background: #ffb6c1;
			cursor: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIxNiIgY3k9IjE2IiByPSIxMCIgZmlsbD0id2hpdGUiLz48L3N2Zz4='),
				auto;
		}

		:host::after {
			content: '';
			position: absolute;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			background-image: url('/view.svg');
			background-repeat: no-repeat;
			background-position: center;
			background-size: contain;
			pointer-events: none;
		}
	`,
})
export default class RenderTexture {
	protected scene = Experience;
}
