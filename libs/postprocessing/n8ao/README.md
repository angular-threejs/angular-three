# angular-three-postprocessing/n8ao

Secondary entry point of `angular-three-postprocessing`. It can be used by importing from `angular-three-postprocessing/n8ao`.

## Installation

This package requires `angular-three-postprocessing` and `n8ao` as peer dependencies.

```bash
npm install angular-three-postprocessing n8ao postprocessing
```

## NgtpN8AO

A high-quality screen-space ambient occlusion (SSAO) effect component. N8AO adds realistic shadowing to crevices, corners, and areas where objects meet, greatly enhancing the visual depth of 3D scenes.

### Basic Usage

```html
<ngtp-effect-composer>
	<ngtp-n8ao />
</ngtp-effect-composer>
```

### With Custom Options

```html
<ngtp-effect-composer>
	<ngtp-n8ao
		[options]="{
    intensity: 3,
    aoRadius: 2,
    aoSamples: 32
  }"
	/>
</ngtp-effect-composer>
```

### Using Quality Presets

```html
<ngtp-effect-composer>
	<ngtp-n8ao [options]="{ quality: 'high' }" />
</ngtp-effect-composer>
```

### Component Example

```typescript
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { NgtCanvas, extend } from 'angular-three';
import { NgtpEffectComposer } from 'angular-three-postprocessing';
import { NgtpN8AO } from 'angular-three-postprocessing/n8ao';
import * as THREE from 'three';

extend(THREE);

@Component({
	selector: 'app-scene',
	standalone: true,
	imports: [NgtpEffectComposer, NgtpN8AO],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	template: `
		<ngt-mesh>
			<ngt-box-geometry />
			<ngt-mesh-standard-material />
		</ngt-mesh>

		<ngtp-effect-composer>
			<ngtp-n8ao [options]="aoOptions" />
		</ngtp-effect-composer>
	`,
})
export class SceneComponent {
	aoOptions = {
		intensity: 4,
		aoRadius: 3,
		quality: 'medium' as const,
	};
}
```

## Options

### Quality Presets

| Preset          | Description                      |
| --------------- | -------------------------------- |
| `'performance'` | Fastest, lowest quality          |
| `'low'`         | Low quality, good performance    |
| `'medium'`      | Balanced quality and performance |
| `'high'`        | High quality, slower             |
| `'ultra'`       | Highest quality, most demanding  |

### All Options

| Option                   | Type                                                      | Default   | Description                                                                   |
| ------------------------ | --------------------------------------------------------- | --------- | ----------------------------------------------------------------------------- |
| `quality`                | `'performance' \| 'low' \| 'medium' \| 'high' \| 'ultra'` | -         | Quality preset (overrides individual settings)                                |
| `intensity`              | `number`                                                  | `5`       | Strength of the AO effect                                                     |
| `aoRadius`               | `number`                                                  | `5.0`     | Radius of the AO effect in world units                                        |
| `aoSamples`              | `number`                                                  | `16`      | Number of samples for AO calculation (higher = better quality)                |
| `aoTones`                | `number`                                                  | `0.0`     | Number of tones for AO gradient                                               |
| `distanceFalloff`        | `number`                                                  | `1.0`     | How quickly the AO effect falls off with distance                             |
| `color`                  | `ColorRepresentation`                                     | `'black'` | Color of the AO shadows                                                       |
| `denoiseSamples`         | `number`                                                  | `8`       | Number of samples for denoising                                               |
| `denoiseRadius`          | `number`                                                  | `12`      | Radius of the denoising filter                                                |
| `denoiseIterations`      | `number`                                                  | `2.0`     | Number of denoising iterations                                                |
| `halfRes`                | `boolean`                                                 | `false`   | Render at half resolution for better performance                              |
| `depthAwareUpsampling`   | `boolean`                                                 | `true`    | Use depth-aware upsampling when using half resolution                         |
| `screenSpaceRadius`      | `boolean`                                                 | `false`   | Use screen-space radius instead of world-space                                |
| `renderMode`             | `0 \| 1 \| 2 \| 3 \| 4`                                   | `0`       | Debug render mode (0: Combined, 1: AO only, 2: Normals, 3: Depth, 4: Denoise) |
| `biasOffset`             | `number`                                                  | `0.0`     | Bias offset for depth comparison                                              |
| `biasMultiplier`         | `number`                                                  | `0.0`     | Bias multiplier for depth comparison                                          |
| `gammaCorrection`        | `boolean`                                                 | `true`    | Apply gamma correction                                                        |
| `logarithmicDepthBuffer` | `boolean`                                                 | `false`   | Use logarithmic depth buffer                                                  |
| `colorMultiply`          | `boolean`                                                 | `true`    | Multiply the color instead of darkening                                       |
| `transparencyAware`      | `boolean`                                                 | `false`   | Handle transparent objects correctly                                          |
| `accumulate`             | `boolean`                                                 | `false`   | Accumulate samples over frames for better quality                             |

## Tips

### Performance vs Quality

- Use `quality: 'performance'` or `halfRes: true` for better frame rates
- Increase `aoSamples` for higher quality at the cost of performance
- Use `accumulate: true` for static scenes to get better quality over time

### Common Configurations

```html
<!-- Performance-focused -->
<ngtp-n8ao [options]="{ quality: 'performance', halfRes: true }" />

<!-- Quality-focused -->
<ngtp-n8ao [options]="{ quality: 'ultra', aoSamples: 64, denoiseSamples: 16 }" />

<!-- Subtle effect -->
<ngtp-n8ao [options]="{ intensity: 2, aoRadius: 1 }" />

<!-- Strong, dramatic effect -->
<ngtp-n8ao [options]="{ intensity: 10, aoRadius: 8, color: '#000000' }" />

<!-- Debug AO only -->
<ngtp-n8ao [options]="{ renderMode: 1 }" />
```
