# `angular-three-soba/cameras`

This module provides a variety of camera components for Angular Three, including specialized cameras and helper components for camera controls.

All camera implementations share the following features:

- `makeDefault` option: Allows the consumer to make this camera the default camera in the Canvas Store (via injectStore()). Default is `false`.
- `manual` option: Allows the consumer to take over updating the camera. When set to `true`, the camera won't be responsive, and the consumer will need to update its properties upon viewport change. Default is `false`.
- `cameraContent` directive: Allows you to render content from the perspective of the camera. This can be used for various effects, including portals, minimaps, security cameras, picture-in-picture, and rendering to textures.

Within the template of the `cameraContent` directive, you have access to a `texture` variable representing the rendered view. This `texture` is of type `Signal<Texture>`.

```html
<ngts-perspective-camera>
	<ngt-mesh *cameraContent="let texture">
		<ngt-mesh-basic-material [map]="texture()" />
	</ngt-mesh>
</ngts-perspective-camera>
```

## TOC

- [NgtsPerspectiveCamera](#ngtsperspectivecamera)
- [NgtsOrthographicCamera](#ngtsorthographiccamera)
- [NgtsCubeCamera](#ngtscubecamera)

## NgtsPerspectiveCamera

A responsive `THREE.PerspectiveCamera` that can be set as the default camera. By default, it automatically tracks the size of the canvas and updates accordingly.

### Object Inputs (NgtsPerspectiveCameraOptions)

| Property | Description               | Default value |
| -------- | ------------------------- | ------------- |
| fov      | Field of view in degrees. | 50            |
| near     | Near clipping plane.      | 0.1           |
| far      | Far clipping plane.       | 1000          |

### Usage

```html
<ngts-perspective-camera [options]="{ makeDefault: true, fov: 75, near: 0.1, far: 1000 }" />
```

## NgtsOrthographicCamera

A responsive `THREE.OrthographicCamera` that can be set as the default camera. By default, it automatically tracks the size of the canvas and updates accordingly.

### Object Inputs (NgtsOrthographicCameraOptions)

| Property | Description                                 | Default value |
| -------- | ------------------------------------------- | ------------- |
| left     | Camera frustum left plane.                  | -1            |
| right    | Camera frustum right plane.                 | 1             |
| top      | Camera frustum top plane.                   | 1             |
| bottom   | Camera frustum bottom plane.                | -1            |
| near     | Camera frustum near plane.                  | 0.1           |
| far      | Camera frustum far plane.                   | 1000          |
| zoom     | Gets or sets the zoom factor of the camera. | 1             |

### Usage

```html
<ngts-orthographic-camera
	[options]="{ makeDefault: true, left: -10, right: 10, top: 10, bottom: -10, near: 0.1, far: 1000 }"
/>
```

## NgtsCubeCamera

A responsive `THREE.CubeCamera` that renders to a `WebGLCubeRenderTarget`. You can either use it as a regular environment map or use it for the `NgtsCameraContent` directive for more advanced use cases.

### Object Inputs (NgtsCubeCameraOptions)

| Property   | Description                    | Default value |
| ---------- | ------------------------------ | ------------- |
| near       | Near clipping plane.           | 0.1           |
| far        | Far clipping plane.            | 1000          |
| resolution | Cube render target resolution. | 256           |
| frames     | Number of frames to render.    | 1             |
| envMap     | Custom environment map.        | null          |
| fog        | Custom fog.                    | null          |

### Usage

```html
<ngts-cube-camera [options]="{ near: 0.1, far: 1000, resolution: 256 }">
	<ngt-mesh *cameraContent="let texture">
		<ngt-mesh-basic-material [map]="texture()" />
	</ngt-mesh>
</ngts-cube-camera>
```
