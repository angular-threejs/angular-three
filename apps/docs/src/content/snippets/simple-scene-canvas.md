```angular-ts
import { NgtCanvasDeclarations } from 'angular-three/dom';
import { SceneGraph } from './scene-graph';

@Component({
  template: `
    <ngt-canvas>
      <app-scene-graph *canvasContent />
    </ngt-canvas>
  `,
  imports: [NgtCanvasDeclarations, SceneGraph]
})
export class SimpleScene {}
```
