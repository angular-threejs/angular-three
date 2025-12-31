# `angular-three/dom`

Secondary entry point of `angular-three` providing DOM-specific components and utilities for rendering Three.js scenes in the browser.

## Installation

This entry point is included with `angular-three`:

```bash
npm install angular-three
```

## Setup

Add the renderer provider to your application config:

```typescript
// app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideNgtRenderer } from 'angular-three/dom';

export const appConfig: ApplicationConfig = {
	providers: [provideNgtRenderer()],
};
```

## Components

### `NgtCanvas`

The main canvas component for rendering Three.js scenes. It creates a WebGL canvas and sets up the Three.js rendering context including:

- Canvas sizing and resize handling
- WebGL renderer initialization
- Camera and scene setup
- Event handling
- Render loop management

```typescript
import { Component } from '@angular/core';
import { NgtCanvas } from 'angular-three/dom';
import { extend } from 'angular-three';
import * as THREE from 'three';

// Register Three.js elements
extend(THREE);

@Component({
	selector: 'app-root',
	imports: [NgtCanvas],
	template: `
		<ngt-canvas [shadows]="true" [dpr]="[1, 2]" (created)="onCreated($event)">
			<ng-template canvasContent>
				<ngt-mesh>
					<ngt-box-geometry />
					<ngt-mesh-standard-material />
				</ngt-mesh>
				<ngt-ambient-light [intensity]="0.5" />
				<ngt-directional-light [position]="[5, 5, 5]" />
			</ng-template>
		</ngt-canvas>
	`,
	styles: `
		:host {
			display: block;
			height: 100vh;
		}
	`,
})
export class AppComponent {
	onCreated(state: NgtState) {
		console.log('Canvas ready:', state);
	}
}
```

#### Inputs

| Input          | Type                                  | Default               | Description                                         |
| -------------- | ------------------------------------- | --------------------- | --------------------------------------------------- |
| `gl`           | `NgtGLOptions`                        | -                     | WebGL renderer options                              |
| `size`         | `NgtSize`                             | -                     | Override canvas size                                |
| `shadows`      | `boolean \| NgtShadows`               | `false`               | Enable shadow maps                                  |
| `legacy`       | `boolean`                             | `false`               | Enable legacy color mode                            |
| `linear`       | `boolean`                             | `false`               | Disable automatic sRGB encoding                     |
| `flat`         | `boolean`                             | `false`               | Disable tone mapping                                |
| `orthographic` | `boolean`                             | `false`               | Use orthographic camera                             |
| `frameloop`    | `NgtFrameloop`                        | `'always'`            | Render loop mode: `'always'`, `'demand'`, `'never'` |
| `performance`  | `Partial<NgtPerformance>`             | -                     | Performance settings                                |
| `dpr`          | `NgtDpr`                              | `[1, 2]`              | Device pixel ratio range                            |
| `raycaster`    | `Partial<THREE.Raycaster>`            | -                     | Raycaster configuration                             |
| `scene`        | `THREE.Scene \| Partial<THREE.Scene>` | -                     | Scene configuration                                 |
| `camera`       | `NgtCamera \| NgtCameraParameters`    | -                     | Camera configuration                                |
| `events`       | `Function`                            | `createPointerEvents` | Event system factory                                |
| `eventSource`  | `HTMLElement \| ElementRef`           | -                     | Custom event source element                         |
| `eventPrefix`  | `NgtEventPrefix`                      | `'offset'`            | Event coordinate prefix                             |
| `lookAt`       | `NgtVector3`                          | -                     | Camera look-at target                               |

#### Outputs

| Output          | Type       | Description                             |
| --------------- | ---------- | --------------------------------------- |
| `created`       | `NgtState` | Emitted when canvas is initialized      |
| `pointerMissed` | `Event`    | Emitted when pointer misses all objects |

## Functions

### `provideNgtRenderer()`

Provider function that sets up Angular Three's custom renderer for Three.js elements.

```typescript
import { provideNgtRenderer } from 'angular-three/dom';

export const appConfig: ApplicationConfig = {
	providers: [
		provideNgtRenderer(),
		// With options:
		provideNgtRenderer({ verbose: true }),
	],
};
```

### `createPointerEvents()`

Creates the default pointer event manager for an Angular Three canvas. This function sets up event listeners and translates DOM pointer events to Three.js raycasting events.

Supported events:

- `click`, `dblclick`, `contextmenu`
- `pointerup`, `pointerdown`, `pointermove`
- `pointerover`, `pointerout`, `pointerenter`, `pointerleave`
- `pointercancel`, `pointermissed`
- `wheel`

This is the default event system used by `NgtCanvas`. You can provide a custom event factory via the `events` input if needed.
