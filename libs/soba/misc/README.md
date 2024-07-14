# `angular-three-soba/misc`

This secondary entry point includes miscellaneous utilities and components for animations, shadows, and frame buffer objects (FBOs).

## TOC

- [injectAnimations](#injectanimations)
- [injectFBO](#injectfbo)
- [NgtsFBO](#ngtsfbo)
- [NgtsBakeShadows](#ngtsbakeshadows)

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
