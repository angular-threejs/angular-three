# `angular-three`

A custom Renderer for Angular 19+ that uses Three.js to render 3D scenes.

## Official documentation

Please visit [angularthree-docs-next](https://angularthree-docs-next.netlify.app)

## Installation

```bash
npm install -D angular-three-plugin@next
npx ng generate angular-three-plugin:init
```

## Usage

- Create a `SceneGraph` component for your 3D scene graph

```typescript
import { extend } from 'angular-three';
import { Mesh, BoxGeometry } from 'three';

extend({
 Mesh, // makes ngt-mesh available
 BoxGeometry, // makes ngt-box-geometry available
 /* ... */
 MyMesh: Mesh, // makes ngt-my-mesh available
});

// alternatively for demo purposes, you can use the following
// extend(THREE);
// This includes the entire THREE.js namespace

@Component({
 selector: 'app-scene-graph',
 template: `
  <ngt-mesh>
   <ngt-box-geometry />
  </ngt-mesh>
 `,
 schemas: [CUSTOM_ELEMENTS_SCHEMA], // required
 changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SceneGraph {}
```

- Render the `SceneGraph` with `NgtCanvas`

```ts
import { NgtCanvas } from 'angular-three/dom';
import { SceneGraph } from './scene-graph';

@Component({
 // This Component is rendered normally in Angular.
 selector: 'app-my-experience',
 template: `
  <ngt-canvas>
   <app-scene-graph *canvasContent />
  </ngt-canvas>
 `,
 imports: [NgtCanvas],
})
export class MyExperience {}
```

> The Component that renders `NgtCanvas` (`MyExperience` in this case) controls the dimensions of the canvas so make sure to style it accordingly.

- Finally, provide the custom renderer in `bootstrapApplication`

```ts
import { provideNgtRenderer } from 'angular-three/dom';

bootstrapApplication(AppComponent, {
 providers: [provideNgtRenderer()],
});
```
