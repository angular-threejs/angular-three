# `angular-three-tweakpane`

This library provides [Tweakpane](https://tweakpane.github.io/docs/) integration for Angular Three, enabling easy creation of debug UI controls for tweaking parameters in your 3D scenes.

## Documentation

All public APIs are documented with JSDoc comments. Your IDE will provide inline documentation, parameter hints, and examples as you code.

## Installation

```bash
npm install angular-three-tweakpane tweakpane
# yarn add angular-three-tweakpane tweakpane
# pnpm add angular-three-tweakpane tweakpane
```

> Make sure to already have `angular-three` installed

## Usage

### Declarative API with `tweaks()`

The recommended way to create controls:

1. Add `tweakpaneAnchor` directive to your `ngt-canvas`
2. Add `<tweakpane-pane>` somewhere in your scene
3. Use `tweaks()` in any component within the canvas

```typescript
import { Component, ChangeDetectionStrategy, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { tweaks, TweakpaneAnchor, TweakpanePane } from 'angular-three-tweakpane';

@Component({
	template: `
		<ngt-mesh [position]="[params.x(), params.y(), params.z()]">
			<ngt-box-geometry />
			<ngt-mesh-standard-material [color]="params.color()" />
		</ngt-mesh>

		<tweakpane-pane title="Controls" />
	`,
	imports: [TweakpanePane],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SceneGraph {
	params = tweaks('Position', {
		x: { value: 0, min: -5, max: 5 },
		y: { value: 0, min: -5, max: 5 },
		z: { value: 0, min: -5, max: 5 },
		color: { value: '#ff0000', color: true },
	});
}

@Component({
	template: `
		<ngt-canvas tweakpaneAnchor>
			<app-scene-graph *canvasContent />
		</ngt-canvas>
	`,
	imports: [NgtCanvas, TweakpaneAnchor, SceneGraph],
})
export class Experience {}
```

### Nested Folders

```typescript
params = tweaks('Settings', {
	basic: 42,
	position: tweaks.folder('Position', {
		x: { value: 0, min: -5, max: 5 },
		y: { value: 0, min: -5, max: 5 },
		z: { value: 0, min: -5, max: 5 },
	}),
	material: tweaks.folder('Material', {
		color: { value: '#ff0000', color: true },
		metalness: { value: 0.5, min: 0, max: 1 },
		roughness: { value: 0.5, min: 0, max: 1 },
	}),
});

// Access nested values
this.params.position.x(); // Signal<number>
this.params.material.color(); // Signal<string>
```

### Two-Way Binding with Existing Signals

```typescript
filteringEnabled = signal(true);
gravity = signal(9.8);

params = tweaks('Settings', {
	filteringEnabled: this.filteringEnabled, // two-way binding
	gravity: this.gravity,
});
```

### Buttons (Actions)

```typescript
params = tweaks('Actions', {
	reset: { action: () => this.reset(), label: 'Reset All' },
	randomize: { action: () => this.randomize() },
});
```

### Component-Based API

For more control, use individual components:

```typescript
import {
	TweakpanePane,
	TweakpaneFolder,
	TweakpaneNumber,
	TweakpaneColor,
	TweakpaneCheckbox,
	TweakpaneButton,
} from 'angular-three-tweakpane';

@Component({
	template: `
		<tweakpane-pane title="Controls">
			<tweakpane-folder title="Position">
				<tweakpane-number [(value)]="x" label="X" [params]="{ min: -5, max: 5 }" />
			</tweakpane-folder>
			<tweakpane-color [(value)]="color" label="Color" />
			<tweakpane-checkbox [(value)]="visible" label="Visible" />
			<tweakpane-button title="Reset" (click)="reset()" />
		</tweakpane-pane>
	`,
	imports: [TweakpanePane, TweakpaneFolder, TweakpaneNumber, TweakpaneColor, TweakpaneCheckbox, TweakpaneButton],
})
export class Controls {
	x = signal(0);
	color = signal('#ff0000');
	visible = signal(true);

	reset() {
		this.x.set(0);
		this.color.set('#ff0000');
		this.visible.set(true);
	}
}
```

## Control Types

| Component           | Description                        | Config Type                      |
| ------------------- | ---------------------------------- | -------------------------------- |
| `TweakpaneNumber`   | Numeric input with optional slider | `{ value, min?, max?, step? }`   |
| `TweakpaneText`     | Text input                         | `{ value }`                      |
| `TweakpaneCheckbox` | Boolean toggle                     | `{ value }`                      |
| `TweakpaneColor`    | Color picker                       | `{ value, color: true }`         |
| `TweakpaneList`     | Dropdown select                    | `{ value, options: [...] }`      |
| `TweakpanePoint`    | 2D/3D/4D point input               | `{ value, x?, y?, z?, w? }`      |
| `TweakpaneButton`   | Clickable button                   | `{ action: () => void, label? }` |
| `TweakpaneFolder`   | Collapsible group                  | `tweaks.folder(name, config)`    |

## Pane Positioning

```typescript
<tweakpane-pane title="Debug" top="8px" right="8px">
  <!-- controls -->
</tweakpane-pane>
```

Available position inputs: `top`, `right`, `bottom`, `left`, `width`
