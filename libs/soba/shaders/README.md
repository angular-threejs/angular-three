# `angular-three-soba/shaders`

This secondary entry point provides specialized shader materials for advanced visual effects.

## Dependencies

```bash
npm install three-mesh-bvh
# yarn add three-mesh-bvh
# pnpm add three-mesh-bvh
```

## TOC

- [MeshRefractionMaterial](#meshrefractionmaterial)
- [GridMaterial](#gridmaterial)
- [PointMaterial](#pointmaterial)

## MeshRefractionMaterial

A shader material that simulates realistic light refraction through transparent objects like glass or diamonds. Uses BVH for accurate ray tracing and supports chromatic aberration.

### Usage

```typescript
import { extend } from 'angular-three';
import { MeshRefractionMaterial } from 'angular-three-soba/shaders';

extend({ MeshRefractionMaterial });
```

### Options (`MeshRefractionMaterialOptions`)

| Property             | Description                                                       | Default Value |
| -------------------- | ----------------------------------------------------------------- | ------------- |
| `envMap`             | Environment map for reflections/refractions                       | `null`        |
| `bounces`            | Number of internal light bounces                                  | `3`           |
| `ior`                | Index of refraction (air=1.0, water=1.33, glass=1.5, diamond=2.4) | `2.4`         |
| `correctMips`        | Whether to correct mip levels for smoother sampling               | `true`        |
| `aberrationStrength` | Chromatic aberration intensity (0 to disable)                     | `0.01`        |
| `fresnel`            | Fresnel reflection intensity at grazing angles                    | `0`           |
| `color`              | Base color tint                                                   | `'white'`     |
| `opacity`            | Material opacity                                                  | `1`           |

```html
<ngt-mesh>
	<ngt-icosahedron-geometry />
	<ngt-mesh-refraction-material [envMap]="envMap" [ior]="2.4" [bounces]="3" [aberrationStrength]="0.01" />
</ngt-mesh>
```

## GridMaterial

A shader material that renders an infinite grid with customizable cells and sections. Supports fading, camera following, and dual-layer grid lines.

### Usage

```typescript
import { extend } from 'angular-three';
import { GridMaterial } from 'angular-three-soba/shaders';

extend({ GridMaterial });
```

### Options (`GridMaterialOptions`)

| Property           | Description                                | Default Value    |
| ------------------ | ------------------------------------------ | ---------------- |
| `cellSize`         | Size of individual grid cells              | `0.5`            |
| `cellThickness`    | Thickness of cell grid lines               | `0.5`            |
| `cellColor`        | Color of the cell grid lines               | `'black'`        |
| `sectionSize`      | Size of section divisions (larger squares) | `1`              |
| `sectionThickness` | Thickness of section grid lines            | `1`              |
| `sectionColor`     | Color of the section grid lines            | `'#2080ff'`      |
| `followCamera`     | Whether the grid follows camera position   | `false`          |
| `infiniteGrid`     | Display grid infinitely to the horizon     | `false`          |
| `fadeDistance`     | Distance at which the grid starts to fade  | `100`            |
| `fadeStrength`     | Strength of the fade effect                | `1`              |
| `fadeFrom`         | Fade origin (1=camera, 0=origin)           | `1`              |
| `side`             | Which side of the material to render       | `THREE.BackSide` |

```html
<ngt-mesh [rotation]="[-Math.PI / 2, 0, 0]">
	<ngt-plane-geometry *args="[100, 100]" />
	<ngt-grid-material [cellSize]="0.5" [sectionSize]="1" [fadeDistance]="100" [infiniteGrid]="true" transparent />
</ngt-mesh>
```

## PointMaterial

An enhanced PointsMaterial that renders points as smooth, anti-aliased circles instead of the default square points.

### Usage

```typescript
import { extend } from 'angular-three';
import { PointMaterial } from 'angular-three-soba/shaders';

extend({ PointMaterial });
```

This material accepts all standard `THREE.PointsMaterialParameters` options.

```html
<ngt-points>
	<ngt-buffer-geometry />
	<ngt-point-material [size]="0.1" [color]="'red'" />
</ngt-points>
```
