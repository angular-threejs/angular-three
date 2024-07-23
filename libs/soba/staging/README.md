# `angular-three-soba/staging`

This secondary entry point includes miscellaneous utilities and components for animations, shadows, frame buffer objects (FBOs), and more. It requires `@pmndrs/vanilla`, `three-mesh-bvh`, and `@monogrid/gainmap-js` as additional dependencies.

```bash
npm install @pmndrs/vanilla three-mesh-bvh @monogrid/gainmap-js
# yarn add @pmndrs/vanilla three-mesh-bvh @monogrid/gainmap-js
# pnpm add @pmndrs/vanilla three-mesh-bvh @monogrid/gainmap-js
```

## TOC

- [NgtsAccumulativeShadows](#ngtsaccumulativeshadows)
- [NgtsRandomizedLights](#ngtsrandomizedlights)
- [NgtsBBAnchor](#ngtsbbanchor)
- [NgtsCameraShake](#ngtscamerashake)
- [NgtsCenter](#ngtscenter)
- [NgtsContactShadows](#ngtscontactshadows)
- [NgtsEnvironment](#ngtsenvironment)
- [NgtsLightformer](#ngtslightformer)
- [NgtsFloat](#ngtsfloat)
- [MatcapTexture](#matcaptexture)
- [NormalTexture](#normaltexture)
- [NgtsRenderTexture](#ngtsrendertexture)
- [NgtsBounds](#ngtsbounds)
- [NgtsStage](#ngtsstage)
- [NgtsCaustics](#ngtscaustics)
- [NgtsSky](#ngtssky)
- [NgtsSpotLight](#ngtsspotlight)
- [NgtsSpotLightShadow](#ngtsspotlightshadow)
- [NgtsBackdrop](#ngtsbackdrop)

## NgtsAccumulativeShadows

A planar, Y-up oriented shadow-catcher that can accumulate into soft shadows and has zero performance impact after all frames have accumulated. It can be temporal, it will accumulate over time, or instantaneous, which might be expensive depending on how many frames you render.

You must pair it with lightsources (and scene objects!) that cast shadows, which go into the children slot. Best use it with the `NgtsRandomizedLights` component, which jiggles a set of lights around, creating realistic raycast-like shadows and ambient occlusion.

### Object Inputs (NgtsAccumulativeShadowsOptions)

| Property     | Description                                                                                                                                  | Default Value |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| `frames`     | How many frames it can render, more yields cleaner results but takes more time.                                                              | 40            |
| `blend`      | If frames is set to Infinity, blend controls the refresh ratio.                                                                              | 20            |
| `limit`      | Can limit the amount of frames rendered if frames is set to Infinity, usually to get some performance back once a movable scene has settled. | Infinity      |
| `scale`      | Scale of the plane.                                                                                                                          | 10            |
| `temporal`   | Temporal accumulates shadows over time which is more performant but has a visual regression over instant results.                            | false         |
| `opacity`    | Opacity of the plane.                                                                                                                        | 1             |
| `alphaTest`  | Discards alpha pixels.                                                                                                                       | 0.75          |
| `color`      | Shadow color.                                                                                                                                | 'black'       |
| `colorBlend` | Color blend, how much colors turn to black. 0 is black.                                                                                      | 2             |
| `resolution` | Buffer resolution.                                                                                                                           | 1024          |
| `toneMapped` | Texture tone mapping.                                                                                                                        | true          |

```html
<ngt-color *args="['goldenrod']" attach="background" />
<accumulative-shadows-suzi />

<ngts-accumulative-shadows [options]="accumulativeShadowsOptions()">
	<ngts-randomized-lights [options]="{ amount: 8, radius: 4, ambient: 0.5, bias: 0.001, position: [5, 5, -10] }" />
</ngts-accumulative-shadows>

<ngts-orbit-controls [options]="{ autoRotate: true }" />
<ngts-environment [options]="{ preset: 'city' }" />
```

## NgtsRandomizedLights

A randomized light that internally runs multiple lights and jiggles them. See below, you would normally pair it with AccumulativeShadows. This component is context aware, paired with `NgtsAccumulativeShadows` it will take the number of frames from its parent.

### Object Inputs (NgtsRandomizedLightsOptions)

| Property    | Description                                                     | Default Value |
| ----------- | --------------------------------------------------------------- | ------------- |
| `amount`    | The number of lights to create.                                 | 1             |
| `radius`    | The radius within which the lights will be randomly positioned. | 1             |
| `ambient`   | The ambient light intensity.                                    | 0.5           |
| `position`  | The base position of the lights.                                | [0, 0, 0]     |
| `intensity` | The intensity of the lights.                                    | 1             |
| `bias`      | The shadow bias for the lights.                                 | 0.001         |
| `mapSize`   | The size of the shadow map for the lights.                      | 1024          |

```html
<ngts-randomized-lights [options]="{ amount: 8, radius: 4, ambient: 0.5, bias: 0.001, position: [5, 5, -10] }" />
```

## NgtsBBAnchor

A component using AABB (Axis-aligned bounding boxes) to offset children position by specified multipliers (anchor property) on each axis. You can use this component to change children positioning in regard of the parent's bounding box, eg. pinning Html component to one of the parent's corners. Multipliers determine the offset value based on the AABB's size:

```
childrenAnchor = boundingBoxPosition + (boundingBoxSize \* anchor / 2)
```

### Object Inputs (NgtsBBAnchorOptions)

| Property | Description                                               | Default Value |
| -------- | --------------------------------------------------------- | ------------- |
| `anchor` | The anchor point, a vector3 or an array of three numbers. | [0, 0, 0]     |

```html
<ngts-bb-anchor [options]="{ anchor: [0, 1, 0] }">
	<ngt-mesh></ngt-mesh>
</ngts-bb-anchor>
```

## NgtsCameraShake

A component for applying a configurable camera shake effect. Currently only supports rotational camera shake.

If you use shake in combination with controls make sure to set the `makeDefault` option on your controls, in that case you do not have to pass them via the `controls` option.

### Object Inputs (NgtsCameraShakeOptions)

| Property         | Description                                                           | Default Value |
| ---------------- | --------------------------------------------------------------------- | ------------- |
| `intensity`      | Initial intensity of the shake.                                       | 1             |
| `decay`          | Should the intensity decay over time?                                 | false         |
| `decayRate`      | If decay is true, this is the rate at which intensity will reduce at. | 0.65          |
| `maxYaw`         | Max amount camera can yaw in either direction.                        | 0.1           |
| `maxPitch`       | Max amount camera can pitch in either direction.                      | 0.1           |
| `maxRoll`        | Max amount camera can roll in either direction.                       | 0.1           |
| `yawFrequency`   | Frequency of the the yaw rotation.                                    | 0.1           |
| `pitchFrequency` | Frequency of the pitch rotation.                                      | 0.1           |
| `rollFrequency`  | Frequency of the roll rotation.                                       | 0.1           |

```html
<ngts-camera-shake [options]="{ intensity: 1, decay: false, decayRate: 0.65, maxYaw: 0.1, maxPitch: 0.1 }" />
<ngts-orbit-controls [options]="{ makeDefault: true }" />
```

## NgtsCenter

Calculates a boundary box and centers its children accordingly.

### Object Inputs (NgtsCenterOptions)

| Property   | Description                                                              | Default Value |
| ---------- | ------------------------------------------------------------------------ | ------------- |
| `top`      | Aligns children to the top of the bounding box.                          | false         |
| `right`    | Aligns children to the right of the bounding box.                        | false         |
| `bottom`   | Aligns children to the bottom of the bounding box.                       | false         |
| `left`     | Aligns children to the left of the bounding box.                         | false         |
| `front`    | Aligns children to the front of the bounding box.                        | false         |
| `back`     | Aligns children to the back of the bounding box.                         | false         |
| `disable`  | Disables all axes centering.                                             | false         |
| `disableX` | Disables centering on the X axis.                                        | false         |
| `disableY` | Disables centering on the Y axis.                                        | false         |
| `disableZ` | Disables centering on the Z axis.                                        | false         |
| `precise`  | Precision of the bounding box calculation. See THREE.Box3.setFromObject. | true          |

```html
<ngts-center [options]="{ top: true, right: true }">
	<ngt-mesh></ngt-mesh>
</ngts-center>
```

## NgtsContactShadows

A contact shadow implementation, facing upwards (positive Y) by default. scale can be a positive number or a 2D array `[x: number, y: number]`.

### Object Inputs (NgtsContactShadowsOptions)

| Property     | Description                                                                     | Default Value |
| ------------ | ------------------------------------------------------------------------------- | ------------- |
| `opacity`    | Opacity of the shadows.                                                         | 1             |
| `width`      | Width of the shadow plane.                                                      | 1             |
| `height`     | Height of the shadow plane.                                                     | 1             |
| `blur`       | Blur radius of the shadows.                                                     | 1             |
| `far`        | Far distance of the shadow camera.                                              | 10            |
| `resolution` | Resolution of the shadow map.                                                   | 512           |
| `smooth`     | Whether to apply smoothing to the shadows.                                      | true          |
| `color`      | Color of the shadows.                                                           | '#000000'     |
| `depthWrite` | Whether the shadows should write to the depth buffer.                           | false         |
| `frames`     | How many frames it can render, more yields cleaner results but takes more time. | 40            |

```html
<ngts-contact-shadows
	[options]="{ opacity: 1, width: 1, height: 1, blur: 1, far: 10, resolution: 512, smooth: true, color: '#000000', depthWrite: false }"
/>
```

Since this is a rather expensive effect you can limit the amount of frames it renders when your objects are static. For instance making it render only once:

```html
<ngts-contact-shadows
	[options]="{ opacity: 1, width: 1, height: 1, blur: 1, far: 10, resolution: 512, smooth: true, color: '#000000', depthWrite: false, frames: 1 }"
/>
```

## NgtsEnvironment

Sets up a global cubemap, which affects the default `scene.environment`, and optionally `scene.background`, unless a custom scene has been passed. A selection of presets from [HDRI Haven](https://hdrihaven.com/) are available for convenience.

### Object Inputs (NgtsEnvironmentOptions)

| Property     | Description                                                                | Default Value |
| ------------ | -------------------------------------------------------------------------- | ------------- |
| `background` | Whether to use the environment map as the background.                      | true          |
| `files`      | Array of cubemap files OR single equirectangular file.                     |               |
| `path`       | Path to the cubemap files OR single equirectangular file.                  |               |
| `preset`     | One of the available presets: sunset, dawn, night, warehouse, forest, etc. |               |
| `scene`      | Custom scene to apply the environment map to.                              |               |

The simplest way to use it is to provide a preset (linking towards common HDRI Haven assets hosted on github). 👉 Note: `preset` property is not meant to be used in production environments and may fail as it relies on CDNs.

Current presets are

- apartment: 'lebombo_1k.hdr'
- city: 'potsdamer_platz_1k.hdr'
- dawn: 'kiara_1_dawn_1k.hdr'
- forest: 'forest_slope_1k.hdr'
- lobby: 'st_fagans_interior_1k.hdr'
- night: 'dikhololo_night_1k.hdr'
- park: 'rooitou_park_1k.hdr'
- studio: 'studio_small_03_1k.hdr'
- sunset: 'venice_sunset_1k.hdr'
- warehouse: 'empty_warehouse_01_1k.hdr'

```html
<ngts-environment [options]="{ preset: 'city' }" />
```

If you provide children you can even render a custom environment. It will render the contents into an off-buffer and film a single frame with a cube camera (whose options you can configure: near=1, far=1000, resolution=256).

```html
<ngts-environment [options]="{ background: true }">
	<ng-template>
		<ngt-mesh>
			<ngt-sphere-geometry />
			<ngt-mesh-basic-material [side]="BackSide" />
		</ngt-mesh>
	</ng-template>
</ngts-environment>
```

Environment can also be ground projected, that is, put your model on the "ground" within the environment map.

```html
<ngts-environment [options]="{ ground: true }" />
```

You can provide optional options to configure this projection.

```html
<ngts-environment [options]="{ ground: { height: 15, radius: 60, scale: 1000 } }" />
```

## NgtsLightformer

This component draws flat rectangles, circles or rings, mimicking the look of a light-former. You can set the output intensity, which will effect emissiveness once you put it into an HDRI `NgtsEnvironment`, where it mostly belongs. It will act like a real light without the expense, you can have as many as you want.

### Object Inputs (NgtsLightformerOptions)

| Property     | Description                                                          | Default Value |
| ------------ | -------------------------------------------------------------------- | ------------- |
| `toneMapped` | Whether the material is tone mapped.                                 | false         |
| `color`      | The color of the lightformer.                                        | 'white'       |
| `form`       | The shape of the lightformer. Can be 'circle', 'ring', or 'rect'.    | 'rect'        |
| `scale`      | The scale of the lightformer. Can be a number or an array [x, y, z]. | 1             |
| `intensity`  | The intensity of the light emitted by the lightformer.               | 1             |
| `target`     | The target position for the lightformer to look at.                  |               |

```html
<ngts-environment>
	<ng-template>
		<ngts-lightformer [options]="{ toneMapped: false, color: 'white', form: 'rect', scale: 1, intensity: 1 }" />
	</ng-template>
</ngts-environment>
```

## NgtsFloat

A component that simulates floating objects by applying a configurable up and down motion.

### Object Inputs (NgtsFloatOptions)

| Property            | Description                                                                | Default Value |
| ------------------- | -------------------------------------------------------------------------- | ------------- |
| `speed`             | The speed of the floating animation.                                       | 1             |
| `rotationIntensity` | The intensity of the rotation during the floating animation.               | 1             |
| `floatIntensity`    | The intensity of the vertical movement during the floating animation.      | 1             |
| `autoInvalidate`    | Automatically invalidates the scene when the frameloop is set to `demand`. | false         |

```html
<ngts-float [options]="{ speed: 1, rotationIntensity: 1, floatIntensity: 1 }">
	<ngt-mesh>
		<ngt-sphere-geometry />
		<ngt-mesh-standard-material [color]="'#ff0000'" />
	</ngt-mesh>
</ngts-float>
```

## MatcapTexture

### `injectMatcapTexture`

This function injects a matcap texture (or textures) into your scene. It takes a function matcap that returns the URL of the matcap texture file (or an array of URLs) and returns a signal that holds the loading result.

> Matcap repository: https://github.com/emmelleppi/matcaps

> Note: `injectMatcapTexture` is not meant to be used in production environments as it relies on third-party CDN.

```ts
function injectMatcapTexture(
	matcap: () => string | string[],
	{
		onLoad,
		injector,
	}: {
		onLoad?: (matcapTextures: Texture[]) => void;
		injector?: Injector;
	} = {},
): Signal<NgtLoaderResults<string, Texture> | null>;
```

### `NgtsMatcapTexture`

A structural directive that provides a matcap texture to be used with other materials.

```html
<ngt-mesh [geometry]="gltf.nodes.Suzanne.geometry">
	<ngt-mesh-matcap-material *matcapTexture="options(); let texture" [matcap]="texture()" />
</ngt-mesh>
```

## NormalTexture

### `injectNormalTexture`

This function injects a normal texture (or textures) into your scene. It takes a function normal that returns the URL of the normal texture file (or an array of URLs) and returns a signal that holds the loading result.

> Normal repository: https://github.com/emmelleppi/normal-maps

> Note: `injectNormalTexture` is not meant to be used in production environments as it relies on third-party CDN.

```ts
function injectNormalTexture(
	normal: () => string | string[],
	{
		onLoad,
		injector,
	}: {
		onLoad?: (normalTextures: Texture[]) => void;
		injector?: Injector;
	} = {},
): Signal<NgtLoaderResults<string, Texture> | null>;
```

### `NgtsNormalTexture`

A structural directive that provides a normal texture to be used with other materials.

```html
<ngt-mesh [geometry]="gltf.nodes.Suzanne.geometry">
	<ngt-mesh-normal-material *normalTexture="options(); let texture" [normal]="texture()" />
</ngt-mesh>
```

## NgtsRenderTexture

This component allows you to render a live scene into a texture which you can then apply to a material. The contents of it run inside a portal and are separate from the rest of the canvas, therefore you can have events in there, environment maps, etc.

### Object Inputs (NgtsRenderTextureOptions)

| Property          | Description                              | Default Value |
| ----------------- | ---------------------------------------- | ------------- |
| `resolution`      | Resolution of the render texture.        | 1024          |
| `scene`           | Custom scene to render into the texture. |               |
| `camera`          | Custom camera to render the scene with.  |               |
| `width`           | Width of the texture.                    |               |
| `height`          | Height of the texture.                   |               |
| `samples`         | The number of samples for the texture.   | 4             |
| `stencilBuffer`   | Whether to use a stencil buffer.         | false         |
| `depthBuffer`     | Whether to use a depth buffer.           | true          |
| `generateMipmaps` | Whether to generate mipmaps.             | false         |
| `renderPriority`  | The render priority of the texture.      | 0             |
| `eventPriority`   | The event priority of the texture.       | 0             |
| `frames`          | The number of frames to render.          | Infinity      |
| `compute`         | A function to compute the event.         |               |

Required `NgtsRenderTextureContent`

```html
<ngt-mesh>
	<ngt-mesh-basic-material>
		<ngts-render-texture>
			<app-render-texture *renderTextureContent />
			<!-- this can be any portal content: a off-buffer scene with its own lights, cameras etc... -->
		</ngts-render-texture>
	</ngt-mesh-basic-material>
</ngt-mesh>
```

## NgtsBounds

Calculates a boundary box and centers the camera accordingly. If you are using camera controls, make sure to pass them the `makeDefault` option. `fit` fits the current view on first render. `clip` sets the cameras near/far planes. `observe` will trigger on window resize. To control the damping animation, use `maxDuration` to set the animation length in seconds, and `interpolateFunc` to define how the animation changes over time (should be an increasing function in [0, 1] interval, `interpolateFunc(0) === 0`, `interpolateFunc(1) === 1`).

### Object Inputs (NgtsBoundsOptions)

| Property      | Description                            | Default Value |
| ------------- | -------------------------------------- | ------------- |
| `fit`         | Fits the current view on first render. | false         |
| `clip`        | Sets the cameras near/far planes.      | false         |
| `observe`     | Triggers on window resize.             | false         |
| `maxDuration` | The animation length in seconds.       | 1             |

## NgtsSpotLightShadow

A shadow caster that can help cast shadows of different patterns (textures) onto the scene.

### Object Inputs (NgtsSpotLightShadowOptions)

| Property    | Description                                                 | Default Value |
| ----------- | ----------------------------------------------------------- | ------------- |
| `distance`  | Distance between the shadow caster and light.               | 0.4           |
| `alphaTest` | Sets the alpha value to be used when running an alpha test. | 0.5           |
| `scale`     | Scale of the shadow caster plane.                           | 1             |
| `width`     | Width of the shadow map. The higher the more expensive.     | 512           |
| `height`    | Height of the shadow map. The higher the more expensive.    | 512           |
| `map`       | Texture - Pattern of the shadow.                            |               |

```html
<ngts-spot-light>
	<ngts-spot-light-shadow
		[options]="{
      distance: 0.4,
      alphaTest: 0.5,
      scale: 1,
      width: 512,
      height: 512,
    }"
	/>
</ngts-spot-light>
```

An optional `shader` input lets you run a custom shader to modify/add effects to your shadow texture. The shader provides the following uniforms and varyings.

| Type                | Name         | Notes                                  |
| ------------------- | ------------ | -------------------------------------- |
| `varying vec2`      | `vUv`        | UVs of the shadow casting plane        |
| `uniform sampler2D` | `uShadowMap` | The texture provided to the `map` prop |
| `uniform float`     | `uTime`      | Current time                           |

Treat the output of the shader like an alpha map where `1` is opaque and `0` is transparent.

```glsl
gl_FragColor = vec4(vec3(1.), 1.); // Opaque
gl_FragColor = vec4(vec3(0.), 1.); // Transparent
```

```html
<ngts-spot-light>
	<ngts-spot-light-shadow [shader]="customShader" [options]="shadowOptions" />
</ngts-spot-light>
```

## NgtsBackdrop

A curved plane, like a studio backdrop. This is for presentational purposes, to break up light and shadows more interestingly.

### Object Inputs (NgtsBackdropOptions)

| Property        | Description                                  | Default Value |
| --------------- | -------------------------------------------- | ------------- |
| `floor`         | Stretches the floor segment.                 | 0.25          |
| `segments`      | Mesh-resolution.                             | 20            |
| `receiveShadow` | Whether the backdrop should receive shadows. | false         |

```html
<ngts-backdrop [options]="{ floor: 0.25, segments: 20 }">
	<ngt-mesh-standard-material color="#353540" />
</ngts-backdrop>
```
