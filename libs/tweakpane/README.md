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

```typescript
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { tweaks, TweakpaneAnchor } from 'angular-three-tweakpane';

@Component({
	template: `
		<tweakpane-anchor />
		<ngt-mesh [position]="[params.x(), params.y(), params.z()]">
			<ngt-box-geometry />
			<ngt-mesh-standard-material [color]="params.color()" />
		</ngt-mesh>
	`,
	imports: [TweakpaneAnchor],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SceneGraph {
	params = tweaks({
		x: { value: 0, min: -5, max: 5 },
		y: { value: 0, min: -5, max: 5 },
		z: { value: 0, min: -5, max: 5 },
		color: { value: '#ff0000', color: true },
	});
}
```

### Nested Folders

```typescript
params = tweaks({
	position: tweaks.folder({
		x: { value: 0, min: -5, max: 5 },
		y: { value: 0, min: -5, max: 5 },
		z: { value: 0, min: -5, max: 5 },
	}),
	material: tweaks.folder({
		color: { value: '#ff0000', color: true },
		metalness: { value: 0.5, min: 0, max: 1 },
		roughness: { value: 0.5, min: 0, max: 1 },
	}),
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
		<tweakpane-pane [options]="{ title: 'Controls' }">
			<tweakpane-folder [options]="{ title: 'Position' }">
				<tweakpane-number [(value)]="x" [options]="{ label: 'X', min: -5, max: 5 }" />
			</tweakpane-folder>
			<tweakpane-color [(value)]="color" [options]="{ label: 'Color' }" />
			<tweakpane-checkbox [(value)]="visible" [options]="{ label: 'Visible' }" />
			<tweakpane-button [options]="{ title: 'Reset' }" (click)="reset()" />
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

| Component           | Description                        | Config Type             |
| ------------------- | ---------------------------------- | ----------------------- |
| `TweakpaneNumber`   | Numeric input with optional slider | `{ min?, max?, step? }` |
| `TweakpaneText`     | Text input                         | `{ label? }`            |
| `TweakpaneCheckbox` | Boolean toggle                     | `{ label? }`            |
| `TweakpaneColor`    | Color picker                       | `{ color: true }`       |
| `TweakpaneList`     | Dropdown select                    | `{ options: [...] }`    |
| `TweakpanePoint`    | 2D/3D/4D point input               | `{ x?, y?, z?, w? }`    |
| `TweakpaneButton`   | Clickable button                   | `{ title }`             |
| `TweakpaneFolder`   | Collapsible group                  | `{ title, expanded? }`  |

## Pane Positioning

```typescript
<tweakpane-pane [options]="{
  title: 'Debug',
  position: 'top-right' // 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
}">
```

## Binding to Objects

Use `TweakpaneBinding` to bind directly to object properties:

```typescript
@Component({
	template: `
		<tweakpane-pane>
			<tweakpane-binding [target]="mesh.position" property="x" [options]="{ min: -5, max: 5 }" />
		</tweakpane-pane>
	`,
})
export class Controls {
	mesh = viewChild.required<ElementRef<Mesh>>('mesh');
}
```
