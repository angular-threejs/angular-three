import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgtCanvas, NgtCanvasContent } from 'angular-three/dom';
import { SceneGraph } from './scene';

@Component({
	template: `
		<div style="position: absolute; top: 50%; left: 50%; transform: translate3d(-50%,-50%,0)">
			<h1
				style="margin: 0; padding: 0; font-size: 15em; font-weight: 500; letter-spacing: -0.05em; line-height: 1; text-align: center;"
			>
				<code>angular three</code>
			</h1>
		</div>
		<ngt-canvas [camera]="{ position: [0, 0, 1] }">
			<app-stars-scene-graph *canvasContent />
		</ngt-canvas>
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
	imports: [NgtCanvas, SceneGraph, NgtCanvasContent],
})
export default class Stars {}
