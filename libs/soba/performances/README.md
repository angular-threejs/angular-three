# `angular-three-soba/performances`

This secondary entry point provides components for optimizing rendering performance in your Three.js scenes.

## Dependencies

```bash
npm install three-mesh-bvh
# yarn add three-mesh-bvh
# pnpm add three-mesh-bvh
```

## TOC

- [NgtsAdaptiveDpr](#ngtsadaptivedpr)
- [NgtsAdaptiveEvents](#ngtsadaptiveevents)
- [NgtsBVH](#ngtsbvh)
- [NgtsDetailed](#ngtsdetailed)
- [NgtsInstances](#ngtsinstances)
- [NgtsSegments](#ngtssegments)
- [NgtsPoints](#ngtspoints)

## NgtsAdaptiveDpr

A directive that dynamically adjusts the device pixel ratio (DPR) based on performance metrics. When performance degrades, DPR is reduced; when performance recovers, DPR is restored.

### Inputs

| Input       | Description                                          | Default Value |
| ----------- | ---------------------------------------------------- | ------------- |
| `pixelated` | Applies pixelated image rendering during reduced DPR | `false`       |

```html
<ngts-adaptive-dpr />
<!-- With pixelated rendering during low performance -->
<ngts-adaptive-dpr [pixelated]="true" />
```

## NgtsAdaptiveEvents

A directive that dynamically toggles event handling based on performance metrics. When performance drops, event handling is disabled to reduce computational overhead.

```html
<ngts-adaptive-events />
```

## NgtsBVH

Applies Bounding Volume Hierarchy (BVH) acceleration to child meshes for significantly faster raycasting performance. Uses `three-mesh-bvh` under the hood.

### Object Input (`NgtsBVHOptions`)

| Property         | Description                                           | Default Value |
| ---------------- | ----------------------------------------------------- | ------------- |
| `enabled`        | Whether BVH acceleration is enabled                   | `true`        |
| `firstHitOnly`   | Use raycastFirst for faster single-hit detection      | `false`       |
| `strategy`       | Split strategy for BVH construction (SAH recommended) | `SAH`         |
| `verbose`        | Print warnings during tree construction               | `false`       |
| `setBoundingBox` | Set geometry bounding box after BVH construction      | `true`        |
| `maxDepth`       | Maximum tree depth                                    | `40`          |
| `maxLeafTris`    | Target number of triangles per leaf node              | `10`          |
| `indirect`       | Use separate buffer for BVH structure (experimental)  | `false`       |

```html
<ngts-bvh [options]="{ firstHitOnly: true }">
	<ngt-mesh>
		<ngt-buffer-geometry />
		<ngt-mesh-standard-material />
	</ngt-mesh>
</ngts-bvh>
```

## NgtsDetailed

Implements Level of Detail (LOD) rendering. Automatically switches between different detail levels of child objects based on camera distance.

### Inputs

| Input       | Description                                    |
| ----------- | ---------------------------------------------- |
| `distances` | Required. Array of distance thresholds for LOD |

### Object Input (`NgtsDetailedOptions`)

| Property     | Description                                       | Default Value |
| ------------ | ------------------------------------------------- | ------------- |
| `hysteresis` | Prevents rapid switching near distance thresholds | `0`           |

```html
<ngts-detailed [distances]="[0, 50, 100]">
	<ngt-mesh><!-- High detail --></ngt-mesh>
	<ngt-mesh><!-- Medium detail --></ngt-mesh>
	<ngt-mesh><!-- Low detail --></ngt-mesh>
</ngts-detailed>
```

## NgtsInstances

Efficiently renders many instances of the same geometry and material using a single draw call via `THREE.InstancedMesh`.

### Object Input (`NgtsInstancesOptions`)

| Property | Description                                                   | Default Value |
| -------- | ------------------------------------------------------------- | ------------- |
| `limit`  | Maximum number of instances                                   | `1000`        |
| `range`  | Limits the number of visible instances                        | `undefined`   |
| `frames` | Number of frames to update transforms (Infinity = continuous) | `Infinity`    |

### NgtsInstance

A single instance within `NgtsInstances`. Can be individually positioned, rotated, scaled, and colored.

```html
<ngts-instances [options]="{ limit: 100 }">
	<ngt-box-geometry />
	<ngt-mesh-standard-material />
	@for (i of [0, 1, 2, 3, 4]; track i) {
	<ngts-instance [options]="{ position: [i * 2, 0, 0], color: 'red' }" />
	}
</ngts-instances>
```

## NgtsSegments

Efficiently renders multiple line segments using a single draw call via `Line2` from three-stdlib.

### Object Input (`NgtsSegmentsOptions`)

| Property    | Description                | Default Value |
| ----------- | -------------------------- | ------------- |
| `limit`     | Maximum number of segments | `1000`        |
| `lineWidth` | Width of the line segments | `1.0`         |

### NgtsSegment

A single line segment within `NgtsSegments`.

| Input   | Description                      |
| ------- | -------------------------------- |
| `start` | Required. Starting point [x,y,z] |
| `end`   | Required. Ending point [x,y,z]   |
| `color` | Segment color                    |

```html
<ngts-segments [options]="{ lineWidth: 2, limit: 100 }">
	<ngts-segment [start]="[0, 0, 0]" [end]="[1, 1, 1]" [color]="'red'" />
	<ngts-segment [start]="[1, 1, 1]" [end]="[2, 0, 0]" [color]="'blue'" />
</ngts-segments>
```

## NgtsPoints

Components for efficiently rendering point clouds with per-point control.

### NgtsPointsInstances

Renders many individual points with per-point control over position, color, and size.

#### Object Input (`NgtsPointsInstancesOptions`)

| Property | Description                         | Default Value |
| -------- | ----------------------------------- | ------------- |
| `limit`  | Maximum number of points            | `1000`        |
| `range`  | Limits the number of visible points | `undefined`   |

### NgtsPoint

A single point within `NgtsPointsInstances`. Supports position, color, and size.

```html
<ngts-points-instances [options]="{ limit: 100 }">
	<ngt-points-material [size]="0.1" [vertexColors]="true" />
	@for (i of [0, 1, 2, 3, 4]; track i) {
	<ngts-point [options]="{ position: [i * 2, 0, 0], color: 'red' }" />
	}
</ngts-points-instances>
```

### NgtsPointsBuffer

Optimized for large arrays of pre-computed point data. Ideal for particle systems or data visualizations.

| Input       | Description                               | Default Value |
| ----------- | ----------------------------------------- | ------------- |
| `positions` | Required. Float32Array of point positions |               |
| `colors`    | Optional Float32Array of RGB colors       | `undefined`   |
| `sizes`     | Optional Float32Array of point sizes      | `undefined`   |
| `stride`    | Components per position (2 or 3)          | `3`           |

```html
<ngts-points-buffer [positions]="positionsArray" [colors]="colorsArray" [sizes]="sizesArray">
	<ngt-points-material [vertexColors]="true" />
</ngts-points-buffer>
```
