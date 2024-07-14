# `angular-three`

A custom Renderer for Angular 18+ that uses Three.js to render 3D scenes.

## Compatibility

Angular Three v2 is still in beta and aims to be compatible with Angular 17+.

## Installation

```bash
npm install angular-three@beta ngxtension three
# yarn add angular-three@beta ngxtension three
# pnpm add angular-three@beta ngxtension three
```

> Make sure to install `@types/three` as well

## Usage

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
	// This Component is rendered in the Custom Renderer
	standalone: true,
	template: `
		<ngt-mesh>
			<ngt-box-geometry />
		</ngt-mesh>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA], // required
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SceneGraph {}

@Component({
	// This Component is rendered normally in Angular.
	selector: 'app-my-experience',
	standalone: true,
	template: `
		<ngt-canvas [sceneGraph]="SceneGraph" />
	`,
	imports: [NgtCanvas],
})
export class MyExperience {
	SceneGraph = SceneGraph;
}
```

> The Component that renders `NgtCanvas` (`MyExperience` in this case) controls the dimensions of the canvas so make sure to style it accordingly.

### Inputs

- `sceneGraph: Type<any>`: **required**. This is the Component that renders your 3D Scene graph. It must be a standalone Component.
- `gl?: NgtGLOptions`: This input allows you to configure the WebGL renderer used by Angular Three. You can provide a THREE.js renderer instance, properties for the default renderer, or a function that returns a renderer based on the canvas element.
- `size?: NgtSize`: Specifies the dimensions of the renderer. If omitted, the component will automatically measure the canvas dimensions.
- `shadows?: boolean | 'basic' | 'percentage' | 'soft' | 'variance' | Partial<WebGLShadowMap>`: Enables or disables shadows in the scene. You can provide a boolean value to toggle shadows on or off, or use specific strings to control the shadow type. Additionally, you can pass partial WebGLShadowMap options for fine-tuning.
- `legacy?: boolean`: Disables three r139 color management when set to true.
- `linear?: boolean`: Switches off automatic sRGB color space and gamma correction when set to true.
- `flat?: boolean`: Uses THREE.NoToneMapping instead of THREE.ACESFilmicToneMapping when set to true.
- `orthographic?: boolean`: Creates an orthographic camera instead of a perspective camera when set to true.
- `frameloop?: 'always' | 'demand' | 'never'`: Controls the rendering mode. 'always' renders continuously, 'demand' renders only on state changes, and 'never' gives you manual control over rendering.
- `performance?: Partial<Omit<NgtPerformance, 'regress'>>`: Allows you to configure performance options for adaptive performance.
- `dpr?: NgtDpr`: Sets the target pixel ratio. You can provide a single number or a range [min, max].
- `raycaster?: Partial<Raycaster>`: Configures the default raycaster used for interaction.
- `scene?: Scene | Partial<Scene>`: Provides a THREE.js scene instance or properties to create a default scene.
- `camera?: NgtCamera | Partial<NgtObject3DNode<Camera>>`: Provides a THREE.js camera instance or properties to create a default camera. You can also set the manual property to true to take control of the camera projection.
- `events?: (store: NgtSignalStore<NgtState>) => NgtEventManager<HTMLElement>`: Allows you to customize the event manager for handling pointer events.
- `eventSource?: HTMLElement | ElementRef<HTMLElement>`: Specifies the target element where events are subscribed. By default, it's the div wrapping the canvas.
- `eventPrefix?: 'offset' | 'client' | 'page' | 'layer' | 'screen'`: Sets the event prefix used for canvas pointer events.
- `lookAt?: Vector3 | Parameters<Vector3['set']>`: Defines the default coordinate for the camera to look at.

### Outputs

- `created`: Emitted when the canvas is created.
- `pointerMissed`: Emitted when a pointer event is not captured by any element (aka clicking on the canvas)

## Intellisense support

Since Angular Three is a custom Renderer, the elements are not recognized by the Angular Language Service.

### Jetbrains IDE

The consumers can add `web-types` property to the workspace's `package.json` and set the value to `node_modules/angular-three/web-types.json`.

```json
{
	"web-types": "node_modules/angular-three/web-types.json"
}
```

### VSCode

Similarly, there's `node_modules/angular-three/metadata.json` file that can be used to provide intellisense support for VSCode users.

The consumers can enable it via `html.customData` in their `settings.json` file.

```json
{
	"html.customData": ["node_modules/angular-three/metadata.json"]
}
```

## Input Bindings

Input bindings for `ngt-*` elements work the same way as they do in Angular.

> You can consult THREE.js documentation on what is available on the entities

```html
<ngt-mesh [position]="[x, y, z]" [rotation]="[x, y, z]">
	<ngt-mesh-basic-material color="hotpink" />
</ngt-mesh>
```

## Events

Angular Three Custom Renderer supports the following events on applicable objects (`ngt-mesh`, `ngt-group` etc...)

```
'click',
'contextmenu',
'dblclick',
'pointerup',
'pointerdown',
'pointerover',
'pointerout',
'pointerenter',
'pointerleave',
'pointermove',
'pointermissed',
'pointercancel',
'wheel',
```

In addition, there are 2 special events that the consumers can listen to;

- `attached`: when the element is attached to its parent
- `updated`: when the element properties are updated

## Constructor Arguments

In THREE.js, there are some entities that require the consumers to dispose and recreate them if their parameters change; like the Geometries.

To handle this, Angular Three exports a `NgtArgs` structural directive that always accepts an Array of values. The consumers can consult THREE.js documentations to know what values are applicable for what entities and their order.

```html
<!-- for example, new BoxGeometry(width, height, depth) -->
<ngt-box-geometry *args="[width, height, depth]" />
```

`NgtArgs`, as a structural directive, ensures to create a new instance of the entity when the value changes

## Parameters

Beside the normal properties that `ngt-*` elements can accept for Input bindings, the consumers can also pass a `parameters` object to a special property `[parameters]` on the elements. This parameters object will be used to apply the properties on the entity.

```html
<!-- instead of <ngt-mesh [position]="[x, y, z]" [scale]="scale" /> -->
<ngt-mesh [parameters]="{ position: [x, y, z], scale }" />
```

## Element Queries

The consumers can query for the THREE.js entities like they would do in normal HTML Angular Template.

```ts
@Component({
	template: `
		<ngt-mesh #mesh></ngt-mesh>
	`,
})
export class Box {
	mesh = viewChild.required<ElementRef<Mesh>>('mesh');
	//  notice that it is an ElementRef of THREE.Mesh instead of an HTMLElement
}
```

## Animation Loop

In order to participate in the animation loop, use `injectBeforeRender` inject function

```ts
@Component({
	/*...*/
})
export class Box {
	mesh = viewChild.required<ElementRef<Mesh>>('mesh');

	constructor() {
		injectBeforeRender(() => {
			// runs every frame
			const mesh = this.mesh().nativeElement;
			mesh.rotation.x += 0.01;
		});
	}
}
```

## Store

Angular Three keeps track of its state via an internal store. The consumers can access this store via the `injectStore` inject function

```ts
export class Box {
	store = injectStore();
	viewport = this.store.select('viewport'); // Signal<NgtViewport>
	camera = this.store.select('camera'); // Signal<NgtCamera> - the default camera
	/* many more properties */
}
```
