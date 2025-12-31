# `angular-three-soba/loaders`

This secondary entry point includes various loaders for files such as GLTF, FBX, textures, and fonts.

## TOC

- [Resource-based APIs (recommended)](#resource-based-apis-recommended)
    - [`fontResource`](#fontresource)
    - [`gltfResource`](#gltfresource)
    - [`textureResource`](#textureresource)
    - [`fbxResource`](#fbxresource)
- [Progress Tracking](#progress-tracking)
    - [`progress`](#progress)
    - [`NgtsLoader`](#ngtsloader)
- [Legacy APIs (deprecated)](#legacy-apis-deprecated)
    - [`injectFont`](#injectfont)
    - [`injectGLTF`](#injectgltf)
    - [`injectTexture`](#injecttexture)
    - [`injectFBX`](#injectfbx)
    - [`injectProgress`](#injectprogress)

## Resource-based APIs (recommended)

These functions use Angular's resource API and are the recommended approach for loading assets.

### `fontResource`

Creates a resource for loading font files for use with Three.js TextGeometry. Supports loading from URLs (typeface.js JSON format) or pre-loaded font data. Results are cached for efficient reuse.

```ts
import { fontResource } from 'angular-three-soba/loaders';

@Component({...})
class MyComponent {
  font = fontResource(() => '/fonts/helvetiker_regular.typeface.json');

  // Use in template or effect
  constructor() {
    effect(() => {
      const f = this.font.value();
      if (f) {
        const geometry = new TextGeometry('Hello', { font: f, size: 1 });
      }
    });
  }
}
```

Static methods:

- `fontResource.preload(input: NgtsFontInput): void`: Preloads a font into the cache.
- `fontResource.clear(input?: NgtsFontInput): void`: Clears a specific font or all fonts from the cache.

### `gltfResource`

Creates a resource for loading GLTF/GLB 3D models. Supports Draco compression and Meshopt optimization out of the box. Returns a resource with a `scene` computed signal for direct access to the loaded scene(s).

```ts
import { gltfResource } from 'angular-three-soba/loaders';

@Component({
	selector: 'app-suzi',
	template: `
		@if (gltf.value(); as gltf) {
			<ngt-primitive *args="[gltf.scene]" [rotation]="[-0.63, 0, 0]" [scale]="2" />
		}
	`,
	imports: [NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
class Suzi {
	gltf = gltfResource(() => './suzanne-high-poly.gltf');

	// Or access scene directly via computed signal
	scene = this.gltf.scene;
}
```

Options:

| Option       | Type                           | Default | Description                                            |
| ------------ | ------------------------------ | ------- | ------------------------------------------------------ |
| `useDraco`   | `boolean \| string`            | `true`  | Enable Draco compression. Pass string for custom path. |
| `useMeshOpt` | `boolean`                      | `true`  | Enable Meshopt optimization.                           |
| `extensions` | `(loader: GLTFLoader) => void` | -       | Custom extensions callback for GLTFLoader.             |
| `onLoad`     | `(data) => void`               | -       | Callback fired when loading completes.                 |
| `injector`   | `Injector`                     | -       | Optional injector for DI context.                      |

Static methods:

- `gltfResource.preload(input, options?): void`: Preloads a GLTF model into the cache.
- `gltfResource.setDecoderPath(path: string): void`: Sets the global Draco decoder path.

### `textureResource`

Creates a resource for loading texture images. Loaded textures are automatically initialized with the WebGL renderer for optimal performance.

```ts
import { textureResource } from 'angular-three-soba/loaders';

@Component({
	template: `
		@if (textures.value(); as textures) {
			<ngt-mesh>
				<ngt-mesh-physical-material [normalMap]="textures.normalMap" [roughnessMap]="textures.roughnessMap" />
			</ngt-mesh>
		}
	`,
})
export class MyCmp {
	textures = textureResource(() => ({
		roughnessMap: 'roughness_floor.jpeg',
		normalMap: 'NORM.jpg',
	}));
}
```

Static methods:

- `textureResource.preload(input): void`: Preloads textures into the cache.

### `fbxResource`

Creates a resource for loading FBX 3D models. Supports loading single files, arrays of files, or record objects mapping keys to URLs.

```ts
import { fbxResource } from 'angular-three-soba/loaders';

@Component({...})
class MyComponent {
  // Single file
  fbx = fbxResource(() => '/models/character.fbx');

  // Multiple files
  fbxs = fbxResource(() => ['/models/a.fbx', '/models/b.fbx']);

  // Named files
  models = fbxResource(() => ({ hero: '/models/hero.fbx', enemy: '/models/enemy.fbx' }));
}
```

Static methods:

- `fbxResource.preload(input): void`: Preloads FBX models into the cache.

## Progress Tracking

### `progress`

Creates a reactive state object that tracks Three.js asset loading progress. Hooks into `THREE.DefaultLoadingManager` to monitor all asset loading operations.

```ts
import { progress } from 'angular-three-soba/loaders';

@Component({...})
class MyComponent {
  loadingState = progress();

  constructor() {
    effect(() => {
      if (this.loadingState.active()) {
        console.log(`Loading: ${this.loadingState.progress()}%`);
      }
    });

    // Check for errors
    effect(() => {
      const errors = this.loadingState.errors();
      if (errors.length > 0) {
        console.error('Failed to load:', errors);
      }
    });
  }
}
```

Returns a signal state object with the following properties:

| Property   | Type       | Description                         |
| ---------- | ---------- | ----------------------------------- |
| `errors`   | `string[]` | Array of URLs that failed to load   |
| `active`   | `boolean`  | Whether loading is in progress      |
| `progress` | `number`   | Loading progress percentage (0-100) |
| `item`     | `string`   | URL of the currently loading item   |
| `loaded`   | `number`   | Number of items loaded              |
| `total`    | `number`   | Total number of items to load       |

### `NgtsLoader`

A component that renders a loading screen while THREE.js assets are being loaded.

#### Object Inputs (`NgtsLoaderOptions`)

| Property            | Description                                                              | Default value                                       |
| ------------------- | ------------------------------------------------------------------------ | --------------------------------------------------- |
| `containerClass`    | Additional CSS classes for the loader's container.                       | `''`                                                |
| `innerClass`        | Additional CSS classes for the inner loader element.                     | `''`                                                |
| `barClass`          | Additional CSS classes for the loader bar element.                       | `''`                                                |
| `dataClass`         | Additional CSS classes for the text element displaying loading progress. | `''`                                                |
| `dataInterpolation` | A function that formats the displayed loading progress.                  | `(value: number) => 'Loading ${value.toFixed(2)}%'` |
| `initialState`      | A function that determines the initial visibility of the loader.         | `(value: boolean) => value`                         |

`NgtsLoader` is a normal Angular component that renders HTML so it must be put on the same level of `ngt-canvas`, not within.

```html
<ngt-canvas />
<ngts-loader [options]="loaderOptions" />
```

## Legacy APIs (deprecated)

> **Note**: These functions are deprecated and will be removed in v5.0.0. Use the resource-based APIs instead.

### `injectFont`

> **Deprecated**: Use `fontResource` instead.

Provides a way to inject and load fonts into your Angular component. Returns a signal that holds the loaded `Font` object or null if not yet loaded.

Static methods:

- `injectFont.preload(input: () => NgtsFontInput): void`: Preloads a font into the cache.
- `injectFont.clear(input?: () => NgtsFontInput): void`: Clears a specific font or all fonts from the cache.

### `injectGLTF`

> **Deprecated**: Use `gltfResource` instead.

Injects and loads GLTF models into your Angular component. Supports Draco and Meshopt compression.

```ts
@Component({
	selector: 'app-suzi',
	template: `
		<ngt-primitive *args="[scene()]" [rotation]="[-0.63, 0, 0]" [scale]="2" [position]="[0, -1.175, 0]" />
	`,
	imports: [NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
class Suzi {
	gltf = injectGLTF(() => './suzanne-high-poly.gltf');

	scene = computed(() => {
		const gltf = this.gltf();
		if (!gltf) return null;
		return gltf.scene;
	});
}
```

Static methods:

- `injectGLTF.preload(path: () => TUrl, options): void`: Preloads a GLTF model into the cache.
- `injectGLTF.setDecoderPath(path: string): void`: Sets the decoder path for Draco.

### `injectTexture`

> **Deprecated**: Use `textureResource` instead.

Injects and loads textures into your Angular component. Returns a signal that holds the loading results.

```ts
@Component({
	template: `
		<ngt-mesh>
			<ngt-mesh-physical-material [normalMap]="normalMap()" [roughnessMap]="roughnessMap()" />
		</ngt-mesh>
	`,
})
export class MyCmp {
	private textures = injectTexture(() => ({
		roughnessMap: 'roughness_floor.jpeg',
		normalMap: 'NORM.jpg',
	}));
	roughnessMap = computed(() => this.textures()?.roughnessMap || null);
	normalMap = computed(() => this.textures()?.normalMap || null);
}
```

Static methods:

- `injectTexture.preload(input: () => TInput): void`: Preloads a texture into the cache.

### `injectFBX`

> **Deprecated**: Use `fbxResource` instead.

Injects and loads FBX models into your Angular component.

```ts
// Single file
const fbx = injectFBX(() => '/models/character.fbx');

// Multiple files
const fbxs = injectFBX(() => ['/models/a.fbx', '/models/b.fbx']);

// Preload
injectFBX.preload(() => '/models/character.fbx');
```

### `injectProgress`

> **Deprecated**: Use `progress` instead.

Alias for the `progress` function.

```ts
function injectProgress(injector?: Injector): Signal<{
	errors: string[];
	active: boolean;
	progress: number;
	item: string;
	loaded: number;
	total: number;
}>;
```
