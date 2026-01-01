# `angular-three-theatre`

This library provides [Theatre.js](https://www.theatrejs.com/) integration for Angular Three, enabling powerful animation and motion design capabilities for your 3D scenes.

## Documentation

All public APIs are documented with JSDoc comments. Your IDE will provide inline documentation, parameter hints, and examples as you code.

## Installation

```bash
npm install angular-three-theatre @theatre/core @theatre/studio
# yarn add angular-three-theatre @theatre/core @theatre/studio
# pnpm add angular-three-theatre @theatre/core @theatre/studio
```

> Make sure to already have `angular-three` installed

## Usage

### Basic Setup

```typescript
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { TheatreProject, TheatreSheet, TheatreSheetObject } from 'angular-three-theatre';

@Component({
	template: `
		<theatre-project name="My Project">
			<ng-container sheet="Scene">
				<ng-template sheetObject="Box" [sheetObjectProps]="{ x: 0, y: 0, z: 0 }" let-values="values">
					<ngt-mesh [position]="[values().x, values().y, values().z]">
						<ngt-box-geometry />
						<ngt-mesh-standard-material />
					</ngt-mesh>
				</ng-template>
			</ng-container>
		</theatre-project>
	`,
	imports: [TheatreProject, TheatreSheet, TheatreSheetObject],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class SceneGraph {}
```

### Enable Studio (Development)

The `studio` directive is applied to `theatre-project`:

```typescript
import { TheatreProject, TheatreStudio } from 'angular-three-theatre';

@Component({
	template: `
		<theatre-project name="My Project" [studio]="isDevelopment">
			<ng-container sheet="Scene">
				<!-- sheet objects here -->
			</ng-container>
		</theatre-project>
	`,
	imports: [TheatreProject, TheatreStudio],
})
export class SceneGraph {
	isDevelopment = !environment.production;
}
```

### Sequence Playback

The `sequence` directive must be used together with the `sheet` directive:

```typescript
import { TheatreProject, TheatreSheet } from 'angular-three-theatre';

@Component({
	template: `
		<theatre-project name="My Project">
			<ng-container sheet="Scene" [sequence]="{ autoplay: true, rate: 1 }" #seq="sequence">
				<p>Position: {{ seq.position() }}</p>
				<button (click)="seq.play()">Play</button>
				<button (click)="seq.pause()">Pause</button>

				<!-- sheet objects here -->
			</ng-container>
		</theatre-project>
	`,
	imports: [TheatreProject, TheatreSheet],
})
export class SceneGraph {}
```

### Sync Three.js Properties

Use the `sync` directive to synchronize Three.js object properties with Theatre.js:

```typescript
import { TheatreSheetObject } from 'angular-three-theatre';

@Component({
	template: `
		<ng-template sheetObject="myMaterial">
			<ngt-mesh-standard-material
				[sync]="material"
				[syncProps]="['opacity', 'roughness', 'metalness']"
				#material
			/>
		</ng-template>
	`,
	imports: [TheatreSheetObject],
})
export class AnimatedMaterial {}
```

### Transform Controls

Use `theatre-transform` component for position, rotation, and scale animation:

```typescript
import { TheatreSheetObject } from 'angular-three-theatre';

@Component({
	template: `
		<ng-template sheetObject="myCube">
			<theatre-transform>
				<ngt-mesh>
					<ngt-box-geometry />
					<ngt-mesh-standard-material />
				</ngt-mesh>
			</theatre-transform>
		</ng-template>
	`,
	imports: [TheatreSheetObject],
})
export class TransformableObject {}
```

## Directives and Components

| Export                        | Selector                   | Description                                    |
| ----------------------------- | -------------------------- | ---------------------------------------------- |
| `TheatreProject`              | `theatre-project`          | Root container for Theatre.js project          |
| `TheatreSheet`                | `[sheet]`                  | Creates an animation sheet (includes Sequence) |
| `TheatreSequence`             | `[sheet][sequence]`        | Controls sequence playback                     |
| `TheatreStudio`               | `theatre-project[studio]`  | Enables Theatre.js Studio UI                   |
| `TheatreSheetObject`          | `ng-template[sheetObject]` | Creates animatable properties                  |
| `TheatreSheetObjectSync`      | `[sync]`                   | Syncs Three.js object properties               |
| `TheatreSheetObjectTransform` | `theatre-transform`        | Adds transform controls                        |

### Convenience Exports

For easier importing, the library provides combined exports:

```typescript
// TheatreSheet includes both TheatreSheetImpl and TheatreSequence
import { TheatreSheet } from 'angular-three-theatre';

// TheatreSheetObject includes TheatreSheetObjectImpl, TheatreSheetObjectSync, and TheatreSheetObjectTransform
import { TheatreSheetObject } from 'angular-three-theatre';
```

## Sheet Object Template Context

The `sheetObject` directive provides the following template context:

```html
<ng-template
	sheetObject="myObject"
	[sheetObjectProps]="{ opacity: 1 }"
	let-values="values"
	let-sheetObject="sheetObject"
	let-select="select"
	let-deselect="deselect"
>
	<!-- values() returns the current animated values -->
	<!-- sheetObject() returns the Theatre.js sheet object instance -->
	<!-- select() selects this object in Studio -->
	<!-- deselect() deselects this object in Studio -->
</ng-template>
```

## Transformers

Built-in property transformers for Theatre.js props:

- `color` - RGBA color picker
- `degrees` - Radian to degrees conversion
- `euler` - Euler rotation controls
- `normalized` - 0-1 range slider
- `side` - Material side property
- `generic` - Fallback for common types
