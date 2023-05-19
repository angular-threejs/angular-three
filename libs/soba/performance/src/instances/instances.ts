import {
    CUSTOM_ELEMENTS_SCHEMA,
    Component,
    ElementRef,
    InjectionToken,
    Input,
    Signal,
    computed,
    effect,
    signal,
} from '@angular/core';
import {
    NgtArgs,
    NgtSignalStore,
    checkUpdate,
    extend,
    injectBeforeRender,
    injectNgtRef,
    requestAnimationInInjectionContext,
} from 'angular-three';
import * as THREE from 'three';
import { InstancedBufferAttribute, InstancedMesh } from 'three';
import { PositionMesh } from './position-mesh';

extend({ InstancedMesh, InstancedBufferAttribute });

export interface NgtsInstancesState {
    range: number;
    limit: number;
    frames: number;
}

export interface NgtsInstancesApi {
    getParent: () => ElementRef<InstancedMesh>;
    subscribe: (ref: ElementRef<PositionMesh>) => () => void;
}

export const NGTS_INSTANCES_API = new InjectionToken<Signal<NgtsInstancesApi>>('NgtsInstances API');

@Component({
    selector: 'ngts-instances',
    standalone: true,
    template: `
        <ngt-instanced-mesh
            *args="[undefined, undefined, 0]"
            ngtCompound
            [ref]="instancesRef"
            [matrixAutoUpdate]="false"
            [raycast]="nullRaycast"
            [userData]="{ instances }"
        >
            <ngt-instanced-buffer-attribute
                attach="instanceMatrix"
                [count]="matrices().length / 16"
                [array]="matrices()"
                [itemSize]="16"
                [usage]="DynamicDrawUsage"
            />
            <ngt-instanced-buffer-attribute
                attach="instanceColor"
                [count]="colors().length / 3"
                [array]="colors()"
                [itemSize]="3"
                [usage]="DynamicDrawUsage"
            />

            <ng-content />
        </ngt-instanced-mesh>
    `,
    imports: [NgtArgs],
    providers: [
        { provide: NGTS_INSTANCES_API, useFactory: (instances: NgtsInstances) => instances.api, deps: [NgtsInstances] },
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsInstances extends NgtSignalStore<NgtsInstancesState> {
    readonly nullRaycast = () => null;
    readonly DynamicDrawUsage = THREE.DynamicDrawUsage;

    @Input() instancesRef = injectNgtRef<THREE.InstancedMesh>();

    @Input({ required: true }) set range(range: number) {
        this.set({ range });
    }

    @Input() set limit(limit: number) {
        this.set({ limit });
    }

    @Input() set frames(frames: number) {
        this.set({ frames });
    }

    readonly #parentMatrix = new THREE.Matrix4();
    readonly #instanceMatrix = new THREE.Matrix4();
    readonly #tempMatrix = new THREE.Matrix4();
    readonly #translation = new THREE.Vector3();
    readonly #rotation = new THREE.Quaternion();
    readonly #scale = new THREE.Vector3();

    readonly #limit = this.select('limit');

    readonly matrices = computed(() => {
        const limit = this.#limit();
        const mArray = new Float32Array(limit * 16);
        for (let i = 0; i < limit; i++) this.#tempMatrix.identity().toArray(mArray, i * 16);
        return mArray;
    });
    readonly colors = computed(() => {
        const limit = this.#limit();
        return new Float32Array([...new Array(limit * 3)].map(() => 1));
    });

    readonly instances = signal<Array<ElementRef<PositionMesh>>>([]);

    readonly api = computed(() => ({
        getParent: () => this.instancesRef,
        subscribe: (ref: ElementRef<PositionMesh>) => {
            this.instances.update((prev) => [...prev, ref]);
            return () =>
                this.instances.update((prev) =>
                    prev.filter((instance) => instance.nativeElement !== ref.nativeElement)
                );
        },
    }));

    constructor() {
        super({ limit: 1000, frames: Infinity });
        requestAnimationInInjectionContext(() => {
            this.#checkUpdate();
            this.#setBeforeRender();
        });
    }

    #checkUpdate() {
        effect(() => {
            const instances = this.instancesRef.nativeElement;
            if (!instances) return;
            checkUpdate(instances.instanceMatrix);
        });
    }

    #setBeforeRender() {
        let count = 0;
        let updateRange = 0;
        injectBeforeRender(() => {
            const instances = this.instancesRef.nativeElement;
            if (!instances) return;

            const { frames, range, limit } = this.get();
            const meshes = this.instances();
            const colors = this.colors();
            const matrices = this.matrices();
            if (frames === Infinity || count < frames) {
                instances.updateMatrix();
                instances.updateMatrixWorld();
                this.#parentMatrix.copy(instances.matrixWorld).invert();

                updateRange = Math.min(limit, range !== undefined ? range : limit, meshes.length);
                instances.count = updateRange;
                instances.instanceMatrix.updateRange.count = updateRange * 16;
                if (instances.instanceColor) {
                    instances.instanceColor.updateRange.count = updateRange * 3;
                }

                for (let i = 0; i < meshes.length; i++) {
                    const instance = meshes[i].nativeElement;
                    // Multiply the inverse of the InstancedMesh world matrix or else
                    // Instances will be double-transformed if <Instances> isn't at identity
                    instance.matrixWorld.decompose(this.#translation, this.#rotation, this.#scale);
                    this.#instanceMatrix
                        .compose(this.#translation, this.#rotation, this.#scale)
                        .premultiply(this.#parentMatrix);
                    this.#instanceMatrix.toArray(matrices, i * 16);
                    instances.instanceMatrix.needsUpdate = true;
                    instance.color.toArray(colors, i * 3);
                    if (instances.instanceColor) {
                        checkUpdate(instances.instanceColor);
                    }
                }
                count++;
            }
        });
    }
}
