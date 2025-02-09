import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { NgtFrameloop, NgtGLOptions } from 'angular-three';
import { NgtCanvas } from 'angular-three/dom';
import * as THREE from 'three/webgpu';
import { SceneGraph } from './scene';

@Component({
	template: `
		<ngt-canvas [gl]="glFactory" [frameloop]="frameloop()">
			<app-scene-graph *canvasContent />
		</ngt-canvas>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtCanvas, SceneGraph],
	host: { class: 'webgpu-renderer' },
})
export default class WebGPURenderer {
	protected frameloop = signal<NgtFrameloop>('never');
	protected glFactory: NgtGLOptions = (defaultOptions) => {
		const renderer = new THREE.WebGPURenderer({
			canvas: defaultOptions.canvas as HTMLCanvasElement,
			powerPreference: 'high-performance',
			antialias: true,
			forceWebGL: false,
		});

		renderer.init().then(() => {
			this.frameloop.set('always');
		});

		return renderer;
	};
}
