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
import { Component } from '@angular/core';
import { TheatreProject, TheatreSheet, TheatreSheetObject } from 'angular-three-theatre';

@Component({
	template: `
		<theatre-project name="My Project">
			<ng-template theatreSheet="Scene">
				<ngt-mesh *theatreSheetObject="'Box'; let values" [position]="[values.x, values.y, values.z]">
					<ngt-box-geometry />
					<ngt-mesh-standard-material />
				</ngt-mesh>
			</ng-template>
		</theatre-project>
	`,
	imports: [TheatreProject, TheatreSheet, TheatreSheetObject],
})
export class SceneGraph {}
```

### Enable Studio (Development)

```typescript
import { TheatreStudio } from 'angular-three-theatre';

@Component({
	template: `
		<theatre-studio [enabled]="true" />
		<theatre-project name="My Project">
			<!-- ... -->
		</theatre-project>
	`,
	imports: [TheatreStudio, TheatreProject],
})
export class App {}
```

### Sequence Playback

```typescript
import { TheatreSequence } from 'angular-three-theatre';

@Component({
	template: `
		<theatre-project name="My Project">
			<ng-template theatreSheet="Scene">
				<theatre-sequence [options]="{ autoplay: true, loop: true }" [length]="5" />
				<!-- animated objects -->
			</ng-template>
		</theatre-project>
	`,
	imports: [TheatreProject, TheatreSheet, TheatreSequence],
})
export class SceneGraph {}
```

### Sync Three.js Properties

```typescript
import { TheatreSheetObjectSync } from 'angular-three-theatre';

@Component({
	template: `
		<ngt-mesh #mesh>
			<theatre-sheet-object-sync [parent]="mesh" [props]="['position', 'rotation', 'scale']" />
			<ngt-box-geometry />
		</ngt-mesh>
	`,
	imports: [TheatreSheetObjectSync],
})
export class AnimatedMesh {}
```

### Transform Controls

```typescript
import { TheatreSheetObjectTransform } from 'angular-three-theatre';

@Component({
	template: `
		<theatre-sheet-object-transform label="My Object">
			<ngt-mesh>
				<ngt-box-geometry />
			</ngt-mesh>
		</theatre-sheet-object-transform>
	`,
	imports: [TheatreSheetObjectTransform],
})
export class TransformableObject {}
```

## Components

| Component                     | Description                           |
| ----------------------------- | ------------------------------------- |
| `TheatreProject`              | Root container for Theatre.js project |
| `TheatreSheet`                | Creates an animation sheet            |
| `TheatreSequence`             | Controls sequence playback            |
| `TheatreStudio`               | Enables Theatre.js Studio UI          |
| `TheatreSheetObject`          | Creates animatable properties         |
| `TheatreSheetObjectSync`      | Syncs Three.js object properties      |
| `TheatreSheetObjectTransform` | Adds transform controls               |

## Transformers

Built-in property transformers for Theatre.js props:

- `color` - RGBA color picker
- `degrees` - Radian to degrees conversion
- `euler` - Euler rotation controls
- `normalized` - 0-1 range slider
- `side` - Material side property
- `generic` - Fallback for common types
