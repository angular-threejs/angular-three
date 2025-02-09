import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgtGLOptions } from 'angular-three';
import { NgtCanvas } from 'angular-three/dom';
import { SVGRenderer } from 'three-stdlib';
import { SceneGraph } from './scene';

@Component({
	template: `
		<ngt-canvas [gl]="svgRendererFactory" [camera]="{ fov: 33, near: 0.1, far: 100, position: [0, 0, 10] }">
			<app-scene-graph *canvasContent />
		</ngt-canvas>
	`,
	imports: [NgtCanvas, SceneGraph],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SVGRendererExample {
	svgRendererFactory: NgtGLOptions = ({ canvas }) => {
		const renderer = new SVGRenderer();

		if (canvas instanceof HTMLCanvasElement) {
			canvas.style.display = 'none';
			canvas.parentElement?.appendChild(renderer.domElement);
		}

		return renderer;
	};
}
