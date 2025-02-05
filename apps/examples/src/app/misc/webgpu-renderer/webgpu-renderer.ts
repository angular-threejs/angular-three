import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { NgtFrameloop, NgtGLOptions } from 'angular-three';
import { NgtCanvas, NgtCanvasContent } from 'angular-three/dom';
import * as THREE from 'three/webgpu';
import { SceneGraph } from './scene';

@Component({
	template: `
		<ngt-canvas [gl]="glFactory" [frameloop]="frameloop()">
			<app-scene-graph *canvasContent />
		</ngt-canvas>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtCanvas, NgtCanvasContent, SceneGraph],
	host: { class: 'webgpu-renderer' },
})
export default class WebGPURenderer {
	protected frameloop = signal<NgtFrameloop>('never');
	protected glFactory: NgtGLOptions = (canvas) => {
		const renderer = new THREE.WebGPURenderer({
			canvas: canvas as HTMLCanvasElement,
			antialias: true,
			forceWebGL: false,
		});

		renderer.init().then(() => {
			this.frameloop.set('always');
		});

		return renderer;
	};
}
