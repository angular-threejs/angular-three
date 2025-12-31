# `angular-three-soba/abstractions`

This module provides abstract components and patterns for building reusable and composable 3D elements in Angular Three. It requires the following peer dependencies:

| Package             | Description                                  |
| ------------------- | -------------------------------------------- |
| `troika-three-text` | Required for using the `NgtsText` component. |
| `three-mesh-bvh`    | Required for `angular-three-soba/shaders`    |

To install these dependencies, use one of the following commands:

```bash
npm install troika-three-text three-mesh-bvh
# yarn add troika-three-text three-mesh-bvh
# pnpm add troika-three-text three-mesh-bvh
```

## TOC

- [NgtsBillboard](#ngtsbillboard)
- [NgtsRoundedBox](#ngtsroundedbox)
- [NgtsGrid](#ngtsgrid)
- [NgtsText](#ngtstext)
- [NgtsText3D](#ngtstext3d)
- [NgtsLine](#ngtsline)
- [NgtsQuadraticBezierLine](#ngtsquadraticbezierline)
- [NgtsCubicBezierLine](#ngtscubicbezierline)
- [NgtsCatmullRomLine](#ngtscatmullromline)
- [NgtsEdges](#ngtsedges)
- [NgtsPrismGeometry](#ngtsprismgeometry)
- [NgtsGradientTexture](#ngtsgradienttexture)
- [helper](#helper)
    - [NgtsHelper](#ngtshelper)

## NgtsBillboard

A component that rotates its contents to always face the camera (billboarding effect). Useful for sprites, labels, or any content that should always face the viewer.

### Object Inputs (NgtsBillboardOptions)

| Property | Description                                                                   | Default Value |
| -------- | ----------------------------------------------------------------------------- | ------------- |
| `follow` | Whether the billboard should follow (face) the camera.                        | `true`        |
| `lockX`  | Lock rotation on the X axis, preventing the billboard from rotating around X. | `false`       |
| `lockY`  | Lock rotation on the Y axis, preventing the billboard from rotating around Y. | `false`       |
| `lockZ`  | Lock rotation on the Z axis, preventing the billboard from rotating around Z. | `false`       |

```html
<ngts-billboard [options]="{ follow: true, lockY: true }">
	<ngt-mesh>
		<ngt-plane-geometry />
		<ngt-mesh-basic-material />
	</ngt-mesh>
</ngts-billboard>
```

## NgtsRoundedBox

A component that renders a box with rounded edges. Creates smooth, beveled corners on all edges of the box.

### Object Inputs (NgtsRoundedBoxOptions)

| Property        | Description                                                | Default Value |
| --------------- | ---------------------------------------------------------- | ------------- |
| `width`         | Width of the box (X-axis).                                 | `1`           |
| `height`        | Height of the box (Y-axis).                                | `1`           |
| `depth`         | Depth of the box (Z-axis).                                 | `1`           |
| `radius`        | Radius of the rounded corners.                             | `0.05`        |
| `smoothness`    | Number of curve segments for corner smoothness.            | `4`           |
| `bevelSegments` | Number of bevel segments.                                  | `4`           |
| `steps`         | Number of extrusion steps.                                 | `1`           |
| `creaseAngle`   | Angle threshold for creased normals calculation (radians). | `0.4`         |

```html
<ngts-rounded-box [options]="{ width: 2, height: 1, depth: 1, radius: 0.1 }">
	<ngt-mesh-standard-material color="orange" />
</ngts-rounded-box>
```

## NgtsGrid

A y-up oriented, shader-based grid implementation.

This component renders a grid using a shader material, allowing for efficient rendering of large grids. It provides options to customize the appearance of the grid, such as cell size, cell thickness, cell color, section size, section thickness, section color, and more.

### Object Inputs (NgtsGridOptions)

| Property           | Description                                                                                                  | Default Value    |
| ------------------ | ------------------------------------------------------------------------------------------------------------ | ---------------- |
| `planeArgs`        | Default plane-geometry arguments.                                                                            | `[]`             |
| `cellSize`         | Cell size.                                                                                                   | `0.5`            |
| `cellThickness`    | Cell thickness.                                                                                              | `0.5`            |
| `cellColor`        | Cell color.                                                                                                  | `'black'`        |
| `sectionSize`      | Section size.                                                                                                | `1`              |
| `sectionThickness` | Section thickness.                                                                                           | `1`              |
| `sectionColor`     | Section color.                                                                                               | `'#2080ff'`      |
| `infiniteGrid`     | Display the grid infinitely.                                                                                 | `false`          |
| `followCamera`     | Follow camera.                                                                                               | `false`          |
| `fadeDistance`     | Fade distance.                                                                                               | `100`            |
| `fadeStrength`     | Fade strength.                                                                                               | `1`              |
| `fadeFrom`         | Fade from camera (1) or origin (0), or somewhere in between.                                                 | `1`              |
| `side`             | Which side of the faces will be rendered. Can be `THREE.FrontSide`, `THREE.BackSide`, or `THREE.DoubleSide`. | `THREE.BackSide` |

```html
<ngts-grid />
```

## NgtsText

High-quality text rendering with signed distance fields (SDF) and antialiasing, using `troika-three-text`.

This component renders high-quality text using SDF and antialiasing techniques. It supports various options for customizing the appearance of the text, such as font, font size, color, alignment, and more.

### Inputs

| Input  | Description             | Required |
| ------ | ----------------------- | -------- |
| `text` | Text content to render. | Yes      |

### Object Inputs (NgtsTextOptions)

| Property              | Description                                                                                                        | Default Value |
| --------------------- | ------------------------------------------------------------------------------------------------------------------ | ------------- |
| `font`                | URL to the font file (supports .ttf, .otf, .woff).                                                                 | `undefined`   |
| `fontSize`            | Font size in world units.                                                                                          | `1`           |
| `color`               | Text color.                                                                                                        | `undefined`   |
| `fontWeight`          | Font weight (numeric or string like 'bold').                                                                       | `undefined`   |
| `fontStyle`           | Font style. Can be `'italic'` or `'normal'`.                                                                       | `undefined`   |
| `maxWidth`            | Maximum width for text wrapping in world units.                                                                    | `undefined`   |
| `lineHeight`          | Line height multiplier.                                                                                            | `undefined`   |
| `letterSpacing`       | Letter spacing in world units.                                                                                     | `undefined`   |
| `textAlign`           | Text alignment. Can be `'left'`, `'right'`, `'center'`, or `'justify'`.                                            | `undefined`   |
| `anchorX`             | Horizontal anchor point. Can be `'left'`, `'center'`, `'right'`, or a number.                                      | `'center'`    |
| `anchorY`             | Vertical anchor point. Can be `'top'`, `'top-baseline'`, `'middle'`, `'bottom-baseline'`, `'bottom'`, or a number. | `'middle'`    |
| `clipRect`            | Clipping rectangle [minX, minY, maxX, maxY].                                                                       | `undefined`   |
| `depthOffset`         | Depth offset for z-fighting prevention.                                                                            | `undefined`   |
| `direction`           | Text direction for bidirectional text. Can be `'auto'`, `'ltr'`, or `'rtl'`.                                       | `undefined`   |
| `overflowWrap`        | How to handle text overflow and wrapping. Can be `'normal'` or `'break-word'`.                                     | `undefined`   |
| `whiteSpace`          | Whitespace handling mode. Can be `'normal'`, `'overflowWrap'`, or `'nowrap'`.                                      | `undefined`   |
| `outlineWidth`        | Width of the text outline.                                                                                         | `undefined`   |
| `outlineOffsetX`      | Horizontal offset for the outline.                                                                                 | `undefined`   |
| `outlineOffsetY`      | Vertical offset for the outline.                                                                                   | `undefined`   |
| `outlineBlur`         | Blur radius for the outline.                                                                                       | `undefined`   |
| `outlineColor`        | Color of the text outline.                                                                                         | `undefined`   |
| `outlineOpacity`      | Opacity of the text outline (0-1).                                                                                 | `undefined`   |
| `strokeWidth`         | Width of the text stroke.                                                                                          | `undefined`   |
| `strokeColor`         | Color of the text stroke.                                                                                          | `undefined`   |
| `strokeOpacity`       | Opacity of the text stroke (0-1).                                                                                  | `undefined`   |
| `fillOpacity`         | Opacity of the text fill (0-1).                                                                                    | `undefined`   |
| `sdfGlyphSize`        | Size of the SDF glyph texture. Higher values improve quality but use more memory.                                  | `64`          |
| `debugSDF`            | Enable debug visualization of the SDF texture.                                                                     | `undefined`   |
| `characters`          | Characters to pre-render for the font. Improves performance for known character sets.                              | `undefined`   |
| `glyphGeometryDetail` | Detail level for glyph geometry.                                                                                   | `undefined`   |

### Outputs

| Output   | Description                                                                                              |
| -------- | -------------------------------------------------------------------------------------------------------- |
| `synced` | Emitted when the text has been synced and is ready for rendering. Returns the Troika Text mesh instance. |

```html
<ngts-text text="Hello, World!" />
```

## NgtsText3D

Renders 3D text using Three.js TextGeometry.

This component renders 3D text using TextGeometry. It requires fonts in JSON format generated through typeface.json.

### Inputs

| Input  | Description                                                                   | Required |
| ------ | ----------------------------------------------------------------------------- | -------- |
| `font` | Font source. Can be a URL to a typeface.json file or a preloaded font object. | Yes      |
| `text` | Text content to render as 3D geometry.                                        | Yes      |

### Object Inputs (NgtsText3DOptions)

| Property         | Description                                              | Default Value |
| ---------------- | -------------------------------------------------------- | ------------- |
| `size`           | Font size.                                               | `1`           |
| `height`         | Text extrusion height.                                   | `0.2`         |
| `curveSegments`  | Number of curve segments.                                | `8`           |
| `bevelEnabled`   | Enable bevel.                                            | `false`       |
| `bevelThickness` | Bevel thickness.                                         | `0.1`         |
| `bevelSize`      | Bevel size.                                              | `0.01`        |
| `bevelOffset`    | Bevel offset.                                            | `0`           |
| `bevelSegments`  | Number of bevel segments for smoother beveled edges.     | `4`           |
| `letterSpacing`  | Letter spacing.                                          | `0`           |
| `lineHeight`     | Line height multiplier.                                  | `1`           |
| `smooth`         | Threshold for merging vertices to create smooth normals. | `undefined`   |

```html
<ngts-text-3d font="path/to/font.json" text="Hello, World!">
	<ngt-mesh-standard-material color="gold" />
</ngts-text-3d>
```

## NgtsLine

Renders a `THREE.Line2` or `THREE.LineSegments2` (depending on the value of `segments`).

### Inputs

| Input    | Description                                                                    | Required |
| -------- | ------------------------------------------------------------------------------ | -------- |
| `points` | Array of points. Accepts Vector3, Vector2, coordinate tuples, or flat numbers. | Yes      |

### Object Inputs (NgtsLineOptions)

| Property       | Description                                                          | Default Value |
| -------------- | -------------------------------------------------------------------- | ------------- |
| `color`        | Line color.                                                          | `0xffffff`    |
| `lineWidth`    | Line width in pixels.                                                | `1`           |
| `segments`     | Whether to render as `THREE.LineSegments2` instead of `THREE.Line2`. | `false`       |
| `dashed`       | Whether the line is dashed.                                          | `undefined`   |
| `vertexColors` | Array of colors for vertex coloring. Supports RGB or RGBA tuples.    | `undefined`   |

```html
<ngts-line [points]="[[0, 0, 0], [1, 1, 1]]" />
```

## NgtsQuadraticBezierLine

Renders a `THREE.Line2` using `THREE.QuadraticBezierCurve3` for interpolation.

### Inputs

| Input   | Description                                               | Default Value |
| ------- | --------------------------------------------------------- | ------------- |
| `start` | Starting point of the bezier curve.                       | `[0, 0, 0]`   |
| `end`   | Ending point of the bezier curve.                         | `[0, 0, 0]`   |
| `mid`   | Control point. If not provided, automatically calculated. | `undefined`   |

### Object Inputs (NgtsQuadraticBezierLineOptions)

| Property    | Description                                         | Default Value |
| ----------- | --------------------------------------------------- | ------------- |
| `segments`  | Number of segments to approximate the bezier curve. | `20`          |
| `lineWidth` | Line width.                                         | `1`           |

Also accepts all `NgtsLineOptions` except `segments` (boolean).

```html
<ngts-quadratic-bezier-line [start]="[0, 0, 0]" [end]="[1, 1, 1]" />
```

## NgtsCubicBezierLine

Renders a `THREE.Line2` using `THREE.CubicBezierCurve3` for interpolation.

### Inputs

| Input   | Description           | Required |
| ------- | --------------------- | -------- |
| `start` | Start point.          | Yes      |
| `end`   | End point.            | Yes      |
| `midA`  | First control point.  | Yes      |
| `midB`  | Second control point. | Yes      |

### Object Inputs (NgtsCubicBezierLineOptions)

| Property    | Description                                         | Default Value |
| ----------- | --------------------------------------------------- | ------------- |
| `segments`  | Number of segments to divide the Bezier curve into. | `20`          |
| `lineWidth` | Line width.                                         | `1`           |

Also accepts all `NgtsLineOptions` except `segments` (boolean).

```html
<ngts-cubic-bezier-line [start]="[0, 0, 0]" [end]="[1, 1, 1]" [midA]="[0.5, 0.5, 0.5]" [midB]="[0.5, 0.5, 0.5]" />
```

## NgtsCatmullRomLine

Renders a `THREE.Line2` using `THREE.CatmullRomCurve3` for interpolation.

### Inputs

| Input    | Description      | Required |
| -------- | ---------------- | -------- |
| `points` | Array of points. | Yes      |

### Object Inputs (NgtsCatmullRomLineOptions)

| Property    | Description                                                            | Default Value   |
| ----------- | ---------------------------------------------------------------------- | --------------- |
| `closed`    | Whether the curve should be closed (connect end to start).             | `false`         |
| `curveType` | Type of curve. Can be `'centripetal'`, `'chordal'`, or `'catmullrom'`. | `'centripetal'` |
| `tension`   | Tension parameter for the curve (0 to 1).                              | `0.5`           |
| `segments`  | Number of segments to divide the curve into for rendering.             | `20`            |
| `lineWidth` | Line width.                                                            | `1`             |

Also accepts all `NgtsLineOptions` except `segments` (boolean).

```html
<ngts-catmull-rom-line [points]="[[0, 0, 0], [1, 1, 1]]" />
```

## NgtsEdges

Abstracts [THREE.EdgesGeometry](https://threejs.org/docs/#api/en/geometries/EdgesGeometry). It pulls the geometry automatically from its parent, optionally you can ungroup it and give it a `geometry` prop. You can give it children, for instance a custom material. `NgtsEdges` is based on `NgtsLine` and supports all of its options.

### Object Inputs (NgtsEdgesOptions)

| Property    | Description                                                           | Default Value |
| ----------- | --------------------------------------------------------------------- | ------------- |
| `geometry`  | Geometry to use for the edges. If not provided, uses parent geometry. | `undefined`   |
| `threshold` | Angle threshold in degrees for edge detection.                        | `15`          |
| `lineWidth` | Width of the edge lines.                                              | `1`           |

Also accepts all `NgtsLineOptions`.

```html
<ngt-mesh>
	<ngt-box-geometry />
	<ngt-mesh-basic-material />
	<ngts-edges [options]="{ threshold: 15, scale: 1.1, color: 'white', lineWidth: 4 }" />
</ngt-mesh>
```

## NgtsPrismGeometry

Abstracts [THREE.ExtrudeGeometry](https://threejs.org/docs/#api/en/geometries/ExtrudeGeometry) to create a prism geometry.

### Inputs

| Input      | Description                                      | Required |
| ---------- | ------------------------------------------------ | -------- |
| `vertices` | Array of 2D vertices defining the base shape.    | Yes      |
| `attach`   | Defines how the geometry attaches to its parent. | No       |

### Object Inputs (NgtsPrismGeometryOptions)

| Property       | Description                    | Default Value |
| -------------- | ------------------------------ | ------------- |
| `height`       | Height of the prism extrusion. | `1`           |
| `bevelEnabled` | Enable bevel.                  | `false`       |

Also accepts all `THREE.ExtrudeGeometryOptions` except `depth`.

```html
<ngt-mesh>
	<ngts-prism-geometry [vertices]="[[0, 0], [1, 0], [1, 1], [0, 1]]" />
	<ngt-mesh-basic-material />
</ngt-mesh>
```

## NgtsGradientTexture

A declarative `THREE.Texture` which attaches to "map" by default. You can use this to create gradient backgrounds.

### Inputs

| Input    | Description                                             | Required |
| -------- | ------------------------------------------------------- | -------- |
| `stops`  | Gradient stops array.                                   | Yes      |
| `colors` | Gradient colors array. Must be the same size as `stops` | Yes      |
| `attach` | Defines how the texture attaches to its parent.         | No       |

### Object Inputs (NgtsGradientTextureOptions)

| Property            | Description                                      | Default Value |
| ------------------- | ------------------------------------------------ | ------------- |
| `type`              | Gradient type. Can be `'linear'` or `'radial'`.  | `'linear'`    |
| `size`              | Height of the gradient texture canvas in pixels. | `1024`        |
| `width`             | Width of the gradient texture canvas in pixels.  | `16`          |
| `innerCircleRadius` | Inner circle radius for radial gradients.        | `0`           |
| `outerCircleRadius` | Outer circle radius for radial gradients.        | `'auto'`      |

```html
<ngt-mesh-basic-material>
	<ngts-gradient-texture [stops]="[0, 0.5, 1]" [colors]="['red', 'green', 'blue']" />
</ngt-mesh-basic-material>
```

## `helper`

A function to add helpers to existing nodes in the scene. It handles removal of the helper on destroy and auto-updates it by default.

```ts
class MyCmp {
	mesh = viewChild.required<ElementRef<Mesh>>('mesh');
	boxHelper = helper(this.mesh, () => BoxHelper, { args: () => ['cyan'] });
}
```

> **Note:** `injectHelper` is a deprecated alias for `helper` and will be removed in v5.0.0.

### `NgtsHelper`

A declarative way to add helpers to existing nodes in the scene. It handles removal of the helper on destroy and auto-updates it by default.

```html
<ngt-mesh>
	<ngts-helper [type]="BoxHelper" [options]="['cyan']" />
</ngt-mesh>
```
