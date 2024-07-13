# `angular-three-soba/abstractions`

This module provides abstract components and patterns for building reusable and composable 3D elements in Angular Three. It requires the following peer dependencies:

| Package             | Description                                  |
| ------------------- | -------------------------------------------- |
| `troika-three-text` | Required for using the `NgtsText` component. |

To install these dependencies, use one of the following commands:

```bash
npm install troika-three-text
# yarn add troika-three-text
# pnpm add troika-three-text
```

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
