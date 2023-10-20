import { NgIf } from '@angular/common';
import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, effect, Input } from '@angular/core';
import {
	extend,
	getLocalState,
	injectBeforeRender,
	injectNgtRef,
	injectNgtStore,
	NgtKey,
	signalStore,
	type NgtShaderMaterial,
} from 'angular-three';
import { MeshRefractionMaterial } from 'angular-three-soba/shaders';
import { MeshBVH, MeshBVHUniformStruct, SAH } from 'three-mesh-bvh';
import type { NgtsMeshTranmissionMaterialState } from '../mesh-transmission-material/mesh-transmission-material';

extend({ MeshRefractionMaterial });

export type NgtsMeshRefractionMaterialState = {
	/** Environment map */
	envMap: THREE.CubeTexture | THREE.Texture;
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
};

declare global {
	interface HTMLElementTagNameMap {
		/**
		 * @extends ngt-shader-material
		 */
		'ngts-mesh-refraction-material': NgtsMeshTranmissionMaterialState & NgtShaderMaterial;
	}
}

const isCubeTexture = (def: THREE.CubeTexture | THREE.Texture): def is THREE.CubeTexture =>
	def && (def as THREE.CubeTexture).isCubeTexture;

@Component({
	selector: 'ngts-mesh-refraction-material',
	standalone: true,
	template: `
		<ngt-mesh-refraction-material
			*ngIf="defines() as defines"
			[key]="defines"
			[ref]="materialRef"
			[defines]="defines"
			[resolution]="resolution()"
			[aberrationStrength]="aberrationStrength()"
			[envMap]="envMap()"
			[bounces]="bounces()"
			[ior]="ior()"
			[fresnel]="fresnel()"
			[color]="color()"
			[fastChroma]="fastChroma()"
			ngtCompound
			attach="material"
		>
			<ng-content />
		</ngt-mesh-refraction-material>
	`,
	imports: [NgIf, NgtKey],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsMeshRefractionMaterial {
	private inputs = signalStore<NgtsMeshRefractionMaterialState>({ aberrationStrength: 0, fastChroma: true });

	@Input() materialRef = injectNgtRef<InstanceType<typeof MeshRefractionMaterial>>();
	/** Environment map */
	@Input({ required: true, alias: 'envMap' }) set _envMap(envMap: THREE.CubeTexture | THREE.Texture) {
		this.inputs.set({ envMap });
	}
	/** Number of ray-cast bounces, it can be expensive to have too many, 2 */
	@Input({ alias: 'bounces' }) set _bounces(bounces: number) {
		this.inputs.set({ bounces });
	}
	/** Refraction index, 2.4 */
	@Input({ alias: 'ior' }) set _ior(ior: number) {
		this.inputs.set({ ior });
	}
	/** Fresnel (strip light), 0 */
	@Input({ alias: 'fresnel' }) set _fresnel(fresnel: number) {
		this.inputs.set({ fresnel });
	}
	/** RGB shift intensity, can be expensive, 0 */
	@Input({ alias: 'aberrationStrength' }) set _aberrationStrength(aberrationStrength: number) {
		this.inputs.set({ aberrationStrength });
	}
	/** Color, white */
	@Input({ alias: 'color' }) set _color(color: THREE.ColorRepresentation) {
		this.inputs.set({ color });
	}
	/** If this is on it uses fewer ray casts for the RGB shift sacrificing physical accuracy, true */
	@Input({ alias: 'fastChroma' }) set _fastChroma(fastChroma: boolean) {
		this.inputs.set({ fastChroma });
	}

	envMap = this.inputs.select('envMap');
	bounces = this.inputs.select('bounces');
	ior = this.inputs.select('ior');
	fresnel = this.inputs.select('fresnel');
	aberrationStrength = this.inputs.select('aberrationStrength');
	color = this.inputs.select('color');
	fastChroma = this.inputs.select('fastChroma');

	private store = injectNgtStore();
	private size = this.store.select('size');

	defines = computed(() => {
		const [envMap, aberrationStrength, fastChroma] = [this.envMap(), this.aberrationStrength(), this.fastChroma()];
		if (!envMap) return null;

		const temp = {} as { [key: string]: string };
		// Sampler2D and SamplerCube need different defines
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
	resolution = computed(() => [this.size().width, this.size().height]);

	constructor() {
		injectBeforeRender(({ camera }) => {
			const material = this.materialRef.nativeElement;
			if (material) {
				(material as any)['viewMatrixInverse'] = camera.matrixWorld;
				(material as any)['projectionMatrixInverse'] = camera.projectionMatrixInverse;
			}
		});
		this.setupGeometry();
	}

	private setupGeometry() {
		effect(() => {
			const material = this.materialRef.nativeElement;
			if (!material) return;
			const geometry = getLocalState(material).instanceStore?.select('parent')()?.geometry;
			if (geometry) {
				(material as any).bvh = new MeshBVHUniformStruct();
				(material as any).bvh.updateFrom(
					new MeshBVH(geometry.clone().toNonIndexed(), { lazyGeneration: false, strategy: SAH } as any),
				);
			}
		});
	}
}
