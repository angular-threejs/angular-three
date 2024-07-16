# `angular-three-soba/materials`

This secondary entry point includes a variety of materials for customizing the appearance of your 3D objects.

| Package                        | Description                                                                                                   |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| `three-custom-shader-material` | Required by `NgtsCustomShaderMaterial`. A custom shader material that can be used to create custom materials. |
| `@pmndrs/vanilla`              | A list of vanilla THREE.js implementations of various things.                                                 |
| `three-mesh-bvh`               | Required by `NgtsMeshRefractionMaterial`. A BVH implementation for three.js.                                  |

```bash
npm install three-custom-shader-material @pmndrs/vanilla
# yarn add three-custom-shader-material @pmndrs/vanilla three-mesh-bvh
# pnpm add three-custom-shader-material @pmndrs/vanilla three-mesh-bvh
```

## TOC

- [NgtsCustomShaderMaterial](#ngtscustomshadermaterial)
- [NgtsMeshReflectorMaterial](#ngtsmeshreflectormaterial)
- [NgtsMeshTransmissionMaterial](#ngtsmeshtransmissionmaterial)
- [NgtsMeshWobbleMaterial](#ngtsmeshwobblematerial)
- [NgtsMeshRefractionMaterial](#ngtsmeshrefractionmaterial)

## NgtsCustomShaderMaterial

A component that allows you to create custom shader materials using the `three-custom-shader-material` library. It provides a flexible way to define your own shaders and control the rendering of your objects.

### Object Input (`NgtsCustomShaderMaterialOptions`)

| Property         | Description                                                        | Default Value |
| ---------------- | ------------------------------------------------------------------ | ------------- |
| `baseMaterial`   | Required. The base material to use for the custom shader material. | `undefined`   |
| `vertexShader`   | The vertex shader code.                                            | `undefined`   |
| `fragmentShader` | The fragment shader code.                                          | `undefined`   |
| `uniforms`       | An object containing the uniforms for the shader.                  | `{}`          |
| `defines`        | An object containing the defines for the shader.                   | `{}`          |
| `transparent`    | Whether the material is transparent.                               | `false`       |
| `wireframe`      | Whether to render the material in wireframe mode.                  | `false`       |
| `depthTest`      | Whether to enable depth testing.                                   | `true`        |
| `depthWrite`     | Whether to write to the depth buffer.                              | `true`        |
| `clipping`       | Whether to enable clipping.                                        | `true`        |
| `extensions`     | An object containing extensions for the shader.                    | `{}`          |

```html
<ngt-group>
	<ngt-points>
		<ngt-icosahedron-geometry *args="[1, 32]" />
		<ngts-custom-shader-material [baseMaterial]="PointsMaterial" [options]="options()" />
	</ngt-points>
</ngt-group>
```

## NgtsMeshReflectorMaterial

A component that creates a reflective material with optional blur for your meshes. It is based on the `MeshReflectorMaterial` class from the `@pmndrs/vanilla` library.

### Object Input (`NgtsMeshReflectorMaterialOptions`)

| Property             | Description                          | Default Value |
| -------------------- | ------------------------------------ | ------------- |
| `color`              | The color of the material.           | `0xffffff`    |
| `reflectivity`       | The reflectivity of the material.    | `1`           |
| `roughness`          | The roughness of the material.       | `0.5`         |
| `metalness`          | The metalness of the material.       | `0.5`         |
| `aoMapIntensity`     | The ambient occlusion map intensity. | `1`           |
| `envMapIntensity`    | The environment map intensity.       | `1`           |
| `normalMapIntensity` | The normal map intensity.            | `1`           |
| `displacementScale`  | The displacement scale.              | `1`           |

```html
<ngt-group>
	<ngt-box-geometry *args="[1, 1, 1]" />
	<ngts-mesh-reflector-material [options]="options()" />
</ngt-group>
```

## NgtsMeshTransmissionMaterial

A component that creates a transmission material with effects like chromatic aberration and roughness blur. It is based on the `MeshTransmissionMaterial` class from the `@pmndrs/vanilla` library.

### Object Input (`NgtsMeshTransmissionMaterialOptions`)

| Property                  | Description                                                    | Default Value |
| ------------------------- | -------------------------------------------------------------- | ------------- |
| `transmission`            | The transmission factor of the material.                       | `1`           |
| `thickness`               | The thickness of the material.                                 | `0`           |
| `roughness`               | The roughness of the material.                                 | `0`           |
| `chromaticAberration`     | The amount of chromatic aberration.                            | `0.06`        |
| `anisotropicBlur`         | The amount of anisotropic blur.                                | `0.1`         |
| `distortion`              | The amount of distortion.                                      | `0`           |
| `distortionScale`         | The scale of the distortion.                                   | `0.3`         |
| `temporalDistortion`      | The amount of temporal distortion.                             | `0.5`         |
| `transmissionSampler`     | Whether to use the three.js transmission sampler texture.      | `false`       |
| `backside`                | Whether to render the backside of the material.                | `false`       |
| `backsideThickness`       | The thickness of the backside of the material.                 | `0`           |
| `backsideEnvMapIntensity` | The environment map intensity of the backside of the material. | `1`           |
| `resolution`              | The resolution of the local buffer.                            | `undefined`   |
| `backsideResolution`      | The resolution of the local buffer for backfaces.              | `undefined`   |
| `samples`                 | The number of refraction samples.                              | `10`          |
| `background`              | The background of the buffer scene.                            | `null`        |

```html
<ngt-group>
	<ngt-box-geometry *args="[1, 1, 1]" />
	<ngts-mesh-transmission-material [options]="options()" />
</ngt-group>
```

## NgtsMeshWobbleMaterial

A component that creates a material that makes your geometry wobble and wave around.

### Object Input (`NgtsMeshWobbleMaterialOptions`)

| Property | Description                        | Default Value |
| -------- | ---------------------------------- | ------------- |
| `speed`  | The speed of the wobble effect.    | `1`           |
| `factor` | The strength of the wobble effect. | `0.6`         |

```html
<ngt-group>
	<ngt-box-geometry *args="[1, 1, 1]" />
	<ngts-mesh-wobble-material [options]="options()" />
</ngt-group>
```

## NgtsMeshRefractionMaterial

A convincing Glass/Diamond refraction material.

### Object Input (`NgtsMeshRefractionMaterialOptions`)

| Property             | Description                                                                     | Default Value |
| -------------------- | ------------------------------------------------------------------------------- | ------------- |
| `envMap`             | (Required) The environment map.                                                 |               |
| `bounces`            | The number of ray-cast bounces.                                                 | `2`           |
| `ior`                | The refraction index.                                                           | `2.4`         |
| `fresnel`            | The Fresnel (strip light).                                                      | `0`           |
| `aberrationStrength` | The RGB shift intensity.                                                        | `0`           |
| `color`              | The color of the material.                                                      | `0xffffff`    |
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
