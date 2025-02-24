import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { NgtFrameloop, NgtGLOptions } from 'angular-three';
import { NgtCanvas } from 'angular-three/dom';
import * as THREE from 'three/webgpu';
import { SceneGraph } from './scene';

@Component({
	template: `
		<ngt-canvas shadows [gl]="glFactory" [frameloop]="frameloop()">
			<app-scene-graph *canvasContent />
		</ngt-canvas>

		<code class="absolute top-10 right-4 px-4 max-w-[50%]">
			* There seems to be an issue with WebGPURenderer and dispose process. Environment map will not load properly
			on navigating away and back.
		</code>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtCanvas, SceneGraph],
	host: { class: 'webgpu-tsl' },
})
export default class WebGPUTSL {
	protected frameloop = signal<NgtFrameloop>('never');
	protected glFactory: NgtGLOptions = (defaultOptions) => {
		const renderer = new THREE.WebGPURenderer({
			canvas: defaultOptions.canvas as HTMLCanvasElement,
			antialias: true,
			forceWebGL: false,
		});

		renderer.init().then(() => {
			this.frameloop.set('always');
		});

		const dispose = renderer.dispose.bind(renderer);
		Object.assign(renderer, {
			dispose: () => {
				renderer._renderLists?.dispose();
				renderer._renderContexts?.dispose();
				dispose();
			},
		});

		return renderer;
	};
}
