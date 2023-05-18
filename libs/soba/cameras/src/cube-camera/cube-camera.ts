import { NgIf, NgTemplateOutlet } from '@angular/common';
import {
    CUSTOM_ELEMENTS_SCHEMA,
    Component,
    ContentChild,
    ElementRef,
    Input,
    ViewChild,
    computed,
    inject,
} from '@angular/core';
import { NgtArgs, NgtSignalStore, NgtStore, extend, injectBeforeRender, injectNgtRef } from 'angular-three';
import * as THREE from 'three';
import { CubeCamera, Group } from 'three';
import { NgtsCameraContent } from '../camera/camera-content';

extend({ Group, CubeCamera });

export interface NgtsCubeCameraState {
    /** Number of frames to render, Infinity */
    frames: number;
    /** Resolution of the FBO, 256 */
    resolution: number;
    /** Camera near, 0.1 */
    near: number;
    /** Camera far, 1000 */
    far: number;
    /** Custom environment map that is temporarily set as the scenes background */
    envMap: THREE.Texture;
    /** Custom fog that is temporarily set as the scenes fog */
    fog: THREE.Fog | THREE.FogExp2;
}

@Component({
    selector: 'ngts-cube-camera',
    standalone: true,
    template: `
        <ngt-group ngtCompound>
            <ngt-cube-camera [ref]="cameraRef" *args="cameraArgs()" />
            <ngt-group #group>
                <ng-container
                    *ngIf="cameraContent && cameraContent.ngtsCameraContent && fbo()"
                    [ngTemplateOutlet]="cameraContent.template"
                    [ngTemplateOutletContext]="{ fbo: fbo(), group }"
                />
            </ngt-group>
        </ngt-group>
    `,
    imports: [NgIf, NgTemplateOutlet, NgtArgs],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsCubeCamera extends NgtSignalStore<NgtsCubeCameraState> {
    @ViewChild('group', { static: true }) groupRef!: ElementRef<THREE.Group>;
    @ContentChild(NgtsCameraContent) cameraContent?: NgtsCameraContent;

    @Input() cameraRef = injectNgtRef<THREE.CubeCamera>();

    /** Number of frames to render, Infinity */
    @Input() set frames(frames: number) {
        this.set({ frames });
    }
    /** Resolution of the FBO, 256 */
    @Input() set resolution(resolution: number) {
        this.set({ resolution });
    }
    /** Camera near, 0.1 */
    @Input() set near(near: number) {
        this.set({ near });
    }
    /** Camera far, 1000 */
    @Input() set far(far: number) {
        this.set({ far });
    }
    /** Custom environment map that is temporarily set as the scenes background */
    @Input() set envMap(envMap: THREE.Texture) {
        this.set({ envMap });
    }
    /** Custom fog that is temporarily set as the scenes fog */
    @Input() set fog(fog: THREE.Fog | THREE.FogExp2) {
        this.set({ fog });
    }

    readonly #store = inject(NgtStore);

    readonly #resolution = this.select('resolution');
    readonly #near = this.select('near');
    readonly #far = this.select('far');

    readonly fbo = computed(() => {
        const resolution = this.#resolution();
        const fbo = new THREE.WebGLCubeRenderTarget(resolution);
        fbo.texture.encoding = this.#store.get('gl').outputEncoding;
        fbo.texture.type = THREE.HalfFloatType;
        return fbo;
    });

    readonly cameraArgs = computed(() => [this.#near(), this.#far(), this.fbo()]);

    constructor() {
        super({ frames: Infinity, resolution: 256, near: 0.1, far: 1000 });

        let count = 0;
        let originalFog: THREE.Scene['fog'];
        let originalBackground: THREE.Scene['background'];
        injectBeforeRender(({ scene, gl }) => {
            const { frames, envMap, fog } = this.get();
            if (
                envMap &&
                this.cameraRef.nativeElement &&
                this.groupRef.nativeElement &&
                (frames === Infinity || count < frames)
            ) {
                this.groupRef.nativeElement.visible = false;
                originalFog = scene.fog;
                originalBackground = scene.background;
                scene.background = envMap || originalBackground;
                scene.fog = fog || originalFog;
                this.cameraRef.nativeElement.update(gl, scene);
                scene.fog = originalFog;
                scene.background = originalBackground;
                this.groupRef.nativeElement.visible = true;
                count++;
            }
        });
    }
}
