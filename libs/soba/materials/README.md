# `angular-three-soba/materials`

This secondary entry point includes a variety of materials for customizing the appearance of your 3D objects.

| Package                        | Description                                                                                                   |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| `three-custom-shader-material` | Required by `NgtsCustomShaderMaterial`. A custom shader material that can be used to create custom materials. |
| `@pmndrs/vanilla`              | A list of vanilla THREE.js implementations of various things.                                                 |
| `three-mesh-bvh`               | Required by `NgtsMeshRefractionMaterial`. A BVH implementation for three.js.                                  |

```bash
npm install three-custom-shader-material @pmndrs/vanilla three-mesh-bvh
# yarn add three-custom-shader-material @pmndrs/vanilla three-mesh-bvh
# pnpm add three-custom-shader-material @pmndrs/vanilla three-mesh-bvh
```

## TOC

- [NgtsCustomShaderMaterial](#ngtscustomshadermaterial)
- [NgtsMeshDistortMaterial](#ngtsmeshdistortmaterial)
- [NgtsMeshPortalMaterial](#ngtsmeshportalmaterial)
- [NgtsMeshReflectorMaterial](#ngtsmeshreflectormaterial)
- [NgtsMeshRefractionMaterial](#ngtsmeshrefractionmaterial)
- [NgtsMeshTransmissionMaterial](#ngtsmeshtransmissionmaterial)
- [NgtsMeshWobbleMaterial](#ngtsmeshwobblematerial)
- [NgtsPointMaterial](#ngtspointmaterial)

## NgtsCustomShaderMaterial

A component that allows you to create custom shader materials using the `three-custom-shader-material` library. It provides a flexible way to define your own shaders and control the rendering of your objects.

### Inputs

| Property       | Description                                                                                               | Default Value |
| -------------- | --------------------------------------------------------------------------------------------------------- | ------------- |
| `baseMaterial` | Required. The base material to extend (material instance, class, or ElementRef).                          | -             |
| `attach`       | How to attach the material to its parent object.                                                          | `'material'`  |
| `options`      | Configuration options including `vertexShader`, `fragmentShader`, `uniforms`, `cacheKey`, and parameters. | `{}`          |

### Object Input (`options`)

| Property         | Description                                       | Default Value |
| ---------------- | ------------------------------------------------- | ------------- |
| `vertexShader`   | The vertex shader code.                           | `undefined`   |
| `fragmentShader` | The fragment shader code.                         | `undefined`   |
| `uniforms`       | An object containing the uniforms for the shader. | `undefined`   |
| `cacheKey`       | Cache key for shader compilation.                 | `undefined`   |

```html
<ngt-points>
	<ngt-icosahedron-geometry *args="[1, 32]" />
	<ngts-custom-shader-material
		[baseMaterial]="PointsMaterial"
		[options]="{
      vertexShader: myVertexShader,
      fragmentShader: myFragmentShader,
      uniforms: { time: { value: 0 } }
    }"
	/>
</ngt-points>
```

## NgtsMeshDistortMaterial

A material that applies animated noise-based distortion to mesh surfaces. Extends MeshPhysicalMaterial with vertex displacement using simplex noise.

### Object Input (`NgtsMeshDistortMaterialOptions`)

| Property | Description                                    | Default Value |
| -------- | ---------------------------------------------- | ------------- |
| `speed`  | Animation speed multiplier for the distortion. | `1`           |
| `factor` | Distortion intensity factor.                   | `undefined`   |

Also accepts all `MeshPhysicalMaterial` properties.

```html
<ngt-mesh>
	<ngt-sphere-geometry />
	<ngts-mesh-distort-material [options]="{ speed: 2, factor: 0.5, color: 'hotpink' }" />
</ngt-mesh>
```

## NgtsMeshPortalMaterial

A material that creates a portal effect, rendering a separate scene inside a mesh. Supports smooth blending between the portal scene and the world scene, edge blur, and automatic visibility culling.

### Object Input (`NgtsMeshPortalMaterialOptions`)

| Property         | Description                                                                        | Default Value |
| ---------------- | ---------------------------------------------------------------------------------- | ------------- |
| `blend`          | Mix the portal's own scene with the world scene. 0 = world, 0.5 = both, 1 = portal | `0`           |
| `blur`           | Edge fade blur using signed distance field (SDF).                                  | `0`           |
| `resolution`     | SDF resolution. Smaller values result in faster start-up time.                     | `512`         |
| `worldUnits`     | Whether portal contents use world-space coordinates.                               | `false`       |
| `eventPriority`  | Event priority for the portal's raycasting.                                        | `0`           |
| `renderPriority` | Render priority for the portal scene.                                              | `0`           |
| `events`         | Whether to enable events inside the portal.                                        | `false`       |

```html
<ngt-mesh>
	<ngt-plane-geometry />
	<ngts-mesh-portal-material [options]="{ blend: 1, blur: 0.5 }">
		<ng-template>
			<!-- Portal scene content -->
			<ngt-mesh>
				<ngt-box-geometry />
				<ngt-mesh-basic-material color="red" />
			</ngt-mesh>
		</ng-template>
	</ngts-mesh-portal-material>
</ngt-mesh>
```

## NgtsMeshReflectorMaterial

A material that creates realistic reflections on a planar surface. Supports blur, depth-based effects, distortion, and mirror-like reflections. The parent mesh should be a flat plane for best results.

### Object Input (`NgtsMeshReflectorMaterialOptions`)

| Property               | Description                                      | Default Value |
| ---------------------- | ------------------------------------------------ | ------------- |
| `resolution`           | Resolution of the reflection render target.      | `256`         |
| `mixBlur`              | Amount of blur mixing applied to the reflection. | `0`           |
| `mixStrength`          | Strength of the reflection mix.                  | `1`           |
| `blur`                 | Blur amount as `[x, y]` or a single value.       | `[0, 0]`      |
| `mirror`               | Mirror reflection intensity (0 = no, 1 = full).  | `0`           |
| `minDepthThreshold`    | Minimum depth threshold for depth-based effects. | `0.9`         |
| `maxDepthThreshold`    | Maximum depth threshold for depth-based effects. | `1`           |
| `depthScale`           | Scale factor for depth-based effects.            | `0`           |
| `depthToBlurRatioBias` | Bias ratio between depth and blur effects.       | `0.25`        |
| `distortion`           | Distortion intensity applied to the reflection.  | `1`           |
| `mixContrast`          | Contrast adjustment for the reflection mix.      | `1`           |
| `reflectorOffset`      | Offset of the reflector plane along its normal.  | `0`           |
| `distortionMap`        | Optional texture to apply distortion effects.    | `undefined`   |

Also accepts all `MeshStandardMaterial` properties.

```html
<ngt-mesh [rotation]="[-Math.PI / 2, 0, 0]">
	<ngt-plane-geometry *args="[10, 10]" />
	<ngts-mesh-reflector-material
		[options]="{
      blur: [300, 100],
      resolution: 1024,
      mixBlur: 1,
      mixStrength: 50,
      mirror: 0.5,
      color: '#a0a0a0'
    }"
	/>
</ngt-mesh>
```

## NgtsMeshRefractionMaterial

A material that simulates realistic light refraction through transparent objects. Uses ray tracing with BVH acceleration for accurate light bending effects. Ideal for diamonds, crystals, glass, and other transparent materials.

### Inputs

| Property  | Description                                             | Default Value |
| --------- | ------------------------------------------------------- | ------------- |
| `envMap`  | Required. The environment map (CubeTexture or Texture). | -             |
| `attach`  | How to attach the material to its parent object.        | `'material'`  |
| `options` | Configuration options for the refraction material.      | See below     |

### Object Input (`NgtsMeshRefractionMaterialOptions`)

| Property             | Description                                                                     | Default Value |
| -------------------- | ------------------------------------------------------------------------------- | ------------- |
| `bounces`            | The number of ray-cast bounces.                                                 | `2`           |
| `ior`                | The refraction index. Diamond is 2.4, glass is 1.5.                             | `2.4`         |
| `fresnel`            | The Fresnel effect intensity (strip light reflections).                         | `0`           |
| `aberrationStrength` | The RGB chromatic aberration shift intensity.                                   | `0`           |
| `color`              | The color of the material.                                                      | `'white'`     |
| `fastChroma`         | Whether to use fewer ray casts for the RGB shift sacrificing physical accuracy. | `true`        |

If you want it to reflect other objects in the scene you best pair it with a cube-camera.

```html
<ngts-cube-camera>
	<ngt-mesh *cameraContent="let texture">
		<ngts-mesh-refraction-material [envMap]="texture()" />
	</ngt-mesh>
</ngts-cube-camera>
```

Otherwise, just pass it an environment map.

```html
<!-- texture = injectLoader(() => RGBELoader, () => 'path/to/texture.hdr') -->
<ngt-mesh>
	<ngts-mesh-refraction-material [envMap]="texture()" />
</ngt-mesh>
```

## NgtsMeshTransmissionMaterial

A physically-based transmission material for realistic glass, water, and other transparent surfaces. Extends MeshPhysicalMaterial with additional features like backside rendering, temporal reprojection, and anisotropic blur.

### Object Input (`NgtsMeshTransmissionMaterialOptions`)

| Property                  | Description                                                               | Default Value |
| ------------------------- | ------------------------------------------------------------------------- | ------------- |
| `transmission`            | The transmission factor of the material.                                  | `1`           |
| `thickness`               | The thickness of the material.                                            | `0`           |
| `backsideThickness`       | The thickness of the backside of the material.                            | `0`           |
| `transmissionSampler`     | Whether to use the Three.js transmission sampler texture.                 | `false`       |
| `backside`                | Whether to render the backside of the material for more accurate results. | `false`       |
| `backsideEnvMapIntensity` | The environment map intensity of the backside of the material.            | `1`           |
| `resolution`              | The resolution of the local buffer.                                       | `undefined`   |
| `backsideResolution`      | The resolution of the local buffer for backfaces.                         | `undefined`   |
| `samples`                 | The number of refraction samples.                                         | `10`          |
| `background`              | The background of the buffer scene (texture, color, or null).             | `undefined`   |
| `anisotropicBlur`         | Anisotropic blur amount for the transmission effect.                      | `undefined`   |
| `buffer`                  | Custom buffer texture. If not provided, an internal FBO is used.          | `undefined`   |

Also accepts all `MeshPhysicalMaterial` properties like `roughness`, `chromaticAberration`, `distortion`, `distortionScale`, `temporalDistortion`, etc.

```html
<ngt-mesh>
	<ngt-sphere-geometry />
	<ngts-mesh-transmission-material
		[options]="{
      backside: true,
      thickness: 0.5,
      chromaticAberration: 0.05,
      anisotropicBlur: 0.1
    }"
	/>
</ngt-mesh>
```

## NgtsMeshWobbleMaterial

A material that applies animated sine-wave wobble distortion to mesh surfaces. Extends MeshStandardMaterial with vertex displacement for organic, jelly-like motion.

### Object Input (`NgtsMeshWobbleMaterialOptions`)

| Property | Description                                | Default Value |
| -------- | ------------------------------------------ | ------------- |
| `speed`  | Animation speed multiplier for the wobble. | `1`           |
| `factor` | The strength of the wobble effect.         | `undefined`   |

Also accepts all `MeshStandardMaterial` properties.

```html
<ngt-mesh>
	<ngt-torus-geometry />
	<ngts-mesh-wobble-material [options]="{ speed: 2, factor: 0.6, color: 'cyan' }" />
</ngt-mesh>
```

## NgtsPointMaterial

A material for rendering point clouds with consistent size regardless of distance. Extends THREE.PointsMaterial with additional shader modifications for improved point rendering with size attenuation control.

### Object Input

Accepts all `THREE.PointsMaterialParameters` properties like `size`, `color`, `sizeAttenuation`, `map`, etc.

```html
<ngt-points>
	<ngt-buffer-geometry>
		<ngt-buffer-attribute attach="attributes.position" [args]="[positions, 3]" />
	</ngt-buffer-geometry>
	<ngts-point-material [options]="{ size: 0.1, color: 'orange', sizeAttenuation: true }" />
</ngt-points>
```
