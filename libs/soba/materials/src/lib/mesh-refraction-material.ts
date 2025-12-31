import {
	ChangeDetectionStrategy,
	Component,
	computed,
	CUSTOM_ELEMENTS_SCHEMA,
	DestroyRef,
	effect,
	ElementRef,
	inject,
	input,
	untracked,
	viewChild,
} from '@angular/core';
import {
	beforeRender,
	getInstanceState,
	injectStore,
	is,
	NgtAnyRecord,
	NgtArgs,
	NgtAttachable,
	NgtThreeElements,
	omit,
	pick,
} from 'angular-three';
import { MeshRefractionMaterial } from 'angular-three-soba/shaders';
import { mergeInputs } from 'ngxtension/inject-inputs';
import * as THREE from 'three';
import { MeshBVH, MeshBVHUniformStruct, SAH } from 'three-mesh-bvh';

/**
 * Configuration options for the NgtsMeshRefractionMaterial component.
 */
export interface NgtsMeshRefractionMaterialOptions extends Partial<NgtThreeElements['ngt-shader-material']> {
	/**
	 * Number of ray-cast bounces. Higher values are more expensive.
	 * @default 2
	 */
	bounces: number;

	/**
	 * Index of refraction. Diamond is 2.4, glass is 1.5.
	 * @default 2.4
	 */
	ior: number;

	/**
	 * Fresnel effect intensity (strip light reflections).
	 * @default 0
	 */
	fresnel: number;

	/**
	 * RGB chromatic aberration shift intensity. Can be expensive.
	 * @default 0
	 */
	aberrationStrength: number;

	/**
	 * Base color of the refractive material.
	 * @default 'white'
	 */
	color: THREE.ColorRepresentation;

	/**
	 * Use fewer ray casts for RGB shift, sacrificing physical accuracy for performance.
	 * @default true
	 */
	fastChroma: boolean;
}

const defaultOptions: NgtsMeshRefractionMaterialOptions = {
	bounces: 2,
	ior: 2.4,
	fresnel: 0,
	aberrationStrength: 0,
	color: 'white',
	fastChroma: true,
};

/**
 * A material that simulates realistic light refraction through transparent objects.
 * Uses ray tracing with BVH acceleration for accurate light bending effects.
 * Ideal for diamonds, crystals, glass, and other transparent materials.
 *
 * @example
 * ```html
 * <ngt-mesh>
 *   <ngt-dodecahedron-geometry />
 *   <ngts-mesh-refraction-material
 *     [envMap]="environmentTexture"
 *     [options]="{ bounces: 3, ior: 2.4, fresnel: 1, aberrationStrength: 0.02 }"
 *   />
 * </ngt-mesh>
 * ```
 */
@Component({
	selector: 'ngts-mesh-refraction-material',
	template: `
		<ngt-primitive
			*args="[material()]"
			#material
			[attach]="attach()"
			[parameters]="parameters()"
			[envMap]="envMap()"
			[aberrationStrength]="aberrationStrength()"
			[resolution]="resolution()"
			[defines]="defines()"
		>
			<ng-content />
		</ngt-primitive>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtArgs],
})
export class NgtsMeshRefractionMaterial {
	/**
	 * Environment map texture for reflections and refractions.
	 * Required for the material to display properly.
	 */
	envMap = input.required<THREE.CubeTexture | THREE.Texture>();

	/**
	 * How to attach the material to its parent object.
	 * @default 'material'
	 */
	attach = input<NgtAttachable>('material');

	/**
	 * Configuration options for the refraction material.
	 */
	options = input(defaultOptions, { transform: mergeInputs(defaultOptions) });
	protected parameters = omit(this.options, ['fastChroma', 'aberrationStrength']);

	private fastChroma = pick(this.options, 'fastChroma');
	protected aberrationStrength = pick(this.options, 'aberrationStrength');

	/** Reference to the underlying MeshRefractionMaterial element. */
	materialRef = viewChild<ElementRef<InstanceType<typeof MeshRefractionMaterial>>>('material');

	private store = injectStore();

	protected resolution = computed(() => [this.store.size.width(), this.store.size.height()]);
	protected defines = computed(() => {
		const _defines = {} as { [key: string]: string };
		const [envMap, aberrationStrength, fastChroma] = [
			untracked(this.envMap),
			this.aberrationStrength(),
			this.fastChroma(),
		];
		const isCubeMap = is.three<THREE.CubeTexture>(envMap, 'isCubeTexture');

		const w =
			('width' in envMap
				? envMap.width
				: isCubeMap
					? (envMap as THREE.CubeTexture<{ width?: number }>).image[0]?.width
					: (envMap as THREE.Texture<{ width?: number }>).image.width) ?? 1024;
		const cubeSize = w / 4;
		const _lodMax = Math.floor(Math.log2(cubeSize));
		const _cubeSize = Math.pow(2, _lodMax);
		const width = 3 * Math.max(_cubeSize, 16 * 7);
		const height = 4 * _cubeSize;

		if (isCubeMap) _defines['ENVMAP_TYPE_CUBEM'] = '';
		_defines['CUBEUV_TEXEL_WIDTH'] = `${1.0 / width}`;
		_defines['CUBEUV_TEXEL_HEIGHT'] = `${1.0 / height}`;
		_defines['CUBEUV_MAX_MIP'] = `${_lodMax}.0`;

		// Add defines from chromatic aberration
		if (aberrationStrength > 0) _defines['CHROMATIC_ABERRATIONS'] = '';
		if (fastChroma) _defines['FAST_CHROMA'] = '';

		return _defines;
	});

	private defineKeys = computed(() => {
		return Object.keys(this.defines()).join(' ');
	});

	protected material = computed(() => {
		const prevMaterial = untracked(this.materialRef)?.nativeElement;

		if (prevMaterial) {
			prevMaterial.dispose();
			delete (prevMaterial as NgtAnyRecord)['__ngt__'];
			delete (prevMaterial as NgtAnyRecord)['__ngt_renderer__'];
		}

		// track by this.defineKeys
		this.defineKeys();
		return new MeshRefractionMaterial();
	});

	constructor() {
		effect(() => {
			const material = this.materialRef()?.nativeElement;
			if (!material) return;

			const instanceState = getInstanceState(material);
			if (!instanceState) return;

			const parent = untracked(instanceState.parent);
			const geometry = (parent as unknown as THREE.Mesh).geometry;
			if (geometry) {
				const bvh = new MeshBVHUniformStruct();
				bvh.updateFrom(new MeshBVH(geometry.clone().toNonIndexed(), { strategy: SAH }));
				Object.assign(material, { bvh });
			}
		});

		beforeRender(({ camera }) => {
			const material = this.materialRef()?.nativeElement;
			if (material) {
				Object.assign(material, {
					viewMatrixInverse: camera.matrixWorld,
					projectionMatrixInverse: camera.projectionMatrixInverse,
				});
			}
		});

		inject(DestroyRef).onDestroy(() => {
			const material = this.materialRef()?.nativeElement;
			if (material) {
				material.dispose();
				delete (material as NgtAnyRecord)['__ngt__'];
				delete (material as NgtAnyRecord)['__ngt_renderer__'];
			}
		});
	}
}
