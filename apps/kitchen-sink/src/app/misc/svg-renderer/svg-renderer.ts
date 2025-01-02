import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgtCanvas, NgtCanvasElement } from 'angular-three';
import { SVGRenderer } from 'three-stdlib';
import { Experience } from './experience';

@Component({
	template: `
		<ngt-canvas
			[sceneGraph]="sceneGraph"
			[gl]="svgRendererFactory"
			[camera]="{ fov: 33, near: 0.1, far: 100, position: [0, 0, 10] }"
		/>
	`,
	imports: [NgtCanvas],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SVGRendererExample {
	sceneGraph = Experience;

	svgRendererFactory = (canvas: NgtCanvasElement) => {
		const renderer = new SVGRenderer();

		if (canvas instanceof HTMLCanvasElement) {
			canvas.style.display = 'none';
			canvas.parentElement?.appendChild(renderer.domElement);
		}

		return renderer;
	};
}
