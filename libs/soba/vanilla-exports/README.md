# `angular-three-soba/vanilla-exports`

This secondary entry point re-exports utilities and materials from `@pmndrs/vanilla` for use with Angular Three.

## Dependencies

```bash
npm install @pmndrs/vanilla
# yarn add @pmndrs/vanilla
# pnpm add @pmndrs/vanilla
```

## Exports

### Shader Utilities

| Export           | Description                                           |
| ---------------- | ----------------------------------------------------- |
| `shaderMaterial` | Factory function for creating custom shader materials |

### Materials

| Export                       | Description                                    |
| ---------------------------- | ---------------------------------------------- |
| `SpotLightMaterial`          | Material for volumetric spotlight effects      |
| `SoftShadowMaterial`         | Material for soft shadow rendering             |
| `CausticsMaterial`           | Material for caustics effects                  |
| `CausticsProjectionMaterial` | Material for projected caustics                |
| `MeshPortalMaterial`         | Material for portal effects with SDF support   |
| `MeshReflectorMaterial`      | Material for reflective surfaces with blur     |
| `MeshTransmissionMaterial`   | Material for glass-like transmission effects   |
| `MeshWobbleMaterial`         | Material that makes geometry wobble and wave   |
| `MeshDistortMaterial`        | Material with noise-based distortion effects   |
| `MeshDiscardMaterial`        | Material that discards fragments (for masking) |

### Effects & Helpers

| Export                | Description                           |
| --------------------- | ------------------------------------- |
| `BlurPass`            | Post-processing pass for blur effects |
| `CameraShake`         | Helper for camera shake effects       |
| `Fisheye`             | Fisheye lens effect                   |
| `Outlines`            | Outline rendering helper              |
| `ProgressiveLightMap` | Progressive lightmap generation       |
| `Sparkles`            | Particle sparkle effect               |
| `Splat`               | Gaussian splat rendering              |
| `SplatLoader`         | Loader for splat files                |
| `SpriteAnimator`      | Sprite sheet animation helper         |
| `Stars`               | Star field effect                     |
| `Trail`               | Trail/ribbon effect                   |

### Utilities

| Export                       | Description                          |
| ---------------------------- | ------------------------------------ |
| `createCausticsUpdate`       | Factory for caustics update function |
| `meshPortalMaterialApplySDF` | Apply SDF to portal material         |
| `CLOUD_URL`                  | Default URL for cloud textures       |

### Type Exports

| Export                           | Description                         |
| -------------------------------- | ----------------------------------- |
| `FisheyeProps`                   | Props interface for Fisheye         |
| `OutlinesProps`                  | Props interface for Outlines        |
| `SparklesProps`                  | Props interface for Sparkles        |
| `SpriteAnimatorProps`            | Props interface for SpriteAnimator  |
| `StarsProps`                     | Props interface for Stars           |
| `TrailProps`                     | Props interface for Trail           |
| `MeshDistortMaterialParameters`  | Parameters for MeshDistortMaterial  |
| `MeshWobbleMaterialParameters`   | Parameters for MeshWobbleMaterial   |
| `CausticsProjectionMaterialType` | Type for CausticsProjectionMaterial |

## Usage

### Creating Custom Shader Materials

```typescript
import { shaderMaterial } from 'angular-three-soba/vanilla-exports';
import * as THREE from 'three';

const MyCustomMaterial = shaderMaterial(
	{
		time: 0,
		color: new THREE.Color('red'),
	},
	// vertex shader
	`
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
	// fragment shader
	`
    uniform float time;
    uniform vec3 color;
    varying vec2 vUv;
    void main() {
      gl_FragColor = vec4(color, 1.0);
    }
  `,
);
```

### Using Pre-built Materials

```typescript
import { extend } from 'angular-three';
import { MeshWobbleMaterial, MeshDistortMaterial } from 'angular-three-soba/vanilla-exports';

extend({ MeshWobbleMaterial, MeshDistortMaterial });
```

```html
<ngt-mesh>
	<ngt-sphere-geometry />
	<ngt-mesh-wobble-material [speed]="1" [factor]="0.6" />
</ngt-mesh>
```

### Using Effects

```typescript
import { Stars, Sparkles, Trail } from 'angular-three-soba/vanilla-exports';

// These can be used directly with Three.js or wrapped in Angular components
```
