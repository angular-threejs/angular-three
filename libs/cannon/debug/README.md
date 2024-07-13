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

## NgtcDebugApi

The `NgtcDebugApi` interface provides methods to interact with the debug renderer:

- `add(uuid: string, props: BodyProps, type: BodyShapeType)`: Adds a physics body to the debug renderer.
- `remove(uuid: string)`: Removes a physics body from the debug renderer.

### `injectNgtcDebugApi`

The `injectNgtcDebugApi` function is used to inject the `NgtcDebugApi` into your components, enabling you to control the debug visualization.

## NgtcDebug

The `NgtcDebug` directive is applied to the `ngtc-physics` component to enable physics debugging. It has the following inputs:

- `debug`: An object containing the following properties:

  - `enabled`: (boolean) Whether the debug visualization is enabled (default: true).
  - `color`: (string) The color of the debug visualization (default: 'black').
  - `impl`: (typeof CannonDebugger) The implementation of the CannonDebugger to use (default: CannonDebugger).
  - `scale`: (number) The scale of the debug visualization (default: 1).

## Usage

```html
<ngtc-physics debug></ngtc-physics>
```

You can customize the debug visualization by providing input values within the `debug` object:

```html
<ngtc-physics [debug]="{enabled: true, color: 'red', scale: 0.5}"></ngtc-physics>
```
