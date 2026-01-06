# Angular Three workspace

## Netlify Status

- Angular Three: [![Angular Three Netlify Status](https://api.netlify.com/api/v1/badges/63a4face-28af-41d4-8b42-003c80c8cff0/deploy-status)](https://app.netlify.com/sites/angularthree/deploys)
- Angular Three Demo: [![Angular Three Demo Netlify Status](https://api.netlify.com/api/v1/badges/c3dec680-1621-4a7c-a136-5be24c288019/deploy-status)](https://app.netlify.com/sites/angularthreedemo/deploys)
- Angular Three Soba: [![Angular Three Soba Netlify Status](https://api.netlify.com/api/v1/badges/9e72d542-fccd-45cb-98c7-5336ccb82ec3/deploy-status)](https://app.netlify.com/sites/angularthreesoba/deploys)

Here, you'll find the source code for the entire `angular-three` ecosystem, the documentation, and the examples.

## Documentation

The documentation is available at [angularthree.netlify.app](https://angularthree.netlify.app).

## Examples

The examples are available at [angularthreedemo.netlify.app](https://angularthreedemo.netlify.app).

## Features

### Pierced Props

Angular Three supports "pierced" property bindings that allow you to set individual components of vector/math properties:

```html
<!-- Instead of setting the entire rotation vector -->
<ngt-mesh [rotation]="[-Math.PI / 2, 0, 0]" />

<!-- You can set individual components -->
<ngt-mesh [rotation.x]="-Math.PI / 2" />
```

This also works for nested properties like shadow configuration on lights:

```html
<ngt-directional-light
	[castShadow]="true"
	[shadow.mapSize.width]="2048"
	[shadow.mapSize.height]="2048"
	[shadow.camera.near]="0.5"
	[shadow.camera.far]="500"
	[shadow.camera.left]="-10"
	[shadow.camera.right]="10"
/>
```

Supported pierced properties include:

- **Vector2/3/4**: `x`, `y`, `z`, `w`
- **Euler** (rotation): `x`, `y`, `z`
- **Quaternion**: `x`, `y`, `z`, `w`
- **Color**: `r`, `g`, `b`
- **Shadow** (on lights): `shadow.intensity`, `shadow.bias`, `shadow.mapSize.width`, `shadow.camera.near`, etc.
