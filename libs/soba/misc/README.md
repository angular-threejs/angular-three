# `angular-three-soba/misc`

This secondary entry point includes miscellaneous utilities and components for animations, shadows, and frame buffer objects (FBOs).

## TOC

- [injectAnimations](#injectanimations)
- [injectFBO](#injectfbo)
- [NgtsFBO](#ngtsfbo)
- [NgtsBakeShadows](#ngtsbakeshadows)
- [injectDepthBuffer](#injectdepthbuffer)
- [NgtsSampler](#ngtssampler)
- [NgtsComputedAttribute](#ngtscomputedattribute)
- [NgtsDecal](#ngtsdecal)

## `injectAnimations`

```ts
function injectAnimations<TAnimation extends AnimationClip>(
	animations: () => NgtsAnimation<TAnimation> | undefined | null,
	object: ElementRef<Object3D> | Object3D | (() => ElementRef<Object3D> | Object3D | undefined | null),
	{ injector }: { injector?: Injector } = {},
): Signal<NgtsAnimationApi<TAnimation> | null>;
```

Provides a way to inject and manage animations in your Angular component. It takes a function animations that returns an array of animation clips or an object containing an array of animation clips, a reference to the object to be animated, and an optional injector. It returns a signal that holds an object containing the animation clips, mixer, names, actions, and a signal indicating if the animations are ready.

This function is commonly used together with `injectGLTF` since GLTF files often contain animation data for 3D models. It provides an abstraction around `AnimationMixer`, which simplifies the process of playing and controlling animations.

The `NgtsAnimationApi` object contains the following properties:

- `clips`: An array of `AnimationClip` objects representing the available animations.
- `mixer`: An instance of `AnimationMixer` used to control the playback of animations.
- `names`: An array of strings representing the names of the available animations.
- `actions`: An object where keys are animation names and values are `AnimationAction` objects, which control the playback of individual animations.
- `ready`: A signal indicating if the animations are ready.

## `injectFBO`

```ts
function injectFBO(params: () => NgtsFBOParams, { injector }: { injector?: Injector } = {}): Signal<WebGLRenderTarget>;
```

Injects a `WebGLRenderTarget` (FBO) into your Angular component. It takes a function params that returns the parameters for the FBO and an optional injector. It returns a signal that holds the `WebGLRenderTarget` object.

The `params` object includes the following properties:

- `width`: The width of the FBO in pixels. Or it can also be the `settings` object.
- `height`: The height of the FBO in pixels.
- `settings`: An object containing the settings for the FBO.
  - `samples`: The number of samples for multisample anti-aliasing (MSAA). Set to 0 to disable MSAA.
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
  - `encoding`: The encoding of the FBO texture.
  - `colorSpace`: The color space of the FBO texture.

### NgtsFBO

A directive that allows you to render a part of your scene into an FBO using an `ng-template`. It takes an input fbo that defines the parameters for the FBO, using the same `NgtsFBOParams` type as `injectFBO`.

```html
<ng-template [fbo]="options()" let-target>
	<ngts-perspective-camera [options]="{ position: [0, 0, 3] }" />

	<ngt-portal [container]="scene()">
		<ngt-mesh *portalContent></ngt-mesh>
	</ngt-portal>

	<ngt-mesh>
		<ngt-box-geometry *args="[3, 3, 3]" />
		<ngt-mesh-standard-material [map]="target().texture" />
	</ngt-mesh>
</ng-template>
```

## NgtsBakeShadows

A directive that bakes shadows in your scene. It sets `gl.shadowMap.autoUpdate` to false and requests a single `gl.shadowMap.needsUpdate = true`. This can improve performance by making shadows static.

```html
<ngts-bake-shadows />
```

## injectDepthBuffer

Renders the scene into a depth-buffer. Often effects depend on it and this allows you to render a single buffer and share it, which minimizes the performance impact. It returns the buffer's `depthTexture`.

Since this is a rather expensive effect you can limit the amount of frames it renders when your objects are static. For instance making it render only once by setting `frames: 1`.

```ts
export class MyCmp {
	depthBuffer = injectDepthBuffer(() => ({
		size: 256, // The size of the depth buffer
		frames: Infinity, // The amount of frames to render
	}));
}
```

## NgtsSampler

A component that samples points from a mesh and transforms an `InstancedMesh`'s matrix to distribute instances on the points. It takes a `Mesh` and an `InstancedMesh` as children.

### Object Inputs (NgtsSamplerOptions)

| Property    | Description                                                                                                                                                   | Default value |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| `weight`    | The name of the attribute to use as the sampling weight.                                                                                                      | `undefined`   |
| `transform` | A function that transforms each instance given a sample. It receives a dummy `Object3D` with all the sampled data and should mutate `transformPayload.dummy`. | `undefined`   |
| `count`     | The number of samples to take.                                                                                                                                | `16`          |

#### Passing `InstancedMesh` and `Mesh` as content children

```html
<ngts-sampler [options]="{ weight: 'normal', transform: transformPoint, count: 16 }">
	<ngt-mesh>
		<ngt-sphere-geometry *args="[2]" />
	</ngt-mesh>

	<ngt-instanced-mesh *args="[undefined, undefined, 1_000]">
		<ngt-sphere-geometry *args="[0.1]" />
	</ngt-instanced-mesh>
</ngts-sampler>
```

or use references when you can't compose declaratively:

```ts
@Component({
	template: `
		<ngts-sampler [instances]="instancedRef()" [mesh]="mesh()" />

		<ngt-instanced-mesh #instanced *args="[undefined, undefined, 1_000]">
			<!-- content -->
		</ngt-instanced-mesh>
	`,
})
class MyCmp {
	instancedRef = viewChild<ElementRef<InstancedMesh>>('instanced');

	gltf = injectGLTF(() => 'my/mesh/url');
	mesh = computed(() => this.gltf()?.scene || null);
}
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
