```angular-ts
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgtCanvas, NgtCanvasContent, provideNgtRenderer } from 'angular-three/dom';
import { SceneGraph } from '../hud/scene-graph';

@Component({
	selector: 'rapier-demo',
	template: `
		<ngt-canvas [camera]="{ position: [-1, 5, 5], fov: 45 }" shadows>
			<app-scene-graph *canvasContent />
		</ngt-canvas>
	`,
	imports: [NgtCanvas, NgtCanvasContent, SceneGraph],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class RapierDemo {
	static clientProviders = [provideNgtRenderer()];
}
```
