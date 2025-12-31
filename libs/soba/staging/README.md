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
- [NgtsCloud](#ngtscloud)
- [NgtsContactShadows](#ngtscontactshadows)
- [NgtsEnvironment](#ngtsenvironment)
- [NgtsLightformer](#ngtslightformer)
- [NgtsFloat](#ngtsfloat)
- [MatcapTexture](#matcaptexture)
- [NgtsMask](#ngtsmask)
- [NormalTexture](#normaltexture)
- [NgtsRenderTexture](#ngtsrendertexture)
- [NgtsBounds](#ngtsbounds)
- [NgtsShadow](#ngtsshadow)
- [NgtsSparkles](#ngtssparkles)
- [NgtsSky](#ngtssky)
- [NgtsStage](#ngtsstage)
- [NgtsCaustics](#ngtscaustics)
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

| Property     | Description                                                     | Default Value           |
| ------------ | --------------------------------------------------------------- | ----------------------- |
| `frames`     | How many frames it will jiggle the lights.                      | 1                       |
| `amount`     | The number of lights to create.                                 | 8                       |
| `radius`     | The radius within which the lights will be randomly positioned. | 1                       |
| `ambient`    | The ambient light intensity.                                    | 0.5                     |
| `position`   | The base position of the lights.                                | [0, 0, 0]               |
| `intensity`  | The intensity of the lights.                                    | Math.PI (Three.js 155+) |
| `bias`       | The shadow bias for the lights.                                 | 0.001                   |
| `mapSize`    | The size of the shadow map for the lights.                      | 512                     |
| `size`       | Size of the shadow camera frustum.                              | 5                       |
| `near`       | Shadow camera near plane distance.                              | 0.5                     |
| `far`        | Shadow camera far plane distance.                               | 500                     |
| `castShadow` | Whether the lights cast shadows.                                | true                    |

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

A directive for applying a configurable camera shake effect. Currently only supports rotational camera shake.

If you use shake in combination with controls make sure to set the `makeDefault` option on your controls, in that case you do not have to pass them via the `controls` option.

### Object Inputs (NgtsCameraShakeOptions)

| Property         | Description                                                           | Default Value |
| ---------------- | --------------------------------------------------------------------- | ------------- |
| `intensity`      | Initial intensity of the shake.                                       | 1             |
| `decayRate`      | If decay is true, this is the rate at which intensity will reduce at. | 0.65          |
| `maxYaw`         | Max amount camera can yaw in either direction.                        | 0.1           |
| `maxPitch`       | Max amount camera can pitch in either direction.                      | 0.1           |
| `maxRoll`        | Max amount camera can roll in either direction.                       | 0.1           |
| `yawFrequency`   | Frequency of the the yaw rotation.                                    | 0.1           |
| `pitchFrequency` | Frequency of the pitch rotation.                                      | 0.1           |
| `rollFrequency`  | Frequency of the roll rotation.                                       | 0.1           |

```html
<ngts-camera-shake [options]="{ intensity: 1, decayRate: 0.65, maxYaw: 0.1, maxPitch: 0.1 }" />
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
| `cacheKey` | Optional cache key to prevent recalculation on every render.             | 0             |
| `object`   | Optional object to compute the bounding box from instead of children.    |               |

```html
<ngts-center [options]="{ top: true, right: true }">
	<ngt-mesh></ngt-mesh>
</ngts-center>
```

## NgtsCloud

Renders volumetric clouds using instanced billboarded sprites. The clouds consist of depth-sorted particles that face the camera.

### NgtsClouds Container

The `NgtsClouds` component is a container that manages multiple cloud instances. It uses instanced mesh rendering for performance.

#### Object Inputs (NgtsCloudsOptions)

| Property        | Description                                                       | Default Value             |
| --------------- | ----------------------------------------------------------------- | ------------------------- |
| `texture`       | URL to the cloud texture image.                                   | CLOUD_URL (hosted CDN)    |
| `limit`         | Maximum number of cloud segments. Keep this tight to save memory. | 200                       |
| `range`         | Number of segments to render. If undefined, renders all.          |                           |
| `material`      | The material class to use for cloud rendering.                    | THREE.MeshLambertMaterial |
| `frustumCulled` | Whether to enable frustum culling for the cloud mesh.             | true                      |

### NgtsCloudInstance

Individual cloud formations that must be placed inside a `NgtsClouds` container.

#### Object Inputs (NgtsCloudOptions)

| Property         | Description                                                  | Default Value |
| ---------------- | ------------------------------------------------------------ | ------------- |
| `seed`           | Random seed for consistent cloud generation.                 | Math.random() |
| `segments`       | Number of segments/particles in the cloud.                   | 20            |
| `bounds`         | Bounding box dimensions for cloud distribution.              | [5, 1, 1]     |
| `concentrate`    | How segments are distributed: 'inside', 'outside', 'random'. | 'inside'      |
| `volume`         | Volume/thickness of the segments.                            | 6             |
| `smallestVolume` | Minimum volume when distributing clouds.                     | 0.25          |
| `distribute`     | Custom distribution function for precise control.            |               |
| `growth`         | Growth factor for animated clouds (when speed > 0).          | 4             |
| `speed`          | Animation speed factor. Set to 0 to disable.                 | 0             |
| `fade`           | Camera distance at which segments start fading.              | 10            |
| `opacity`        | Opacity of the cloud.                                        | 1             |
| `color`          | Color of the cloud.                                          | '#ffffff'     |

### NgtsCloud (Convenience Component)

A convenience component that renders a single cloud. Automatically wraps itself in a `NgtsClouds` container if not already inside one.

```html
<!-- Multiple clouds with container -->
<ngts-clouds [options]="{ limit: 400 }">
	<ngts-cloud-instance [options]="{ segments: 40, color: '#f0f0f0', speed: 0.4 }" />
	<ngts-cloud-instance [options]="{ segments: 20, position: [5, 0, 0] }" />
</ngts-clouds>

<!-- Single cloud (auto-wrapped) -->
<ngts-cloud [options]="{ segments: 20, bounds: [5, 1, 1], color: 'white' }" />
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
| `near`       | Near clipping plane for the shadow camera.                                      | 0             |
| `far`        | Far distance of the shadow camera.                                              | 10            |
| `resolution` | Resolution of the shadow map.                                                   | 512           |
| `smooth`     | Whether to apply smoothing to the shadows.                                      | true          |
| `color`      | Color of the shadows.                                                           | '#000000'     |
| `depthWrite` | Whether the shadows should write to the depth buffer.                           | false         |
| `frames`     | How many frames it can render, more yields cleaner results but takes more time. | Infinity      |
| `scale`      | Scale of the shadow plane. Can be a number or [x, y] tuple.                     | 10            |

```html
<ngts-contact-shadows
	[options]="{ opacity: 1, scale: 10, blur: 1, far: 10, resolution: 512, smooth: true, color: '#000000' }"
/>
```

Since this is a rather expensive effect you can limit the amount of frames it renders when your objects are static. For instance making it render only once:

```html
<ngts-contact-shadows [options]="{ frames: 1 }" />
```

## NgtsEnvironment

Sets up a global cubemap, which affects the default `scene.environment`, and optionally `scene.background`, unless a custom scene has been passed. A selection of presets from [HDRI Haven](https://hdrihaven.com/) are available for convenience.

### Object Inputs (NgtsEnvironmentOptions)

| Property               | Description                                                                | Default Value |
| ---------------------- | -------------------------------------------------------------------------- | ------------- |
| `background`           | Whether to use the environment map as the background.                      | false         |
| `files`                | Array of cubemap files OR single equirectangular file.                     |               |
| `path`                 | Path to the cubemap files OR single equirectangular file.                  |               |
| `preset`               | One of the available presets: sunset, dawn, night, warehouse, forest, etc. |               |
| `scene`                | Custom scene to apply the environment map to.                              |               |
| `map`                  | Pre-loaded texture to use as environment map.                              |               |
| `blur`                 | Background blur amount (deprecated, use backgroundBlurriness).             | 0             |
| `backgroundBlurriness` | Background blur amount (0 to 1).                                           | 0             |
| `backgroundIntensity`  | Intensity of the background.                                               | 1             |
| `backgroundRotation`   | Rotation of the background as Euler angles.                                | [0, 0, 0]     |
| `environmentIntensity` | Intensity of the environment lighting.                                     | 1             |
| `environmentRotation`  | Rotation of the environment lighting as Euler angles.                      | [0, 0, 0]     |
| `ground`               | Configuration for ground-projected environment.                            |               |
| `frames`               | Number of frames to render the environment cube camera.                    | 1             |
| `near`                 | Near clipping plane for the cube camera.                                   | 1             |
| `far`                  | Far clipping plane for the cube camera.                                    | 1000          |
| `resolution`           | Resolution of the cube render target.                                      | 256           |

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
| `map`        | Texture map to apply to the lightformer.                             |               |

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
| `enabled`           | Whether the floating animation is enabled.                                 | true          |
| `speed`             | The speed of the floating animation.                                       | 1             |
| `rotationIntensity` | The intensity of the rotation during the floating animation.               | 1             |
| `floatIntensity`    | The intensity of the vertical movement during the floating animation.      | 1             |
| `floatingRange`     | Range of the floating animation [min, max] in world units.                 | [-0.1, 0.1]   |
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

### `matcapTextureResource`

Creates a reactive resource for loading matcap textures. Matcaps provide realistic lighting without actual lights in the scene.

> Matcap repository: https://github.com/emmelleppi/matcaps

> Note: `matcapTextureResource` is not meant to be used in production environments as it relies on third-party CDN.

```ts
function matcapTextureResource(
	id: () => number | string = () => 0,
	{
		format,
		onLoad,
		injector,
	}: {
		format?: () => number; // 64, 128, 256, 512, or 1024 (default: 1024)
		onLoad?: (texture: THREE.Texture) => void;
		injector?: Injector;
	} = {},
): { url: Signal<string>; resource: ResourceRef<THREE.Texture>; numTot: Signal<number> };
```

### `NgtsMatcapTexture`

A structural directive that provides a matcap texture to be used with other materials.

```html
<ng-template [matcapTexture]="{ id: 42, format: 512 }" let-resource>
	@if (resource.hasValue()) {
	<ngt-mesh-matcap-material [matcap]="resource.value()" />
	}
</ng-template>
```

## NgtsMask

Creates a stencil mask for selective rendering. Objects can be shown/hidden using the `mask()` function.

### Object Inputs (NgtsMaskOptions)

| Property     | Description                                 | Default Value |
| ------------ | ------------------------------------------- | ------------- |
| `colorWrite` | Whether to write color to the framebuffer.  | false         |
| `depthWrite` | Whether to write depth to the depth buffer. | false         |

### Inputs

| Property | Description               | Default Value |
| -------- | ------------------------- | ------------- |
| `id`     | The stencil reference ID. | 1             |

### `mask()` Function

Creates stencil material properties for use with NgtsMask. Apply the returned properties to a material to make it respect mask boundaries.

```ts
function mask(
	id: () => number,
	inverse: () => boolean = () => false,
): Signal<{
	stencilWrite: boolean;
	stencilRef: number;
	stencilFunc: THREE.StencilFunc;
	stencilFail: THREE.StencilOp;
	stencilZFail: THREE.StencilOp;
	stencilZPass: THREE.StencilOp;
}>;
```

```html
<ngts-mask [id]="1">
	<ngt-circle-geometry *args="[0.5, 64]" />
</ngts-mask>

<ngt-mesh [material]="maskedMaterial">
	<ngt-box-geometry />
</ngt-mesh>
```

```typescript
// Show content only inside the mask
maskedMaterial = new THREE.MeshStandardMaterial({
	...mask(() => 1)(),
});

// Show content only outside the mask (inverted)
outsideMaterial = new THREE.MeshStandardMaterial({
	...mask(
		() => 1,
		() => true,
	)(),
});
```

## NormalTexture

### `normalTextureResource`

Creates a reactive resource for loading normal textures. Normal textures add surface detail without additional geometry.

> Normal repository: https://github.com/emmelleppi/normal-maps

> Note: `normalTextureResource` is not meant to be used in production environments as it relies on third-party CDN.

```ts
function normalTextureResource(
	id: () => string | number = () => 0,
	{
		settings,
		onLoad,
		injector,
	}: {
		settings?: () => { repeat?: number[]; anisotropy?: number; offset?: number[] };
		onLoad?: (texture: THREE.Texture) => void;
		injector?: Injector;
	},
): { url: Signal<string>; resource: ResourceRef<THREE.Texture>; numTot: Signal<number> };
```

### `NgtsNormalTexture`

A structural directive that provides a normal texture to be used with other materials.

```html
<ng-template [normalTexture]="{ id: 42, repeat: [2, 2] }" let-resource>
	@if (resource.hasValue()) {
	<ngt-mesh-standard-material [normalMap]="resource.value()" />
	}
</ng-template>
```

## NgtsRenderTexture

This component allows you to render a live scene into a texture which you can then apply to a material. The contents of it run inside a portal and are separate from the rest of the canvas, therefore you can have events in there, environment maps, etc.

### Object Inputs (NgtsRenderTextureOptions)

| Property          | Description                            | Default Value   |
| ----------------- | -------------------------------------- | --------------- |
| `width`           | Width of the texture.                  | viewport width  |
| `height`          | Height of the texture.                 | viewport height |
| `samples`         | The number of samples for the texture. | 8               |
| `stencilBuffer`   | Whether to use a stencil buffer.       | false           |
| `depthBuffer`     | Whether to use a depth buffer.         | true            |
| `generateMipmaps` | Whether to generate mipmaps.           | false           |
| `renderPriority`  | The render priority of the texture.    | 0               |
| `eventPriority`   | The event priority of the texture.     | 0               |
| `frames`          | The number of frames to render.        | Infinity        |
| `compute`         | A function to compute the event.       |                 |

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

| Property          | Description                                              | Default Value          |
| ----------------- | -------------------------------------------------------- | ---------------------- |
| `fit`             | Fits the current view on first render.                   | false                  |
| `clip`            | Sets the cameras near/far planes.                        | false                  |
| `observe`         | Triggers on window resize.                               | false                  |
| `maxDuration`     | The animation length in seconds.                         | 1.0                    |
| `margin`          | Margin factor applied to the calculated camera distance. | 1.2                    |
| `interpolateFunc` | Custom interpolation function for camera animation.      | Damping-based function |

```html
<ngts-bounds [options]="{ fit: true, clip: true, observe: true }">
	<ngt-mesh>
		<ngt-box-geometry />
	</ngt-mesh>
</ngts-bounds>
```

## NgtsShadow

Renders a simple circular drop shadow using a canvas-generated radial gradient texture. Creates a flat plane with a transparent gradient that simulates a soft shadow.

### Object Inputs (NgtsShadowOptions)

| Property     | Description                                              | Default Value |
| ------------ | -------------------------------------------------------- | ------------- |
| `colorStop`  | Position of the color stop in the radial gradient (0-1). | 0.0           |
| `fog`        | Whether the shadow is affected by fog.                   | false         |
| `color`      | Color of the shadow.                                     | 'black'       |
| `opacity`    | Opacity of the shadow (0-1).                             | 0.5           |
| `depthWrite` | Whether to write to the depth buffer.                    | false         |

```html
<ngts-shadow [options]="{ color: 'black', opacity: 0.5, scale: [2, 2, 1] }" />
```

## NgtsSparkles

Renders animated sparkle particles floating in 3D space. Creates a magical, sparkling effect using GPU-accelerated points.

### Object Inputs (NgtsSparklesOptions)

| Property  | Description                           | Default Value |
| --------- | ------------------------------------- | ------------- |
| `count`   | Number of sparkle particles.          | 100           |
| `speed`   | Animation speed factor.               | 1             |
| `opacity` | Opacity of the sparkles.              | 1             |
| `scale`   | Scale of the sparkles distribution.   | 1             |
| `noise`   | Noise factor for particle movement.   | 1             |
| `size`    | Size of individual sparkle particles. |               |
| `color`   | Color of the sparkles.                |               |

```html
<ngts-sparkles [options]="{ count: 50, scale: 2, size: 6, speed: 0.4, color: 'gold' }" />
```

## NgtsSky

Renders a procedural sky dome using atmospheric scattering simulation. Based on the Three.js Sky shader which simulates realistic sky colors based on sun position.

### Object Inputs (NgtsSkyOptions)

| Property          | Description                                                        | Default Value |
| ----------------- | ------------------------------------------------------------------ | ------------- |
| `distance`        | Distance of the sky sphere from the camera.                        | 1000          |
| `inclination`     | Vertical angle of the sun (0-1, where 0.5 is horizon).             | 0.6           |
| `azimuth`         | Horizontal angle of the sun (0-1, representing full rotation).     | 0.1           |
| `mieCoefficient`  | Mie scattering coefficient. Controls haze and sun disc intensity.  | 0.005         |
| `mieDirectionalG` | Mie scattering directional parameter. Controls sun disc size.      | 0.8           |
| `rayleigh`        | Rayleigh scattering coefficient. Higher values create bluer skies. | 0.5           |
| `turbidity`       | Atmospheric turbidity. Higher values create hazier atmospheres.    | 10            |
| `sunPosition`     | Direct sun position vector. Overrides inclination/azimuth if set.  |               |

```html
<ngts-sky [options]="{ turbidity: 10, rayleigh: 2, inclination: 0.5 }" />
```

## NgtsStage

A complete stage setup for presenting 3D models with lighting, shadows, and environment. Automatically centers content, sets up professional lighting presets, and configures shadows.

### Object Inputs (NgtsStageOptions)

| Property       | Description                                                                    | Default Value |
| -------------- | ------------------------------------------------------------------------------ | ------------- |
| `preset`       | Lighting preset: 'rembrandt', 'portrait', 'upfront', 'soft', or custom config. | 'rembrandt'   |
| `shadows`      | Shadow type: false, 'contact', 'accumulative', or NgtsStageShadowsOptions.     | 'contact'     |
| `adjustCamera` | Whether to automatically adjust the camera to fit the content.                 | true          |
| `environment`  | Environment map configuration: preset name, options object, or null.           | 'city'        |
| `intensity`    | Overall lighting intensity multiplier.                                         | 0.5           |
| `center`       | Options for centering the content within the stage.                            |               |

```html
<ngts-stage [options]="{ preset: 'rembrandt', shadows: 'contact', environment: 'city' }">
	<ngt-mesh>
		<ngt-box-geometry />
		<ngt-mesh-standard-material />
	</ngt-mesh>
</ngts-stage>
```

## NgtsCaustics

A component that renders realistic caustic light patterns on surfaces. Caustics are the light patterns created when light is refracted or reflected by curved transparent surfaces (like water or glass).

### Object Inputs (NgtsCausticsOptions)

| Property       | Description                                                | Default Value |
| -------------- | ---------------------------------------------------------- | ------------- |
| `frames`       | How many frames to render. Set to Infinity for continuous. | 1             |
| `debug`        | Enables visual debugging cues including camera helper.     | false         |
| `causticsOnly` | When enabled, displays only caustics and hides the models. | false         |
| `backside`     | When enabled, includes back face rendering.                | false         |
| `ior`          | The Index of Refraction (IOR) value for front faces.       | 1.1           |
| `backsideIOR`  | The Index of Refraction (IOR) value for back faces.        | 1.1           |
| `worldRadius`  | The world-space texel size for caustic calculations.       | 0.3125        |
| `intensity`    | Intensity of the projected caustics effect.                | 0.05          |
| `color`        | Color of the caustics effect.                              | 'white'       |
| `resolution`   | Buffer resolution for caustic texture rendering.           | 2024          |
| `lightSource`  | Light source position or object.                           | [5, 5, 5]     |

```html
<ngts-caustics [options]="{ frames: Infinity, intensity: 0.05, color: 'white' }">
	<ngt-mesh>
		<ngt-sphere-geometry />
		<ngt-mesh-physical-material [transmission]="1" [roughness]="0" />
	</ngt-mesh>
</ngts-caustics>
```

## NgtsSpotLight

Enhanced spot light with optional volumetric lighting effect. Creates a visible light cone that simulates light scattering through atmosphere or dust.

### Object Inputs (NgtsSpotLightOptions)

| Property       | Description                                                 | Default Value |
| -------------- | ----------------------------------------------------------- | ------------- |
| `depthBuffer`  | Depth texture for soft volumetric lighting.                 | null          |
| `attenuation`  | Light attenuation factor. Controls how quickly light fades. | 5             |
| `anglePower`   | Power of the light cone angle falloff.                      | 5             |
| `radiusTop`    | Radius of the light cone at the top.                        | 0.1           |
| `radiusBottom` | Radius of the light cone at the bottom.                     | angle \* 7    |
| `opacity`      | Opacity of the volumetric light cone.                       | 1             |
| `color`        | Color of the light.                                         | 'white'       |
| `volumetric`   | Whether to render the volumetric light cone mesh.           | true          |
| `debug`        | Whether to show the SpotLightHelper for debugging.          | false         |
| `distance`     | Distance of the light.                                      | 5             |
| `angle`        | Angle of the light cone.                                    | 0.15          |

```html
<ngts-spot-light
	[options]="{
    position: [0, 5, 0],
    angle: 0.5,
    intensity: 1,
    color: 'white',
    volumetric: true
  }"
/>
```

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
| `receiveShadow` | Whether the backdrop should receive shadows. |               |

```html
<ngts-backdrop [options]="{ floor: 0.25, segments: 20 }">
	<ngt-mesh-standard-material color="#353540" />
</ngts-backdrop>
```
