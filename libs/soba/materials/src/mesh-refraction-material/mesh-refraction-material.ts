import { NgIf } from '@angular/common';
import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, effect, inject, Input } from '@angular/core';
import { extend, getLocalState, injectBeforeRender, injectNgtRef, NgtSignalStore, NgtStore } from 'angular-three';
import { MeshRefractionMaterial } from 'angular-three-soba/shaders';
import { MeshBVH, SAH } from 'three-mesh-bvh';

extend({ MeshRefractionMaterial });

export interface NgtsMeshRefractionMaterialState {
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
}

const isCubeTexture = (def: THREE.CubeTexture | THREE.Texture): def is THREE.CubeTexture =>
    def && (def as THREE.CubeTexture).isCubeTexture;

@Component({
    selector: 'ngts-mesh-refraction-material',
    standalone: true,
    template: `
        <ngt-mesh-refraction-material
            *ngIf="defines() as defines"
            [ref]="materialRef"
            [defines]="defines"
            [resolution]="resolution()"
            [aberrationStrength]="refractionAberrationStrength()"
            [envMap]="refractionEnvMap()"
            [bounces]="refractionBounces()"
            [ior]="refractionIor()"
            [fresnel]="refractionFresnel()"
            [color]="refractionColor()"
            [fastChroma]="refractionFastChroma()"
            ngtCompound
            attach="material"
        >
            <ng-content />
        </ngt-mesh-refraction-material>
    `,
    imports: [NgIf],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsMeshRefractionMaterial extends NgtSignalStore<NgtsMeshRefractionMaterialState> {
    @Input() materialRef = injectNgtRef<InstanceType<typeof MeshRefractionMaterial>>();
    /** Environment map */
    @Input({ required: true }) set envMap(envMap: THREE.CubeTexture | THREE.Texture) {
        this.set({ envMap });
    }
    /** Number of ray-cast bounces, it can be expensive to have too many, 2 */
    @Input() set bounces(bounces: number) {
        this.set({ bounces });
    }
    /** Refraction index, 2.4 */
    @Input() set ior(ior: number) {
        this.set({ ior });
    }
    /** Fresnel (strip light), 0 */
    @Input() set fresnel(fresnel: number) {
        this.set({ fresnel });
    }
    /** RGB shift intensity, can be expensive, 0 */
    @Input() set aberrationStrength(aberrationStrength: number) {
        this.set({ aberrationStrength });
    }
    /** Color, white */
    @Input() set color(color: THREE.ColorRepresentation) {
        this.set({ color });
    }
    /** If this is on it uses fewer ray casts for the RGB shift sacrificing physical accuracy, true */
    @Input() set fastChroma(fastChroma: boolean) {
        this.set({ fastChroma });
    }

    readonly refractionEnvMap = this.select('envMap');
    readonly refractionBounces = this.select('bounces');
    readonly refractionIor = this.select('ior');
    readonly refractionFresnel = this.select('fresnel');
    readonly refractionAberrationStrength = this.select('aberrationStrength');
    readonly refractionColor = this.select('color');
    readonly refractionFastChroma = this.select('fastChroma');

    readonly #store = inject(NgtStore);
    readonly #size = this.#store.select('size');

    readonly #envMap = this.select('envMap');

    readonly defines = computed(() => {
        const envMap = this.#envMap();
        if (!envMap) return null;

        const aberrationStrength = this.refractionAberrationStrength();
        const fastChroma = this.refractionFastChroma();

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
    readonly resolution = computed(() => [this.#size().width, this.#size().height]);

    constructor() {
        super({ aberrationStrength: 0, fastChroma: true });
        injectBeforeRender(({ camera }) => {
            if (this.materialRef.nativeElement) {
                (this.materialRef.nativeElement as any)!.viewMatrixInverse = camera.matrixWorld;
                (this.materialRef.nativeElement as any)!.projectionMatrixInverse = camera.projectionMatrixInverse;
            }
        });
        this.#setupGeometry();
    }

    #setupGeometry() {
        effect(() => {
            const material = this.materialRef.nativeElement;
            if (!material) return;
            const geometry = getLocalState(material).parent()?.geometry;
            if (geometry) {
                (material as any).bvh.updateFrom(
                    new MeshBVH(geometry.toNonIndexed(), { lazyGeneration: false, strategy: SAH } as any)
                );
            }
        });
    }
}
