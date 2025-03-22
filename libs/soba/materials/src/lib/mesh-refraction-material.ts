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

export interface NgtsMeshRefractionMaterialOptions extends Partial<NgtThreeElements['ngt-shader-material']> {
	/** Number of ray-cast bounces, it can be expensive to have too many, 2 */
	bounces: number;
	/** Refraction index, 2.4 */
	ior: number;
	/** Fresnel (strip light), 0 */
	fresnel: number;
	/** RGB shift intensity, can be expensive, 0 */
	aberrationStrength: number;
	/** Color, white */
	color: THREE.ColorRepresentation;
	/** If this is on it uses fewer ray casts for the RGB shift sacrificing physical accuracy, true */
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
	envMap = input.required<THREE.CubeTexture | THREE.Texture>();
	attach = input<NgtAttachable>('material');
	options = input(defaultOptions, { transform: mergeInputs(defaultOptions) });
	protected parameters = omit(this.options, ['fastChroma', 'aberrationStrength']);

	private fastChroma = pick(this.options, 'fastChroma');
	protected aberrationStrength = pick(this.options, 'aberrationStrength');

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

		const w = (isCubeMap ? envMap.image[0]?.width : envMap.image.width) ?? 1024;
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
