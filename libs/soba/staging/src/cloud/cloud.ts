import { NgFor, NgIf } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, Component, Input, computed, inject } from '@angular/core';
import {
    NgtSignalStore,
    NgtStore,
    extend,
    injectNgtRef,
    type NgtBeforeRenderEvent,
    type NgtGroup,
} from 'angular-three';
import { NgtsBillboard } from 'angular-three-soba/abstractions';
import { injectNgtsTextureLoader } from 'angular-three-soba/loaders';
import { Group, Mesh, MeshStandardMaterial, PlaneGeometry } from 'three';

const CLOUD_URL = 'https://rawcdn.githack.com/pmndrs/drei-assets/9225a9f1fbd449d9411125c2f419b843d0308c9f/cloud.png';
injectNgtsTextureLoader.preload(() => CLOUD_URL);

extend({ Group, Mesh, PlaneGeometry, MeshStandardMaterial });

export interface NgtsCloudState {
    opacity: number;
    speed: number;
    width: number;
    depth: number;
    segments: number;
    texture: string;
    color: THREE.ColorRepresentation;
    depthTest: boolean;
}

declare global {
    interface HTMLElementTagNameMap {
        'ngts-cloud': NgtsCloudState & NgtGroup;
    }
}

@Component({
    selector: 'ngts-cloud',
    standalone: true,
    template: `
        <ngt-group ngtCompound [ref]="groupRef">
            <ngt-group
                [position]="[0, 0, (cloudSegments() / 2) * cloudDepth()]"
                (beforeRender)="onBeforeRender($event)"
            >
                <ngts-billboard
                    *ngFor="let cloud of clouds(); let i = index"
                    [position]="[cloud.x, cloud.y, -i * cloudDepth()]"
                >
                    <ngt-mesh [scale]="cloud.scale" [rotation]="[0, 0, 0]">
                        <ngt-plane-geometry />
                        <!-- we use ngIf here for texture because by the time ngt-value is initialized -->
                        <!-- [map] has not been resolved yet. we ngIf it so that texture is available before hand -->
                        <ngt-mesh-standard-material
                            *ngIf="cloudTexture() as cloudTexture"
                            [transparent]="true"
                            [map]="cloudTexture"
                            [depthTest]="cloudDepthTest()"
                            [opacity]="(cloud.scale / 6) * cloud.density * cloudOpacity()"
                            [color]="cloudColor()"
                        >
                            <ngt-value [rawValue]="encoding()" attach="map.encoding" />
                        </ngt-mesh-standard-material>
                    </ngt-mesh>
                </ngts-billboard>
            </ngt-group>
        </ngt-group>
    `,
    imports: [NgFor, NgtsBillboard, NgIf],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsCloud extends NgtSignalStore<NgtsCloudState> {
    @Input() groupRef = injectNgtRef<Group>();

    @Input() set opacity(opacity: number) {
        this.set({ opacity });
    }

    @Input() set speed(speed: number) {
        this.set({ speed });
    }

    @Input() set width(width: number) {
        this.set({ width });
    }

    @Input() set depth(depth: number) {
        this.set({ depth });
    }

    @Input() set segments(segments: number) {
        this.set({ segments });
    }

    @Input() set texture(texture: string) {
        this.set({ texture });
    }

    @Input() set color(color: THREE.ColorRepresentation) {
        this.set({ color });
    }

    @Input() set depthTest(depthTest: boolean) {
        this.set({ depthTest });
    }

    readonly #store = inject(NgtStore);

    readonly #width = this.select('width');
    readonly #speed = this.select('speed');

    readonly cloudSegments = this.select('segments');
    readonly cloudDepth = this.select('depth');
    readonly cloudDepthTest = this.select('depthTest');
    readonly cloudOpacity = this.select('opacity');
    readonly cloudColor = this.select('color');
    readonly encoding = this.#store.select('gl', 'outputEncoding');

    readonly cloudTexture = injectNgtsTextureLoader(this.select('texture'));
    readonly clouds = computed(() =>
        [...new Array(this.cloudSegments())].map((_, index) => ({
            x: this.#width() / 2 - Math.random() * this.#width(),
            y: this.#width() / 2 - Math.random() * this.#width(),
            scale: 0.4 + Math.sin(((index + 1) / this.cloudSegments()) * Math.PI) * ((0.2 + Math.random()) * 10),
            density: Math.max(0.2, Math.random()),
            rotation: Math.max(0.002, 0.005 * Math.random()) * this.#speed(),
        }))
    );

    constructor() {
        super({
            opacity: 0.5,
            speed: 0.4,
            width: 10,
            depth: 1.5,
            segments: 20,
            texture: CLOUD_URL,
            color: '#ffffff',
            depthTest: true,
        });
    }

    onBeforeRender({ state, object }: NgtBeforeRenderEvent<Group>) {
        const clouds = this.clouds();
        object.children.forEach((cloud, index) => {
            cloud.children[0].rotation.z += clouds[index].rotation;
            cloud.children[0].scale.setScalar(
                clouds[index].scale + (((1 + Math.sin(state.clock.getElapsedTime() / 10)) / 2) * index) / 10
            );
        });
    }
}
