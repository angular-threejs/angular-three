# `angular-three-cannon/debug`

This module provides the `NgtcDebug` directive, which allows you to visualize the physics bodies within your Angular Three Cannon simulations.

| Package              | Description                                    |
| -------------------- | ---------------------------------------------- |
| `cannon-es-debugger` | A debug renderer for Cannon.js physics engine. |

This entry point requires the `cannon-es-debugger` package to be installed.

```bash
npm install cannon-es-debugger
# yarn add cannon-es-debugger
# pnpm add cannon-es-debugger
```

## NgtcDebug

The `NgtcDebug` directive is applied to the `ngtc-physics` component to enable physics debugging. It has the following input:

- `debug`: An object containing the following properties:
    - `enabled`: (boolean) Whether the debug visualization is enabled (default: true).
    - `color`: (string) The color of the debug visualization (default: 'black').
    - `impl`: (typeof CannonDebugger) The implementation of the CannonDebugger to use (default: CannonDebugger).
    - `scale`: (number) The scale of the debug visualization (default: 1).

## Usage

```html
<ngtc-physics [debug]="{ enabled: true }">
	<!-- Physics bodies here -->
</ngtc-physics>
```

You can customize the debug visualization by providing input values within the `debug` object:

```html
<ngtc-physics [debug]="{ enabled: true, color: 'red', scale: 0.5 }">
	<!-- Physics bodies here -->
</ngtc-physics>
```

Toggle debug visualization based on component state:

```html
<ngtc-physics [debug]="{ enabled: isDebugging() }">
	<!-- Physics bodies here -->
</ngtc-physics>
```

## NgtcDebug Methods

The `NgtcDebug` class provides the following methods for internal use:

- `add(uuid: string, props: BodyProps, type: BodyShapeType)`: Adds a physics body to the debug renderer.
- `remove(uuid: string)`: Removes a physics body from the debug renderer.

These methods are called automatically by body functions when debug is enabled.
