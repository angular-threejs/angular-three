import {
	afterNextRender,
	ChangeDetectionStrategy,
	Component,
	computed,
	CUSTOM_ELEMENTS_SCHEMA,
	DestroyRef,
	ElementRef,
	inject,
	input,
	untracked,
	viewChild,
} from '@angular/core';
import {
	getLocalState,
	injectBeforeRender,
	injectStore,
	NgtAnyRecord,
	NgtArgs,
	NgtAttachable,
	NgtShaderMaterial,
	omit,
	pick,
} from 'angular-three';
import { MeshRefractionMaterial } from 'angular-three-soba/shaders';
import { injectAutoEffect } from 'ngxtension/auto-effect';
import { mergeInputs } from 'ngxtension/inject-inputs';
import { ColorRepresentation, CubeTexture, Mesh, Texture } from 'three';
import { MeshBVH, MeshBVHUniformStruct, SAH } from 'three-mesh-bvh';

export interface NgtsMeshRefractionMaterialOptions extends Partial<NgtShaderMaterial> {
	/** Number of ray-cast bounces, it can be expensive to have too many, 2 */
	bounces: number;
	/** Refraction index, 2.4 */
	ior: number;
	/** Fresnel (strip light), 0 */
	fresnel: number;
	/** RGB shift intensity, can be expensive, 0 */
	aberrationStrength: number;
	/** Color, white */
	color: ColorRepresentation;
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

function isCubeTexture(def: CubeTexture | Texture): def is CubeTexture {
	return def && (def as CubeTexture).isCubeTexture;
}

@Component({
	selector: 'ngts-mesh-refraction-material',
	standalone: true,
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
	envMap = input.required<CubeTexture | Texture>();
	attach = input<NgtAttachable>('material');
	options = input(defaultOptions, { transform: mergeInputs(defaultOptions) });
	parameters = omit(this.options, ['fastChroma', 'aberrationStrength']);

	private fastChroma = pick(this.options, 'fastChroma');
	aberrationStrength = pick(this.options, 'aberrationStrength');

	materialRef = viewChild<ElementRef<InstanceType<typeof MeshRefractionMaterial>>>('material');

	private store = injectStore();
	private size = this.store.select('size');

	resolution = computed(() => [this.size().width, this.size().height]);
	defines = computed(() => {
		const temp = {} as { [key: string]: string };
		const [envMap, aberrationStrength, fastChroma] = [
			untracked(this.envMap),
			this.aberrationStrength(),
			this.fastChroma(),
		];
		const isCubeMap = isCubeTexture(envMap);

		const w = (isCubeMap ? envMap.image[0]?.width : envMap.image.width) ?? 1024;
		const cubeSize = w / 4;
		const _lodMax = Math.floor(Math.log2(cubeSize));
		const _cubeSize = Math.pow(2, _lodMax);
		const width = 3 * Math.max(_cubeSize, 16 * 7);
		const height = 4 * _cubeSize;

		if (isCubeMap) temp['ENVMAP_TYPE_CUBEM'] = '';
		temp['CUBEUV_TEXEL_WIDTH'] = `${1.0 / width}`;
		temp['CUBEUV_TEXEL_HEIGHT'] = `${1.0 / height}`;
		temp['CUBEUV_MAX_MIP'] = `${_lodMax}.0`;

		// Add defines from chromatic aberration
		if (aberrationStrength > 0) temp['CHROMATIC_ABERRATIONS'] = '';
		if (fastChroma) temp['FAST_CHROMA'] = '';

		return temp;
	});

	private defineKeys = computed(() => {
		return Object.keys(this.defines()).join(' ');
	});

	material = computed(() => {
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
		const autoEffect = injectAutoEffect();

		afterNextRender(() => {
			autoEffect(() => {
				const material = this.materialRef()?.nativeElement;
				if (!material) return;

				const localState = getLocalState(material);
				if (!localState) return;

				const parent = untracked(localState.parent);
				const geometry = (parent as Mesh).geometry;
				if (geometry) {
					(material as any).bvh = new MeshBVHUniformStruct();
					(material as any).bvh.updateFrom(new MeshBVH(geometry.clone().toNonIndexed(), { strategy: SAH }));
				}
			});
		});

		injectBeforeRender(({ camera }) => {
			const material = this.materialRef()?.nativeElement;
			if (material) {
				(material as any).viewMatrixInverse = camera.matrixWorld;
				(material as any).projectionMatrixInverse = camera.projectionMatrixInverse;
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
