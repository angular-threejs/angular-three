# `angular-three-soba/gizmos`

This secondary entry point provides interactive gizmo components for manipulating camera orientation and transforming 3D objects in your scene.

## TOC

- [NgtsGizmoHelper](#ngtsgizmohelper)
- [NgtsGizmoViewcube](#ngtsgizmoviewcube)
- [NgtsGizmoViewport](#ngtsgizmoviewport)
- [NgtsTransformControls](#ngtstransformcontrols)
- [NgtsPivotControls](#ngtspivotcontrols)

## NgtsGizmoHelper

A component that displays an orientation gizmo helper in a corner of the viewport. It renders in a separate portal with its own orthographic camera and allows users to click on axes to animate the camera to predefined views.

### Object Input (`NgtsGizmoHelperOptions`)

| Property         | Description                                           | Default Value    |
| ---------------- | ----------------------------------------------------- | ---------------- |
| `alignment`      | Position of the gizmo in the viewport                 | `'bottom-right'` |
| `margin`         | Margin from the edge of the viewport in pixels [x, y] | `[80, 80]`       |
| `renderPriority` | Render priority for the gizmo portal                  | `1`              |
| `autoClear`      | Whether to auto-clear the renderer before rendering   | `undefined`      |

### Outputs

| Output   | Description                             |
| -------- | --------------------------------------- |
| `update` | Emits when the camera animation updates |

```html
<ngts-gizmo-helper [options]="{ alignment: 'bottom-right', margin: [80, 80] }">
	<ng-template gizmoHelperContent>
		<ngts-gizmo-viewport />
	</ng-template>
</ngts-gizmo-helper>
```

## NgtsGizmoViewcube

A 3D cube-style orientation gizmo with labeled faces (Front, Back, Left, Right, Top, Bottom). Clickable faces, edges, and corners allow users to orient the camera to standard or diagonal views. Must be used inside `NgtsGizmoHelper`.

### Object Input (`NgtsGizmoViewcubeOptions`)

| Property      | Description                            | Default Value                                         |
| ------------- | -------------------------------------- | ----------------------------------------------------- |
| `font`        | CSS font specification for face labels | `'20px Inter var, Arial, sans-serif'`                 |
| `opacity`     | Opacity of the cube faces              | `1`                                                   |
| `color`       | Background color of the cube faces     | `'#f0f0f0'`                                           |
| `hoverColor`  | Color when a face is hovered           | `'#999'`                                              |
| `textColor`   | Color of the face label text           | `'black'`                                             |
| `strokeColor` | Color of the face border stroke        | `'black'`                                             |
| `faces`       | Labels for each face                   | `['Right', 'Left', 'Top', 'Bottom', 'Front', 'Back']` |

### Outputs

| Output  | Description                              |
| ------- | ---------------------------------------- |
| `click` | Emits when a face/edge/corner is clicked |

```html
<ngts-gizmo-helper>
	<ng-template gizmoHelperContent>
		<ngts-gizmo-viewcube [options]="{ color: '#fff', hoverColor: '#ccc' }" />
	</ng-template>
</ngts-gizmo-helper>
```

## NgtsGizmoViewport

A viewport-style gizmo with colored axes (X, Y, Z) and interactive heads. Clicking on axis heads animates the camera to the corresponding view direction. Must be used inside `NgtsGizmoHelper`.

### Object Input (`NgtsGizmoViewportOptions`)

| Property           | Description                             | Default Value                         |
| ------------------ | --------------------------------------- | ------------------------------------- |
| `axisColors`       | Colors for the X, Y, and Z axes         | `['#ff2060', '#20df80', '#2080ff']`   |
| `axisScale`        | Scale of the axis lines [x, y, z]       | `undefined`                           |
| `labels`           | Labels for the X, Y, and Z axis heads   | `['X', 'Y', 'Z']`                     |
| `axisHeadScale`    | Scale factor for the axis head sprites  | `1`                                   |
| `labelColor`       | Color of the axis labels                | `'#000'`                              |
| `hideNegativeAxes` | Whether to hide the negative axis heads | `false`                               |
| `hideAxisHeads`    | Whether to hide all axis heads          | `false`                               |
| `disabled`         | Whether the gizmo is non-interactive    | `false`                               |
| `font`             | CSS font specification for axis labels  | `'18px Inter var, Arial, sans-serif'` |

### Outputs

| Output  | Description                   |
| ------- | ----------------------------- |
| `click` | Emits when an axis is clicked |

```html
<ngts-gizmo-helper>
	<ng-template gizmoHelperContent>
		<ngts-gizmo-viewport [options]="{ axisColors: ['red', 'green', 'blue'] }" />
	</ng-template>
</ngts-gizmo-helper>
```

## NgtsTransformControls

Interactive transform controls for manipulating 3D objects. Wraps Three.js TransformControls to provide translation, rotation, and scaling gizmos.

### Inputs

| Input    | Description                               |
| -------- | ----------------------------------------- |
| `object` | The target object to transform (optional) |

### Object Input (`NgtsTransformControlsOptions`)

| Property          | Description                                | Default Value |
| ----------------- | ------------------------------------------ | ------------- |
| `enabled`         | Whether the controls are enabled           | `true`        |
| `mode`            | The transformation mode                    | `'translate'` |
| `axis`            | Restricts transformation to specific axis  | `null`        |
| `space`           | Coordinate space for transformations       | `'world'`     |
| `size`            | Size of the gizmo                          | `1`           |
| `showX`           | Whether to show the X axis handle          | `true`        |
| `showY`           | Whether to show the Y axis handle          | `true`        |
| `showZ`           | Whether to show the Z axis handle          | `true`        |
| `translationSnap` | Snap increment for translation             | `null`        |
| `rotationSnap`    | Snap increment for rotation in radians     | `null`        |
| `scaleSnap`       | Snap increment for scaling                 | `null`        |
| `makeDefault`     | Whether to make these the default controls | `false`       |

### Outputs

| Output         | Description                               |
| -------------- | ----------------------------------------- |
| `change`       | Emits on any transformation change        |
| `mouseDown`    | Emits when mouse is pressed on gizmo      |
| `mouseUp`      | Emits when mouse is released              |
| `objectChange` | Emits when the object's transform changes |

```html
<!-- Wrap content -->
<ngts-transform-controls [options]="{ mode: 'translate' }">
	<ngt-mesh>
		<ngt-box-geometry />
		<ngt-mesh-standard-material />
	</ngt-mesh>
</ngts-transform-controls>

<!-- Or attach to existing object -->
<ngts-transform-controls
	[object]="meshRef"
	[options]="{ mode: 'rotate', showX: false }"
	(change)="onTransform($event)"
/>
```

## NgtsPivotControls

An interactive pivot-style gizmo with arrows for translation, plane sliders for 2D movement, rotators for rotation, and spheres for scaling. Supports transformation limits and anchor points.

### Object Input (`NgtsPivotControlsOptions`)

| Property            | Description                                     | Default Value                       |
| ------------------- | ----------------------------------------------- | ----------------------------------- |
| `enabled`           | Whether the control is enabled                  | `true`                              |
| `scale`             | Scale of the gizmo                              | `1`                                 |
| `lineWidth`         | Width of the gizmo lines                        | `4`                                 |
| `fixed`             | If true, gizmo remains constant in screen size  | `false`                             |
| `offset`            | Position offset of the pivot point              | `[0, 0, 0]`                         |
| `rotation`          | Starting rotation of the gizmo in radians       | `[0, 0, 0]`                         |
| `matrix`            | Starting transformation matrix                  | `undefined`                         |
| `anchor`            | Bounding box anchor point [-1, 0, +1] per axis  | `undefined`                         |
| `autoTransform`     | Auto-apply local transform on drag              | `true`                              |
| `activeAxes`        | Which axes are active [x, y, z]                 | `[true, true, true]`                |
| `disableAxes`       | Disables all translation arrows                 | `false`                             |
| `disableSliders`    | Disables all plane sliders                      | `false`                             |
| `disableRotations`  | Disables all rotation handles                   | `false`                             |
| `disableScaling`    | Disables all scaling spheres                    | `false`                             |
| `translationLimits` | Translation limits per axis as [min, max] pairs | `undefined`                         |
| `rotationLimits`    | Rotation limits per axis as [min, max] pairs    | `undefined`                         |
| `scaleLimits`       | Scale limits per axis as [min, max] pairs       | `undefined`                         |
| `axisColors`        | Colors for the X, Y, and Z axes                 | `['#ff2060', '#20df80', '#2080ff']` |
| `hoveredColor`      | Color when a gizmo element is hovered           | `'#ffff40'`                         |
| `annotations`       | Whether to show HTML value annotations          | `false`                             |
| `depthTest`         | Whether gizmo is occluded by scene geometry     | `true`                              |
| `opacity`           | Opacity of the gizmo elements                   | `1`                                 |
| `visible`           | Whether the gizmo is visible                    | `true`                              |

### Outputs

| Output        | Description                               |
| ------------- | ----------------------------------------- |
| `dragStarted` | Emits when drag operation starts          |
| `dragged`     | Emits during drag with transform matrices |
| `dragEnded`   | Emits when drag operation ends            |

```html
<ngts-pivot-controls [options]="{ scale: 0.5 }">
	<ngt-mesh>
		<ngt-box-geometry />
		<ngt-mesh-standard-material />
	</ngt-mesh>
</ngts-pivot-controls>

<!-- With limits and callbacks -->
<ngts-pivot-controls
	[options]="{
    disableRotations: true,
    disableScaling: true,
    translationLimits: [[-1, 1], undefined, undefined]
  }"
	(dragged)="onDrag($event)"
	(dragStarted)="onDragStart($event)"
	(dragEnded)="onDragEnd()"
>
	<ngt-mesh />
</ngts-pivot-controls>
```
