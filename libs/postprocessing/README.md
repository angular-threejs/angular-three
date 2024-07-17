# `angular-three-postprocessing`

This is the main entry point for post-processing effects in Angular Three. It provides a way to apply various visual effects to your 3D scene after it has been rendered. This library relies on `maath`, `three-stdlib`, and `postprocessing` as dependencies.

## Installation

```bash
npm install angular-three-postprocessing three-stdlib maath postprocessing
# yarn add angular-three-postprocessing three-stdlib maath postprocessing
# pnpm add angular-three-postprocessing three-stdlib maath postprocessing
```

## NgtpEffectComposer

This is a wrapper component that manages and applies post-processing effects to your scene. It takes content children of effects and applies them in the order they are provided.

### Object Inputs (NgtpEffectComposerOptions)

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

````html
<ngtp-effect-composer [options]="{ multisampling: 0, frameBufferType: FloatType, enableNormalPass: true }">
	<ngtp-bloom />
</ngtp-effect-composer>
```
````

### NgtpEffectComposerApi

This is an interface that provides access to the underlying `NgtpEffectComposer` instance, as well as the `camera` and `scene` being used. It also includes references to the `NormalPass` and `DepthDownsamplingPass` if they are enabled

```ts
export interface NgtpEffectComposerApi {
	composer: EffectComposer;
	camera: Camera;
	scene: Scene;
	normalPass: NormalPass | null;
	downSamplingPass: DepthDownsamplingPass | null;
	resolutionScale?: number;
}
```

To retrieve the `NgtpEffectComposerApi` for components within `<ngtp-effect-composer />`, you can use the `injectEffectComposerApi` function.

## Effects

TBD
