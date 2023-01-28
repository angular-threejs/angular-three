# Angular Renderer for THREE.js

Leverage your [Angular](https://angular.io) to build 3D applications with [THREE.js](https://threejs.org)

## Installation

```shell
npx ng add angular-three
```

or

```shell
npm i angular-three three
```

```shell
npm i -D @types/three
```

> Typically, we'd want to keep `three` and `@types/three` on the same minor version. Eg: `0.147`, `0.148` etc..

## Simple usage

1. Create a `Scene` component as a Standalone Component

```ts
import { extend } from 'angular-three';
import { Mesh, BoxGeometry, MeshBasicMaterial } from 'three';

extend({ Mesh, BoxGeometry, MeshBasicMaterial });

@Component({
    standalone: true,
    template: `
        <ngt-mesh>
            <ngt-box-geometry />
            <ngt-mesh-basic-material color="darkred" />
        </ngt-mesh>
    `,
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class Scene {}
```

-   `extend` will add the THREE entities to `angular-three` catalogue which allows the renderer to recognize the custom tags: `ngt-mesh`, `ngt-box-geometry` etc..
-   Custom Element tags follow this rule: `ngt-` + THREE classes in **kebab-case**. `Mesh` -> `ngt-mesh`
-   `schemas: [CUSTOM_ELEMENTS_SCHEMA]` allows us to use custom tags on the template. This is Angular's limitation at the moment

2. Render `<ngt-canvas>` component, use `Scene` component above to pass into `[sceneGraph]` input on `<ngt-canvas>`

```html
<ngt-canvas [sceneGraph]="Scene" />
```

-   `ngt-canvas` creates the basic building blocks of THREE.js: a default `WebGLRenderer`, a default `Scene`, and a default `PerspectiveCamera`

## Documentations

Read more about Angular Three usages in [Documentations](https://angular-threejs.netlify.app)

## Contributions

Contributions are welcomed
