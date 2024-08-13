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
- [injectHelper](#injecthelper)
  - [NgtsHelper](#ngtshelper)

## NgtsGrid

A y-up oriented, shader-based grid implementation.

This component renders a grid using a shader material, allowing for efficient rendering of large grids. It provides options to customize the appearance of the grid, such as cell size, cell thickness, cell color, section size, section thickness, section color, and more.

### Object Inputs (NgtsGridOptions)

| Property           | Description                                                                                                  | Default Value     |
| ------------------ | ------------------------------------------------------------------------------------------------------------ | ----------------- |
| `planeArgs`        | Default plane-geometry arguments.                                                                            | `[]`              |
| `cellSize`         | Cell size.                                                                                                   | `0.5`             |
| `cellThickness`    | Cell thickness.                                                                                              | `0.5`             |
| `cellColor`        | Cell color.                                                                                                  | `'black'`         |
| `sectionSize`      | Section size.                                                                                                | `1`               |
| `sectionThickness` | Section thickness.                                                                                           | `1`               |
| `sectionColor`     | Section color.                                                                                               | `'#2080ff'`       |
| `infiniteGrid`     | Display the grid infinitely.                                                                                 | `false`           |
| `followCamera`     | Follow camera.                                                                                               | `false`           |
| `fadeDistance`     | Fade distance.                                                                                               | `100`             |
| `fadeStrength`     | Fade strength.                                                                                               | `1`               |
| `fadeFrom`         | Fade from camera (1) or origin (0), or somewhere in between.                                                 | `'camera'`        |
| `side`             | Which side of the faces will be rendered. Can be `THREE.FrontSide`, `THREE.BackSide`, or `THREE.DoubleSide`. | `THREE.FrontSide` |

```html
<ngts-grid />
```

## NgtsText

High-quality text rendering with signed distance fields (SDF) and antialiasing, using `troika-three-text`

This component renders high-quality text using SDF and antialiasing techniques. It supports various options for customizing the appearance of the text, such as font, font size, color, alignment, and more.

### Object Inputs (NgtsTextOptions)

| Property         | Description                                                                                                                        | Default Value |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| `text`           | (Required) Text content.                                                                                                           |               |
| `font`           | Font family or URL.                                                                                                                | `undefined`   |
| `fontSize`       | Font size.                                                                                                                         | `1`           |
| `color`          | Text color.                                                                                                                        | `'black'`     |
| `fontWeight`     | Font weight.                                                                                                                       | `'normal'`    |
| `fontStyle`      | Font style.                                                                                                                        | `'normal'`    |
| `maxWidth`       | Maximum width of the text block.                                                                                                   | `undefined`   |
| `lineHeight`     | Line height.                                                                                                                       | `1`           |
| `letterSpacing`  | Letter spacing.                                                                                                                    | `0`           |
| `textAlign`      | Text alignment.                                                                                                                    | `'left'`      |
| `anchorX`        | Horizontal anchor point. Can be `'left'`, `'center'`, `'right'`, or a number between 0 and 1.                                      | `'center'`    |
| `anchorY`        | Vertical anchor point. Can be `'top'`, `'top-baseline'`, `'middle'`, `'bottom-baseline'`, `'bottom'`, or a number between 0 and 1. | `'middle'`    |
| `clipRect`       | Clip rectangle.                                                                                                                    | `undefined`   |
| `depthOffset`    | Depth offset.                                                                                                                      | `0`           |
| `direction`      | Text direction. Can be `'auto'`, `'ltr'`, or `'rtl'`.                                                                              | `'auto'`      |
| `overflowWrap`   | Overflow wrap. Can be `'normal'` or `'break-word'`.                                                                                | `'normal'`    |
| `whiteSpace`     | White space. Can be `'normal'` or `'nowrap'`.                                                                                      | `'normal'`    |
| `outlineWidth`   | Outline width.                                                                                                                     | `0`           |
| `outlineOffsetX` | Outline X offset.                                                                                                                  | `0`           |
| `outlineOffsetY` | Outline Y offset.                                                                                                                  | `0`           |
| `outlineBlur`    | Outline blur.                                                                                                                      | `0`           |
| `outlineColor`   | Outline color.                                                                                                                     | `'black'`     |
| `outlineOpacity` | Outline opacity.                                                                                                                   | `1`           |
| `strokeWidth`    | Stroke width.                                                                                                                      | `0`           |
| `strokeColor`    | Stroke color.                                                                                                                      | `'black'`     |
| `strokeOpacity`  | Stroke opacity.                                                                                                                    | `1`           |
| `fillOpacity`    | Fill opacity.                                                                                                                      | `1`           |
| `sdfGlyphSize`   | SDF glyph size.                                                                                                                    | `64`          |
| `debugSDF`       | Debug SDF.                                                                                                                         | `false`       |

```html
<ngts-text text="Hello, World!" />
```

## NgtsText3D

Renders 3D text using ThreeJS's TextGeometry.

This component renders 3D text using TextGeometry. It requires fonts in JSON format generated through typeface.json.

### Object Inputs (NgtsText3DOptions)

| Property         | Description              | Default Value |
| ---------------- | ------------------------ | ------------- |
| `text`           | (Required) Text content. |               |
| `font`           | Font family or URL.      | `undefined`   |
| `size`           | Font size.               | `1`           |
| `height`         | Text height.             | `0.2`         |
| `curveSegments`  | Curve segments.          | `8`           |
| `bevelEnabled`   | Enable bevel.            | `false`       |
| `bevelThickness` | Bevel thickness.         | `0.1`         |
| `bevelSize`      | Bevel size.              | `0.01`        |
| `bevelOffset`    | Bevel offset.            | `0`           |
| `bevelSegments`  | Bevel segments.          | `4`           |
| `smooth`         | Smoothness level.        | `undefined`   |

```html
<ngts-text-3d text="Hello, World!" [options]="{ font: 'path/to/font.json' }" />
```

## NgtsLine

Renders a `THREE.Line2` or `THREE.LineSegments2` (depending on the value of `segments`).

### Object Inputs (NgtsLineOptions)

| Property       | Description                                                  | Default Value |
| -------------- | ------------------------------------------------------------ | ------------- |
| `points`       | (Required) Array of points.                                  |               |
| `color`        | Line color.                                                  | `'black'`     |
| `linewidth`    | Line width.                                                  | `1`           |
| `segments`     | Whether to render as `THREE.Line2` or `THREE.LineSegments2`. | `false`       |
| `dashed`       | Whether the line is dashed.                                  | `false`       |
| `vertexColors` | Vertex colors.                                               | undefined     |

```html
<ngts-line [points]="[[0, 0, 0], [1, 1, 1]]" />
```

## NgtsQuadraticBezierLine

Renders a `THREE.Line2` using `THREE.QuadraticBezierCurve3` for interpolation.

### Object Inputs (NgtsQuadraticBezierLineOptions)

| Property  | Description             | Default Value |
| --------- | ----------------------- | ------------- |
| `start`   | (Required) Start point. |               |
| `end`     | (Required) End point.   |               |
| `mid`     | Mid point.              |               |
| `options` | Line options.           | `{}`          |

```html
<ngts-quadratic-bezier-line [start]="[0, 0, 0]" [end]="[1, 1, 1]" />
```

## NgtsCubicBezierLine

Renders a `THREE.Line2` using `THREE.CubicBezierCurve3` for interpolation.

### Object Inputs (NgtsCubicBezierLineOptions)

| Property  | Description             | Default Value |
| --------- | ----------------------- | ------------- |
| `start`   | (Required) Start point. |               |
| `end`     | (Required) End point.   |               |
| `midA`    | (Required) Mid point 1. |               |
| `midB`    | (Required) Mid point 2. |               |
| `options` | Line options.           | `{}`          |

```html
<ngts-cubic-bezier-line [start]="[0, 0, 0]" [end]="[1, 1, 1]" [midA]="[0.5, 0.5, 0.5]" [midB]="[0.5, 0.5, 0.5]" />
```

## NgtsCatmullRomLine

Renders a `THREE.Line2` using `THREE.CatmullRomCurve3` for interpolation.

### Object Inputs (NgtsCatmullRomLineOptions)

| Property    | Description                                                            | Default Value   |
| ----------- | ---------------------------------------------------------------------- | --------------- |
| `points`    | (Required) Array of points.                                            |                 |
| `closed`    | Whether the curve is closed.                                           | `false`         |
| `curveType` | Type of curve. Can be `'centripetal'`, `'chordal'`, or `'catmullrom'`. | `'centripetal'` |
| `tension`   | Tension of the curve.                                                  | `0.5`           |
| `options`   | Line options.                                                          | `{}`            |

```html
<ngts-catmull-rom-line [points]="[[0, 0, 0], [1, 1, 1]]" />
```

## NgtsEdges

Abstracts [THREE.EdgesGeometry](https://threejs.org/docs/#api/en/geometries/EdgesGeometry). It pulls the geometry automatically from its parent, optionally you can ungroup it and give it a `geometry` prop. You can give it children, for instance a custom material. `NgtsEdges` is based on `NgtsLine` and supports all of its options.

### Object Inputs (NgtsEdgesOptions)

| Property    | Description                                                             | Default Value |
| ----------- | ----------------------------------------------------------------------- | ------------- |
| `geometry`  | Geometry to use for the edges.                                          | `undefined`   |
| `threshold` | Display edges only when the angle between two faces exceeds this value. | `15`          |

```html
<ngt-mesh>
	<ngt-box-geometry />
	<ngt-mesh-basic-material />
	<ngts-edges [options]="{ threshold: 15, scale: 1.1, color: 'white', linewidth: 4 }" />
</ngt-mesh>
```

## NgtsPrismGeometry

Abstracts [THREE.ExtrudeGeometry](https://threejs.org/docs/#api/en/geometries/ExtrudeGeometry) to create a prism geometry.

### Object Inputs (NgtsPrismGeometryOptions)

| Property   | Description                  | Default Value |
| ---------- | ---------------------------- | ------------- |
| `vertices` | (Required) Array of Vector2. |               |

```html
<ngt-mesh>
	<ngts-prism-geometry [vertices]="[[0, 0], [1, 0], [1, 1], [0, 1]]" />
	<ngt-mesh-basic-material />
</ngt-mesh>
```

## NgtsGradientTexture

A declarative `THREE.Texture` which attaches to "map" by default. You can use this to create gradient backgrounds.

### Object Inputs (NgtsGradientTextureOptions)

| Property            | Description                                             | Default Value |
| ------------------- | ------------------------------------------------------- | ------------- |
| `stops`             | Gradient stops array.                                   | required      |
| `colors`            | Gradient colors array. Must be the same size as `stops` | required      |
| `type`              | Gradient type. Can be `'linear'` or `'radial'`.         | `'linear'`    |
| `size`              | Texture size.                                           | `1024`        |
| `width`             | Texture width.                                          | `16`          |
| `innerCircleRadius` | Inner circle radius for radial gradients.               | `0`           |
| `outerCircleRadius` | Outer circle radius for radial gradients.               | `auto`        |

```html
<ngt-mesh-basic-material>
	<ngts-gradient-texture [stops]="[0, 0.5, 1]" [colors]="['red', 'green', 'blue']" />
</ngt-mesh-basic-material>
```

## `injectHelper`

A custom inject function to add helpers to existing nodes in the scene. It handles removal of the helper on destroy and auto-updates it by default.

```ts
class MyCmp {
	mesh = viewChild.required<ElementRef<Mesh>>('mesh');
	helper = injectHelper(this.mesh, () => BoxHelper, { args: ['cyan'] });
}
```

### `NgtsHelper`

A declarative way to add helpers to existing nodes in the scene. It handles removal of the helper on destroy and auto-updates it by default.

```html
<ngt-mesh>
	<ngts-helper [type]="BoxHelper" [options]="['cyan']" />
</ngt-mesh>
```
