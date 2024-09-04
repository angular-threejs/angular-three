import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgtCanvas } from 'angular-three';
import { Experience } from './experience';

@Component({
	standalone: true,
	template: `
		<div style="position: absolute; top: 50%; left: 50%; transform: translate3d(-50%,-50%,0)">
			<h1
				style="margin: 0; padding: 0; font-size: 15em; font-weight: 500; letter-spacing: -0.05em; line-height: 1; text-align: center"
			>
				<code>angular three</code>
			</h1>
		</div>
		<ngt-canvas [sceneGraph]="sceneGraph" [camera]="{ position: [0, 0, 1] }" />
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'stars-soba' },
	styles: `
		:host {
			display: block;
			height: 100%;
			width: 100%;
			background: #12071f;
		}

		h1 {
			background: linear-gradient(30deg, #c850c0, #ffcc70);
			-webkit-background-clip: text;
			-webkit-text-fill-color: transparent;
		}
	`,
	imports: [NgtCanvas],
})
export default class Stars {
	protected sceneGraph = Experience;
}
