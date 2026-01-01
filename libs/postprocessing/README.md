# `angular-three-postprocessing`

This is the main entry point for post-processing effects in Angular Three. It provides a way to apply various visual effects to your 3D scene after it has been rendered. This library relies on `maath`, `three-stdlib`, and `postprocessing` as dependencies.

## Documentation

All public APIs are documented with JSDoc comments. Your IDE will provide inline documentation, parameter hints, and examples as you code.

## Installation

```bash
npm install angular-three-postprocessing three-stdlib maath postprocessing
# yarn add angular-three-postprocessing three-stdlib maath postprocessing
# pnpm add angular-three-postprocessing three-stdlib maath postprocessing
```

## NgtpEffectComposer

This is a wrapper component that manages and applies post-processing effects to your scene. It takes content children of effects and applies them in the order they are provided.

### Usage

```html
<ngtp-effect-composer [options]="{ multisampling: 0 }">
	<ngtp-bloom [options]="{ luminanceThreshold: 0.9, intensity: 0.5 }" />
	<ngtp-vignette [options]="{ darkness: 0.5 }" />
</ngtp-effect-composer>
```

### Options (NgtpEffectComposerOptions)

| Property           | Description                                                                                       | Default Value |
| ------------------ | ------------------------------------------------------------------------------------------------- | ------------- |
| `enabled`          | Whether the effect composer is enabled.                                                           | true          |
| `depthBuffer`      | Whether to use a depth buffer.                                                                    | undefined     |
| `enableNormalPass` | Whether to enable the normal pass. This is only used for SSGI currently.                          | undefined     |
| `stencilBuffer`    | Whether to use a stencil buffer.                                                                  | undefined     |
| `autoClear`        | Whether to automatically clear the output buffer before rendering.                                | true          |
| `resolutionScale`  | A scaling factor for the resolution of the effect composer.                                       | undefined     |
| `multisampling`    | The number of samples to use for multisample anti-aliasing (MSAA). Set to 0 to disable MSAA.      | 8             |
| `frameBufferType`  | The data type to use for the frame buffer.                                                        | HalfFloatType |
| `renderPriority`   | The render priority of the effect composer.                                                       | 1             |
| `camera`           | The camera to use for rendering. If not provided, the default camera from the store will be used. | undefined     |
| `scene`            | The scene to render. If not provided, the default scene from the store will be used.              | undefined     |

## Effects

All effects are available from `angular-three-postprocessing`:

| Effect                    | Selector                    | Description                           |
| ------------------------- | --------------------------- | ------------------------------------- |
| `NgtpAscii`               | `ngtp-ascii`                | ASCII art effect                      |
| `NgtpBloom`               | `ngtp-bloom`                | Bloom/glow effect                     |
| `NgtpBrightnessContrast`  | `ngtp-brightness-contrast`  | Brightness and contrast adjustment    |
| `NgtpChromaticAberration` | `ngtp-chromatic-aberration` | Chromatic aberration effect           |
| `NgtpColorAverage`        | `ngtp-color-average`        | Color averaging effect                |
| `NgtpColorDepth`          | `ngtp-color-depth`          | Color depth reduction                 |
| `NgtpDepth`               | `ngtp-depth`                | Depth visualization                   |
| `NgtpDepthOfField`        | `ngtp-depth-of-field`       | Depth of field effect                 |
| `NgtpDotScreen`           | `ngtp-dot-screen`           | Dot screen effect                     |
| `NgtpFXAA`                | `ngtp-fxaa`                 | Fast approximate anti-aliasing        |
| `NgtpGlitch`              | `ngtp-glitch`               | Glitch effect                         |
| `NgtpGodRays`             | `ngtp-god-rays`             | God rays/light shafts                 |
| `NgtpGrid`                | `ngtp-grid`                 | Grid overlay                          |
| `NgtpHueSaturation`       | `ngtp-hue-saturation`       | Hue and saturation adjustment         |
| `NgtpLensFlare`           | `ngtp-lens-flare`           | Lens flare effect                     |
| `NgtpLUT`                 | `ngtp-lut`                  | LUT (Look-Up Table) color grading     |
| `NgtpNoise`               | `ngtp-noise`                | Noise effect                          |
| `NgtpOutline`             | `ngtp-outline`              | Outline effect                        |
| `NgtpPixelation`          | `ngtp-pixelation`           | Pixelation effect                     |
| `NgtpScanline`            | `ngtp-scanline`             | Scanline effect                       |
| `NgtpSelectiveBloom`      | `ngtp-selective-bloom`      | Selective bloom on specific objects   |
| `NgtpSepia`               | `ngtp-sepia`                | Sepia tone effect                     |
| `NgtpShockWave`           | `ngtp-shock-wave`           | Shock wave distortion                 |
| `NgtpSMAA`                | `ngtp-smaa`                 | Subpixel morphological anti-aliasing  |
| `NgtpTiltShift`           | `ngtp-tilt-shift`           | Tilt-shift blur                       |
| `NgtpTiltShift2`          | `ngtp-tilt-shift-2`         | Alternative tilt-shift implementation |
| `NgtpToneMapping`         | `ngtp-tone-mapping`         | Tone mapping                          |
| `NgtpVignette`            | `ngtp-vignette`             | Vignette darkening                    |
| `NgtpWater`               | `ngtp-water`                | Water effect                          |

### Effect Example

```typescript
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { NgtpEffectComposer, NgtpBloom, NgtpVignette, NgtpNoise } from 'angular-three-postprocessing';

@Component({
	template: `
		<ngtp-effect-composer>
			<ngtp-bloom [options]="{ luminanceThreshold: 0.9, luminanceSmoothing: 0.025, intensity: 0.5 }" />
			<ngtp-noise [options]="{ opacity: 0.02 }" />
			<ngtp-vignette [options]="{ eskil: false, offset: 0.1, darkness: 1.1 }" />
		</ngtp-effect-composer>
	`,
	imports: [NgtpEffectComposer, NgtpBloom, NgtpVignette, NgtpNoise],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class PostProcessing {}
```

## N8AO (Ambient Occlusion)

A separate sub-library provides N8 Ambient Occlusion:

```bash
npm install n8ao
```

```typescript
import { NgtpN8AO } from 'angular-three-postprocessing/n8ao';
```

```html
<ngtp-effect-composer [options]="{ enableNormalPass: true }">
	<ngtp-n8ao [options]="{ aoRadius: 0.5, intensity: 1 }" />
</ngtp-effect-composer>
```
