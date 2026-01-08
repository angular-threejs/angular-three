# `angular-three-soba/misc`

This secondary entry point includes miscellaneous utilities and components for animations, shadows, frame buffer objects (FBOs), HTML overlays, and more.

## TOC

- [animations](#animations)
- [fbo](#fbo)
- [NgtsFBO](#ngtsfbo)
- [NgtsBakeShadows](#ngtsbakeshadows)
- [NgtsSoftShadows](#ngtssoftshadows)
- [depthBuffer](#depthbuffer)
- [NgtsSampler](#ngtssampler)
- [surfaceSampler](#surfacesampler)
- [NgtsComputedAttribute](#ngtscomputedattribute)
- [NgtsDecal](#ngtsdecal)
- [NgtsHTML](#ngtshtml)
- [intersect](#intersect)
- [NgtsIntersect](#ngtsintersect)
- [NgtsPreload](#ngtspreload)
- [calculateScaleFactor](#calculatescalefactor)
- [getVersion](#getversion)
- [setUpdateRange](#setupdaterange)

## `animations`

```ts
function animations<TAnimation extends NgtsAnimationClip>(
	animationsFactory: () => NgtsAnimation<TAnimation> | undefined | null,
	object: ElementRef<Object3D> | Object3D | (() => ElementRef<Object3D> | Object3D | undefined | null),
	{ injector }: { injector?: Injector } = {},
): NgtsAnimationApi<TAnimation>;
```

Creates an animation API for managing THREE.js animation clips on an object. It takes a Signal of animation clips (an array or an object containing an array), a reference to the object to be animated, and an optional injector.

This function is commonly used together with `gltfResource` since GLTF files often contain animation data for 3D models. It provides an abstraction around `AnimationMixer`, which simplifies the process of playing and controlling animations.

The `NgtsAnimationApi` object contains the following properties:

- `clips`: An array of `AnimationClip` objects representing the available animations.
- `mixer`: An instance of `AnimationMixer` used to control the playback of animations.
- `names`: An array of strings representing the names of the available animations.
- `actions`: An object where keys are animation names and values are `AnimationAction` objects (available when `isReady` is `true`).
- `isReady`: A getter indicating if the animations have finished initializing.

```ts
const gltf = gltfResource(() => 'model.glb');
const api = animations(
	() => gltf.value()?.animations,
	() => gltf.value()?.scene,
);

effect(() => {
	if (api.isReady) {
		api.actions['walk'].play();
	}
});
```

> **Note**: `injectAnimations` is deprecated. Use `animations` instead.

## `fbo`

```ts
function fbo(
	params: () => NgtsFBOParams = () => ({}),
	{ injector }: { injector?: Injector } = {},
): THREE.WebGLRenderTarget;
```

Creates a `WebGLRenderTarget` (Frame Buffer Object) for off-screen rendering. It takes a Signal of FBO parameters and an optional injector. The FBO is automatically sized to the canvas dimensions if width/height are not specified, and is disposed on component destroy.

The `NgtsFBOParams` object includes the following properties:

- `width`: The width of the FBO in pixels, or `RenderTargetOptions` if height is not provided. Defaults to canvas width × device pixel ratio.
- `height`: The height of the FBO in pixels. Defaults to canvas height × device pixel ratio.
- `settings`: An object containing `THREE.RenderTargetOptions` for the FBO.
    - `samples`: The number of samples for multisample anti-aliasing (MSAA). Set to 0 to disable MSAA. (Default: 0)
    - `depth`: If set, the scene depth will be rendered into buffer.depthTexture. (Default: false)
    - `wrapS`: The wrapping mode for the s-coordinate of the FBO texture.
    - `wrapT`: The wrapping mode for the t-coordinate of the FBO texture.
    - `magFilter`: The magnification filter for the FBO texture.
    - `minFilter`: The minification filter for the FBO texture.
    - `format`: The internal format of the color buffer.
    - `type`: The data type of the color buffer.
    - `anisotropy`: The level of anisotropic filtering for the FBO texture.
    - `depthBuffer`: Whether to include a depth buffer. (Default: true)
    - `stencilBuffer`: Whether to include a stencil buffer. (Default: false)
    - `generateMipmaps`: Whether to generate mipmaps for the FBO texture. (Default: true)
    - `depthTexture`: A DepthTexture instance to use for the depth buffer.
    - `colorSpace`: The color space of the FBO texture.

```ts
// Basic usage - sized to canvas
const renderTarget = fbo();

// Custom size with multisampling
const target = fbo(() => ({
	width: 512,
	height: 512,
	settings: { samples: 4 },
}));

// Render to FBO
beforeRender(({ gl, scene, camera }) => {
	gl.setRenderTarget(target);
	gl.render(scene, camera);
	gl.setRenderTarget(null);
});
```

> **Note**: `injectFBO` is deprecated. Use `fbo` instead.

### NgtsFBO

A structural directive that allows you to render a part of your scene into an FBO using an `ng-template`. It provides the created `WebGLRenderTarget` as implicit context to the template. The input accepts FBO configuration including `width`, `height`, and `THREE.RenderTargetOptions`.

```html
<ng-template [fbo]="{ width: 512, height: 512 }" let-target>
	<!-- target is the WebGLRenderTarget -->
	<ngt-mesh>
		<ngt-plane-geometry />
		<ngt-mesh-basic-material [map]="target.texture" />
	</ngt-mesh>
</ng-template>
```

## NgtsBakeShadows

A directive that bakes shadows in your scene. It sets `gl.shadowMap.autoUpdate` to false and requests a single `gl.shadowMap.needsUpdate = true`. This can improve performance by making shadows static.

```html
<ngts-bake-shadows />
```

## NgtsSoftShadows

A directive that injects Percentage-Closer Soft Shadows (PCSS) into the scene. PCSS produces contact-hardening soft shadows where shadows are sharper near the contact point and softer further away, creating more realistic shadow effects.

This works by patching Three.js's shadow shader chunk at runtime. When the directive is destroyed or options change, it restores the original shader and recompiles affected materials.

```html
<ngts-soft-shadows [options]="{ size: 25, samples: 10, focus: 0 }" />
```

### Options (NgtsSoftShadowsOptions)

| Property  | Description                                                                                  | Default |
| --------- | -------------------------------------------------------------------------------------------- | ------- |
| `size`    | Size of the light source. The larger the value, the softer the shadows.                      | `25`    |
| `samples` | Number of samples for shadow calculation. More samples = less noise but more expensive.      | `10`    |
| `focus`   | Depth focus to shift the focal point where the shadow is sharpest. 0 means at the beginning. | `0`     |

## `depthBuffer`

```ts
function depthBuffer(
	params: () => { size?: number; frames?: number } = () => ({}),
	{ injector }: { injector?: Injector } = {},
): THREE.DepthTexture;
```

Creates a depth buffer texture that captures scene depth information. Renders the scene to an off-screen FBO with a depth texture attachment, which can be used for effects like soft particles, SSAO, or custom shaders. Returns the buffer's `depthTexture`.

Since this is a rather expensive effect you can limit the amount of frames it renders when your objects are static. For instance making it render only once by setting `frames: 1`.

```ts
export class MyCmp {
	depth = depthBuffer(() => ({
		size: 256, // The size of the depth buffer (default: 256)
		frames: Infinity, // The amount of frames to render (default: Infinity)
	}));

	// Use in a shader
	constructor() {
		effect(() => {
			material.uniforms['depthTexture'].value = this.depth;
		});
	}
}
```

> **Note**: `injectDepthBuffer` is deprecated. Use `depthBuffer` instead.

## NgtsSampler

A component that distributes instances across a mesh surface using `MeshSurfaceSampler`. It samples points from a mesh and automatically updates an `InstancedMesh` with the sampled transforms. Both the source mesh and target instances can be provided as inputs or as children.

### Inputs

| Property    | Description                                                                                               | Default value |
| ----------- | --------------------------------------------------------------------------------------------------------- | ------------- |
| `mesh`      | The mesh to sample points from. If not provided, uses the first Mesh child.                               | `null`        |
| `instances` | The InstancedMesh to update with sampled transforms. If not provided, uses the first InstancedMesh child. | `null`        |
| `options`   | Sampler configuration object (see below).                                                                 | See below     |

### Options (NgtsSamplerOptions)

| Property    | Description                                                                                                                                              | Default value |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| `weight`    | Name of a vertex attribute to use for weighted sampling. Higher values = more likely to be sampled.                                                      | `undefined`   |
| `transform` | Custom transform function applied to each sampled instance. Receives sample data and should mutate `payload.dummy` to set position, rotation, and scale. | `undefined`   |
| `count`     | Number of samples to distribute across the mesh surface.                                                                                                 | `16`          |

#### Passing `InstancedMesh` and `Mesh` as content children

```html
<ngts-sampler [options]="{ weight: 'normal', transform: transformPoint, count: 500 }">
	<ngt-mesh>
		<ngt-sphere-geometry *args="[2]" />
	</ngt-mesh>

	<ngt-instanced-mesh *args="[undefined, undefined, 500]">
		<ngt-sphere-geometry *args="[0.1]" />
	</ngt-instanced-mesh>
</ngts-sampler>
```

or use references when you can't compose declaratively:

```ts
@Component({
	template: `
		<ngts-sampler [instances]="instancedRef()" [mesh]="mesh()" [options]="{ count: 500 }" />

		<ngt-instanced-mesh #instanced *args="[undefined, undefined, 500]">
			<!-- content -->
		</ngt-instanced-mesh>
	`,
})
class MyCmp {
	instancedRef = viewChild<ElementRef<InstancedMesh>>('instanced');

	gltf = gltfResource(() => 'my/mesh/url');
	mesh = computed(() => this.gltf.value()?.scene || null);
}
```

## `surfaceSampler`

```ts
function surfaceSampler(
	mesh: () => ElementRef<THREE.Mesh> | THREE.Mesh | null | undefined,
	options?: {
		count?: () => number;
		transform?: () => TransformFn | undefined;
		weight?: () => string | undefined;
		instancedMesh?: () => ElementRef<THREE.InstancedMesh> | THREE.InstancedMesh | null | undefined;
	},
): Signal<THREE.InstancedBufferAttribute>;
```

Creates a computed signal that samples points on a mesh surface. Uses `THREE.MeshSurfaceSampler` to distribute points across the mesh geometry. Returns an `InstancedBufferAttribute` containing transform matrices for each sample, suitable for use with `InstancedMesh` or custom instancing solutions.

```ts
const meshRef = viewChild<ElementRef<THREE.Mesh>>('mesh');
const instancesRef = viewChild<ElementRef<THREE.InstancedMesh>>('instances');

const samples = surfaceSampler(() => meshRef()?.nativeElement, {
	count: () => 1000,
	instancedMesh: () => instancesRef()?.nativeElement,
	transform:
		() =>
		({ dummy, position, normal }) => {
			dummy.position.copy(position);
			dummy.lookAt(position.clone().add(normal));
			dummy.scale.setScalar(Math.random() * 0.5 + 0.5);
		},
});
```

## NgtsComputedAttribute

A component that allows you to compute and attach an attribute to a geometry declaratively.

It accepts the following inputs:

- `compute`: A function that computes the attribute. It receives the geometry as an argument and should return a `BufferAttribute`.
- `name`: The name of the attribute to attach to the geometry.
- `options`: pass-through options for `BufferAttribute`

```html
<ngt-sphere-geometry>
	<ngts-computed-attribute
		name="my-attribute-name"
		[compute]="computeAttributeFn"
		[options]="{ usage: StaticReadUsage }"
	/>
</ngt-sphere-geometry>
```

## NgtsDecal

Abstraction around Three's `DecalGeometry`. It will use the its parent `mesh` as the decal surface by default.

The decal box has to intersect the surface, otherwise it will not be visible. if you do not specify a rotation it will look at the parents center point. You can also pass a single number as the rotation which allows you to spin it.

### Object Inputs (NgtsDecalOptions)

| Property              | Description                                           | Default value |
| --------------------- | ----------------------------------------------------- | ------------- |
| `map`                 | The texture to use for the decal.                     | `undefined`   |
| `debug`               | Makes the "bounding box" of the decal visible.        | `false`       |
| `depthTest`           | Whether to enable depth testing.                      | `false`       |
| `polygonOffsetFactor` | The factor by which the polygon offset is multiplied. | `-10`         |

It also accepts a `mesh` input that allows you to specify the surface the decal must attach to.

```html
<mesh>
	<sphereGeometry />
	<meshBasicMaterial />
	<ngts-decal [options]="{ position: [0, 0, 0], rotation: [0, 0, 0], scale: 1, debug: true }">
		<ngt-mesh-basic-material [map]="texture()" [polygonOffset]="true" [polygonOffsetFactor]="-1" />
	</ngts-decal>
</mesh>
```

If you do not specify a material it will create a transparent `ngt-mesh-basic-material` with a `polygonOffsetFactor` of -10.

```html
<ngt-mesh>
	<ngt-mesh-sphere-geometry />
	<ngt-mesh-basic-material />
	<ngts-decal [options]="{ map: texture() }" />
</ngt-mesh>
```

If declarative composition is not possible, use the `mesh` input to define the surface the decal must attach to.

```html
<ngts-decal [mesh]="meshRef()">
	<ngt-mesh-basic-material [map]="texture()" [polygonOffset]="true" [polygonOffsetFactor]="-1" />
</ngts-decal>
```

## NgtsHTML

A component for rendering HTML content positioned in 3D space. It creates a THREE.Group anchor point in the scene and projects HTML onto the canvas using CSS positioning or CSS 3D transforms.

### Usage

Import `NgtsHTML` which includes both `NgtsHTMLImpl` (the 3D anchor) and `NgtsHTMLContent` (the HTML container).

```ts
import { NgtsHTML } from 'angular-three-soba/misc';

@Component({
	imports: [NgtsHTML],
	template: `
		<ngt-mesh [position]="[0, 2, 0]">
			<ngts-html [options]="{ transform: true }">
				<div [htmlContent]="{ distanceFactor: 10 }">Label</div>
			</ngts-html>
		</ngt-mesh>
	`,
})
class MyCmp {}
```

### NgtsHTMLOptions (for `ngts-html`)

| Property        | Description                                                                                | Default |
| --------------- | ------------------------------------------------------------------------------------------ | ------- |
| `occlude`       | Controls occlusion: `false`, `true`, `'raycast'`, `'blending'`, or array of Object3D refs. | `false` |
| `transform`     | When `true`, uses CSS 3D transforms. When `false`, projects to 2D screen coordinates.      | `false` |
| `castShadow`    | Forward shadow casting to occlusion mesh (blending mode only).                             | `false` |
| `receiveShadow` | Forward shadow receiving to occlusion mesh (blending mode only).                           | `false` |

### NgtsHTMLContentOptions (for `div[htmlContent]`)

| Property            | Description                                                 | Default                    |
| ------------------- | ----------------------------------------------------------- | -------------------------- |
| `eps`               | Epsilon for position/zoom change detection.                 | `0.001`                    |
| `zIndexRange`       | Range for automatic z-index calculation `[max, min]`.       | `[16777271, 0]`            |
| `center`            | Centers the HTML element on the projected point.            | `false`                    |
| `prepend`           | Prepends to parent instead of appending.                    | `false`                    |
| `fullscreen`        | Makes the container fill the entire canvas size.            | `false`                    |
| `containerClass`    | CSS class applied to the inner container div.               | `''`                       |
| `containerStyle`    | Inline styles applied to the inner container div.           | `{}`                       |
| `pointerEvents`     | CSS `pointer-events` value.                                 | `'auto'`                   |
| `calculatePosition` | Custom function to calculate screen position.               | `defaultCalculatePosition` |
| `sprite`            | When `true` (with transform), HTML always faces the camera. | `false`                    |
| `distanceFactor`    | Scales HTML based on distance from camera.                  | `undefined`                |
| `parent`            | Custom parent element for the HTML content.                 | `undefined`                |

### Outputs

| Output     | Description                                                              |
| ---------- | ------------------------------------------------------------------------ |
| `occluded` | Emits when occlusion state changes (`true` = hidden, `false` = visible). |

```html
<ngts-html [options]="{ occlude: true }">
	<div [htmlContent]="{}" (occluded)="isHidden = $event" [class.faded]="isHidden">
		Content with custom occlusion handling
	</div>
</ngts-html>
```

## `intersect`

```ts
function intersect<TObject extends THREE.Object3D>(
	object: () => ElementRef<TObject> | TObject | undefined | null,
	options?: { injector?: Injector; source?: WritableSignal<boolean> },
): Signal<boolean>;
```

Tracks whether an object is within the camera's view frustum. Uses THREE.js's built-in frustum culling by monitoring `onBeforeRender` calls. Returns a read-only signal that emits `true` when the object is visible.

```ts
const meshRef = viewChild<ElementRef<THREE.Mesh>>('mesh');
const isVisible = intersect(() => meshRef());

effect(() => {
	if (isVisible()) {
		// Object is in view - start expensive animations
	}
});
```

> **Note**: `injectIntersect` is deprecated. Use `intersect` instead.

## NgtsIntersect

A directive that tracks whether the host Object3D is in the camera frustum. Apply to any THREE.js element to get a two-way bound signal indicating visibility.

```html
<ngt-mesh [(intersect)]="isInView">
	<ngt-box-geometry />
	<ngt-mesh-basic-material />
</ngt-mesh>
```

```ts
isInView = signal(false);

effect(() => {
	console.log('Mesh visible:', this.isInView());
});
```

## NgtsPreload

A directive that pre-compiles shaders and textures to reduce runtime jank. When added to a scene, it triggers `WebGLRenderer.compile()` and uses a CubeCamera to ensure environment maps are also compiled.

```html
<!-- Preload entire scene -->
<ngts-preload [all]="true" />

<!-- Preload specific scene/camera -->
<ngts-preload [scene]="customScene" [camera]="customCamera" />
```

### Inputs

| Input    | Description                                                              |
| -------- | ------------------------------------------------------------------------ |
| `all`    | When `true`, temporarily makes invisible objects visible during compile. |
| `scene`  | Custom scene to preload. Defaults to the store's scene.                  |
| `camera` | Custom camera for compilation. Defaults to the store's camera.           |

## `calculateScaleFactor`

```ts
function calculateScaleFactor(point3: THREE.Vector3, radiusPx: number, camera: THREE.Camera, size: NgtSize): number;
```

Calculates a scale factor to maintain consistent pixel-size at a 3D position. Given a 3D point and a desired radius in pixels, computes how much to scale an object so it appears that size on screen.

```ts
beforeRender(({ camera, size }) => {
	const scale = calculateScaleFactor(mesh.position, 50, camera, size);
	mesh.scale.setScalar(scale);
});
```

## `getVersion`

```ts
function getVersion(): number;
```

Retrieves the current THREE.js version as a numeric value. Parses the THREE.js `REVISION` constant, stripping any non-numeric characters.

```ts
if (getVersion() >= 150) {
	// Use features available in r150+
}
```

## `setUpdateRange`

```ts
function setUpdateRange(attribute: THREE.BufferAttribute, updateRange: { start: number; count: number }): void;
```

Sets the update range on a BufferAttribute for partial GPU uploads. Handles the API change in THREE.js r159 where `updateRange` was replaced with `updateRanges` array and `addUpdateRange()` method.

```ts
const positions = geometry.attributes['position'];
// Only update first 100 vertices
setUpdateRange(positions, { start: 0, count: 100 * 3 });
positions.needsUpdate = true;
```
