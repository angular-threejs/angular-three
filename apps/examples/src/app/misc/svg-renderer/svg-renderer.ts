import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgtCanvasElement } from 'angular-three';
import { NgtCanvas, NgtCanvasContent } from 'angular-three/dom';
import { SVGRenderer } from 'three-stdlib';
import { SceneGraph } from './scene';

@Component({
	template: `
		<ngt-canvas [gl]="svgRendererFactory" [camera]="{ fov: 33, near: 0.1, far: 100, position: [0, 0, 10] }">
			<app-scene-graph *canvasContent />
		</ngt-canvas>
	`,
	imports: [NgtCanvas, SceneGraph, NgtCanvasContent],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SVGRendererExample {
	svgRendererFactory = (canvas: NgtCanvasElement) => {
		const renderer = new SVGRenderer();

		if (canvas instanceof HTMLCanvasElement) {
			canvas.style.display = 'none';
			canvas.parentElement?.appendChild(renderer.domElement);
		}

		return renderer;
	};
}
