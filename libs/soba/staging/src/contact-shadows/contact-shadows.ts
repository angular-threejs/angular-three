import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, Input } from '@angular/core';
import {
    extend,
    injectBeforeRender,
    injectNgtRef,
    NgtArgs,
    NgtSignalStore,
    NgtStore,
    type NgtGroup,
    type NgtRenderState,
} from 'angular-three';
import * as THREE from 'three';
import { Group, Mesh, MeshBasicMaterial, OrthographicCamera } from 'three';
import { HorizontalBlurShader, VerticalBlurShader } from 'three-stdlib';

extend({ Group, Mesh, MeshBasicMaterial, OrthographicCamera });

export interface NgtsContactShadowsState {
    opacity: number;
    width: number;
    height: number;
    blur: number;
    far: number;
    smooth: boolean;
    resolution: number;
    frames: number;
    scale: number | [x: number, y: number];
    color: THREE.ColorRepresentation;
    depthWrite: boolean;
    renderOrder: number;
}

declare global {
    interface HTMLElementTagNameMap {
        'ngts-contact-shadows': NgtsContactShadowsState & NgtGroup;
    }
}

@Component({
    selector: 'ngts-contact-shadows',
    standalone: true,
    template: `
        <ngt-group ngtCompound [ref]="contactShadowsRef" [rotation]="[Math.PI / 2, 0, 0]">
            <ngt-mesh
                [renderOrder]="shadowRenderOrder() ?? 0"
                [geometry]="contactShadows().planeGeometry"
                [scale]="[1, -1, 1]"
                [rotation]="[-Math.PI / 2, 0, 0]"
            >
                <ngt-mesh-basic-material
                    [map]="contactShadows().renderTarget.texture"
                    [transparent]="true"
                    [opacity]="shadowOpacity() ?? 1"
                    [depthWrite]="shadowDepthWrite() ?? false"
                >
                    <ngt-value [rawValue]="encoding()" attach="map.encoding" />
                </ngt-mesh-basic-material>
            </ngt-mesh>
            <ngt-orthographic-camera *args="cameraArgs()" [ref]="shadowCameraRef" />
        </ngt-group>
    `,
    imports: [NgtArgs],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsContactShadows extends NgtSignalStore<NgtsContactShadowsState> {
    @Input() contactShadowsRef = injectNgtRef<Group>();

    @Input() set opacity(opacity: number) {
        this.set({ opacity });
    }

    @Input() set width(width: number) {
        this.set({ width });
    }

    @Input() set height(height: number) {
        this.set({ height });
    }

    @Input() set blur(blur: number) {
        this.set({ blur });
    }

    @Input() set far(far: number) {
        this.set({ far });
    }

    @Input() set smooth(smooth: boolean) {
        this.set({ smooth });
    }

    @Input() set resolution(resolution: number) {
        this.set({ resolution });
    }

    @Input() set frames(frames: number) {
        this.set({ frames });
    }

    @Input() set scale(scale: number | [x: number, y: number]) {
        this.set({ scale });
    }

    @Input() set color(color: THREE.ColorRepresentation) {
        this.set({ color });
    }

    @Input() set depthWrite(depthWrite: boolean) {
        this.set({ depthWrite });
    }

    @Input() set renderOrder(renderOrder: number) {
        this.set({ renderOrder });
    }

    readonly Math = Math;
    readonly #store = inject(NgtStore);

    readonly shadowCameraRef = injectNgtRef<OrthographicCamera>();

    readonly #scale = this.select('scale');
    readonly #width = this.select('width');
    readonly #height = this.select('height');
    readonly #far = this.select('far');
    readonly #resolution = this.select('resolution');
    readonly #color = this.select('color');

    readonly #scaledWidth = computed(() => {
        const scale = this.#scale();
        return this.#width() * (Array.isArray(scale) ? scale[0] : scale || 1);
    });
    readonly #scaledHeight = computed(() => {
        const scale = this.#scale();
        return this.#height() * (Array.isArray(scale) ? scale[1] : scale || 1);
    });

    readonly encoding = this.#store.select('gl', 'outputEncoding');
    readonly shadowRenderOrder = this.select('renderOrder');
    readonly shadowOpacity = this.select('opacity');
    readonly shadowDepthWrite = this.select('depthWrite');

    readonly cameraArgs = computed(() => {
        const width = this.#scaledWidth();
        const height = this.#scaledHeight();
        return [-width / 2, width / 2, height / 2, -height / 2, 0, this.#far()];
    });
    readonly contactShadows = computed(() => {
        const color = this.#color();
        const resolution = this.#resolution();
        const renderTarget = new THREE.WebGLRenderTarget(resolution, resolution);
        const renderTargetBlur = new THREE.WebGLRenderTarget(resolution, resolution);
        renderTargetBlur.texture.generateMipmaps = renderTarget.texture.generateMipmaps = false;
        const planeGeometry = new THREE.PlaneGeometry(this.#scaledWidth(), this.#scaledHeight()).rotateX(Math.PI / 2);
        const blurPlane = new Mesh(planeGeometry);
        const depthMaterial = new THREE.MeshDepthMaterial();
        depthMaterial.depthTest = depthMaterial.depthWrite = false;
        depthMaterial.onBeforeCompile = (shader) => {
            shader.uniforms = {
                ...shader.uniforms,
                ucolor: { value: new THREE.Color(color) },
            };
            shader.fragmentShader = shader.fragmentShader.replace(
                `void main() {`, //
                `uniform vec3 ucolor;
                 void main() {
                `
            );
            shader.fragmentShader = shader.fragmentShader.replace(
                'vec4( vec3( 1.0 - fragCoordZ ), opacity );',
                // Colorize the shadow, multiply by the falloff so that the center can remain darker
                'vec4( ucolor * fragCoordZ * 2.0, ( 1.0 - fragCoordZ ) * 1.0 );'
            );
        };

        const horizontalBlurMaterial = new THREE.ShaderMaterial(HorizontalBlurShader);
        const verticalBlurMaterial = new THREE.ShaderMaterial(VerticalBlurShader);
        verticalBlurMaterial.depthTest = horizontalBlurMaterial.depthTest = false;

        return {
            renderTarget,
            planeGeometry,
            depthMaterial,
            blurPlane,
            horizontalBlurMaterial,
            verticalBlurMaterial,
            renderTargetBlur,
        };
    });

    constructor() {
        super({
            scale: 10,
            frames: Infinity,
            opacity: 1,
            width: 1,
            height: 1,
            blur: 1,
            far: 10,
            resolution: 512,
            smooth: true,
            color: '#000000',
            depthWrite: false,
            renderOrder: 0,
        });
        injectBeforeRender(this.#onBeforeRender.bind(this, 0));
    }

    #onBeforeRender(count: number, { scene, gl }: NgtRenderState) {
        const { frames = Infinity, blur = 1, smooth = true } = this.get();
        const { depthMaterial, renderTarget } = this.contactShadows();
        const shadowCamera = this.shadowCameraRef.nativeElement;
        if (shadowCamera && (frames === Infinity || count < frames)) {
            const initialBackground = scene.background;
            scene.background = null;
            const initialOverrideMaterial = scene.overrideMaterial;
            scene.overrideMaterial = depthMaterial;
            gl.setRenderTarget(renderTarget);
            gl.render(scene, shadowCamera);
            scene.overrideMaterial = initialOverrideMaterial;

            this.#blurShadows(blur);
            if (smooth) this.#blurShadows(blur * 0.4);

            gl.setRenderTarget(null);
            scene.background = initialBackground;
            count++;
        }
    }

    #blurShadows(blur: number) {
        const { blurPlane, horizontalBlurMaterial, verticalBlurMaterial, renderTargetBlur, renderTarget } =
            this.contactShadows();
        const gl = this.#store.get('gl');
        const shadowCamera = this.shadowCameraRef.nativeElement;

        blurPlane.visible = true;

        blurPlane.material = horizontalBlurMaterial;
        horizontalBlurMaterial.uniforms['tDiffuse'].value = renderTarget.texture;
        horizontalBlurMaterial.uniforms['h'].value = (blur * 1) / 256;

        gl.setRenderTarget(renderTargetBlur);
        gl.render(blurPlane, shadowCamera);

        blurPlane.material = verticalBlurMaterial;
        verticalBlurMaterial.uniforms['tDiffuse'].value = renderTargetBlur.texture;
        verticalBlurMaterial.uniforms['v'].value = (blur * 1) / 256;

        gl.setRenderTarget(renderTarget);
        gl.render(blurPlane, shadowCamera);

        blurPlane.visible = false;
    }
}
