# `angular-three-soba/cameras`

This module provides a variety of camera components for Angular Three, including specialized cameras and helper components for camera controls.

All camera implementations share the following features:

- `makeDefault` option: Allows the consumer to make this camera the default camera in the Canvas Store (via injectStore()). Default is `false`.
- `manual` option: Allows the consumer to take over updating the camera. When set to `true`, the camera won't be responsive, and the consumer will need to update its properties upon viewport change. Default is `false`.
- `cameraContent` directive: Allows you to render content from the perspective of the camera. This can be used for various effects, including portals, minimaps, security cameras, picture-in-picture, and rendering to textures.

Within the template of the `cameraContent` directive, you have access to a `texture` variable representing the rendered view. This `texture` is of type `THREE.Texture`.

```html
<ngts-perspective-camera>
	<ng-template cameraContent let-texture>
		<ngt-mesh>
			<ngt-mesh-basic-material [map]="texture" />
		</ngt-mesh>
	</ng-template>
</ngts-perspective-camera>
```

## TOC

- [NgtsPerspectiveCamera](#ngtsperspectivecamera)
- [NgtsOrthographicCamera](#ngtsorthographiccamera)
- [NgtsCubeCamera](#ngtscubecamera)
- [cubeCamera](#cubecamera)

## NgtsPerspectiveCamera

A responsive `THREE.PerspectiveCamera` that can be set as the default camera. By default, it automatically tracks the size of the canvas and updates accordingly.

### Object Inputs (NgtsPerspectiveCameraOptions)

| Property    | Description                                                                 | Default value |
| ----------- | --------------------------------------------------------------------------- | ------------- |
| makeDefault | Registers this camera as the system default camera.                         | false         |
| manual      | Disables automatic aspect ratio calculation based on viewport size.         | false         |
| frames      | Number of frames to render to FBO when using cameraContent.                 | Infinity      |
| resolution  | Resolution of the frame buffer object (FBO) for render-to-texture.          | 256           |
| envMap      | Optional environment map texture for scene background during FBO rendering. | undefined     |

Additionally, all `THREE.PerspectiveCamera` properties (e.g., `fov`, `near`, `far`, `position`) can be passed through.

### Usage

```html
<ngts-perspective-camera [options]="{ makeDefault: true, fov: 75, position: [0, 0, 10] }" />
```

## NgtsOrthographicCamera

A responsive `THREE.OrthographicCamera` that can be set as the default camera. By default, it automatically tracks the size of the canvas and calculates frustum bounds from viewport size.

### Object Inputs (NgtsOrthographicCameraOptions)

| Property    | Description                                                                 | Default value |
| ----------- | --------------------------------------------------------------------------- | ------------- |
| makeDefault | Registers this camera as the system default camera.                         | false         |
| manual      | Disables automatic frustum calculation based on viewport size.              | false         |
| frames      | Number of frames to render to FBO when using cameraContent.                 | Infinity      |
| resolution  | Resolution of the frame buffer object (FBO) for render-to-texture.          | 256           |
| envMap      | Optional environment map texture for scene background during FBO rendering. | undefined     |

Additionally, all `THREE.OrthographicCamera` properties (e.g., `left`, `right`, `top`, `bottom`, `near`, `far`, `zoom`, `position`) can be passed through. If `left`, `right`, `top`, `bottom` are not specified, they are computed from the viewport size.

### Usage

```html
<ngts-orthographic-camera [options]="{ makeDefault: true, position: [0, 0, 10] }" />
```

## NgtsCubeCamera

A `THREE.CubeCamera` component that renders to a `WebGLCubeRenderTarget`. You can use it for environment mapping and reflections via the `cameraContent` directive.

### Object Inputs (NgtsCubeCameraOptions)

| Property   | Description                                                   | Default value |
| ---------- | ------------------------------------------------------------- | ------------- |
| near       | Near clipping plane.                                          | 0.1           |
| far        | Far clipping plane.                                           | 1000          |
| resolution | Cube render target resolution.                                | 256           |
| frames     | Number of frames to render (use Infinity for continuous).     | Infinity      |
| envMap     | Custom environment map set as scene background during render. | undefined     |
| fog        | Custom fog set during render.                                 | undefined     |

Additionally, all `THREE.Group` properties (e.g., `position`, `rotation`) can be passed through.

### Usage

```html
<ngts-cube-camera [options]="{ resolution: 512, frames: 1 }">
	<ng-template cameraContent let-texture>
		<ngt-mesh>
			<ngt-sphere-geometry />
			<ngt-mesh-standard-material [envMap]="texture" metalness="1" roughness="0" />
		</ngt-mesh>
	</ng-template>
</ngts-cube-camera>
```

## cubeCamera

A function that creates a reactive cube camera for rendering environment maps and reflections programmatically.

### Options (CubeCameraOptions)

| Property   | Description                                                   | Default value |
| ---------- | ------------------------------------------------------------- | ------------- |
| resolution | Cube render target resolution.                                | 256           |
| near       | Near clipping plane.                                          | 0.1           |
| far        | Far clipping plane.                                           | 1000          |
| envMap     | Custom environment map set as scene background during render. | undefined     |
| fog        | Custom fog set during render.                                 | undefined     |

### Returns

| Property | Description                                 |
| -------- | ------------------------------------------- |
| fbo      | Signal containing the WebGLCubeRenderTarget |
| camera   | Signal containing the CubeCamera            |
| update   | Function to trigger a re-render             |

### Usage

```typescript
const { fbo, camera, update } = cubeCamera(() => ({
	resolution: 512,
	near: 0.1,
	far: 1000,
}));

// Use fbo().texture as an environment map
// Call update() to re-render the cube camera
```
