# `angular-three-soba/loaders`

This secondary entry point includes various loaders for files such as GLTF, textures, and fonts.

## TOC

- [`injectFont`](#injectfont)
- [`injectGLTF`](#injectgltf)
- [`injectTexture`](#injecttexture)
- [`injectProgress`](#injectprogress)
- [`NgtsLoader`](#ngtsloader)

## `injectFont`

Provides a way to inject and load fonts into your Angular component. It takes a function input that returns the font data (either as a `string` URL or a `FontData` object) and an optional injector. It returns a signal that holds the loaded `Font` object or null if not yet loaded.

The function also has static methods for preloading and clearing fonts from the cache:

- `injectFont.preload(input: () => NgtsFontInput): void`: Preloads a font into the cache.
- `injectFont.clear(input?: () => NgtsFontInput): void`: Clears a specific font or all fonts from the cache.

Please check `NgtsText3D` source for example usage.

## `injectGLTF`

Injects and loads GLTF models into your Angular component. It takes a function path that returns the URL(s) of the GLTF model(s) and options for Draco and Meshopt compression. It returns a signal that holds the loading results.

- Draco: A library for compressing and decompressing 3D geometric meshes and point clouds. Using Draco can significantly reduce the size of 3D models, leading to faster loading times.
- Meshopt: A collection of tools for optimizing 3D meshes for size and runtime performance. Meshopt compression can further optimize models compressed with Draco.

The function also has static methods for preloading and setting the decoder path for Draco:

- `injectGLTF.preload(path: () => TUrl, options): void`: Preloads a GLTF model into the cache.
- `injectGLTF.setDecoderPath(path: string): void`: Sets the decoder path for Draco.

```ts
@Component({
	selector: 'app-suzi',
	standalone: true,
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
		const { scene, materials } = gltf;
		scene.traverse((obj) => (obj as any).isMesh && (obj.receiveShadow = obj.castShadow = true));

		const material = materials['default'] as MeshStandardMaterial;

		material.color.set('orange');
		material.roughness = 0;
		material.normalMap = new CanvasTexture(new FlakesTexture(), UVMapping, RepeatWrapping, RepeatWrapping);
		material.normalMap.flipY = false;
		material.normalMap.repeat.set(40, 40);
		material.normalScale.set(0.05, 0.05);

		return scene;
	});
}
```

## `injectTexture`

Injects and loads textures into your Angular component. It takes a function input that returns the URL(s) of the texture(s) and an optional onLoad callback. It returns a signal that holds the loading results.

The function also has a static method for preloading textures:

- `injectTexture.preload(input: () => TInput): void`: Preloads a texture into the cache.

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

## `injectProgress`

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

Injects a signal that tracks the progress of asset loading in your Angular component. It returns a signal that holds an object with information about the loading progress, errors, and the currently loading item.

## `NgtsLoader`

A component that renders a loading screen while THREE.js assets are being loaded.

### Object Inputs (`NgtsLoaderOptions`)

| Property            | Description                                                              | Default value                                   |
| ------------------- | ------------------------------------------------------------------------ | ----------------------------------------------- |
| `containerClass`    | Additional CSS classes for the loader's container.                       | `''`                                            |
| `innerClass`        | Additional CSS classes for the inner loader element.                     | `''`                                            |
| `barClass`          | Additional CSS classes for the loader bar element.                       | `''`                                            |
| `dataClass`         | Additional CSS classes for the text element displaying loading progress. | `''`                                            |
| `dataInterpolation` | A function that formats the displayed loading progress.                  | `(value: number) => 'Loading ${p.toFixed(2)}%'` |
| `initialState`      | A function that determines the initial visibility of the loader.         | `(value: boolean) => value`                     |

`NgtsLoader` is a normal Angular component that renders HTML so it must be put on the same level of `ngt-canvas`, not within.

```html
<ngt-canvas />
<ngts-loader [options]="loaderOptions" />
```
