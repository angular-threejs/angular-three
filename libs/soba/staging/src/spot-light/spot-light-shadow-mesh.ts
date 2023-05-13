import { NgIf } from '@angular/common';
import {
    CUSTOM_ELEMENTS_SCHEMA,
    Component,
    Injector,
    computed,
    effect,
    inject,
    runInInjectionContext,
} from '@angular/core';
import {
    NgtInjectedRef,
    assertInjectionContext,
    checkUpdate,
    extend,
    injectBeforeRender,
    injectNgtRef,
} from 'angular-three';
import * as THREE from 'three';
import { Mesh, MeshBasicMaterial, PlaneGeometry } from 'three';
import { FullScreenQuad } from 'three-stdlib';
import { NGTS_SPOT_LIGHT_API } from './spot-light';
import { NgtsSpotLightShadowMeshInput } from './spot-light-shadow-mesh-input';

const isSpotLight = (child: THREE.Object3D | null): child is THREE.SpotLight => {
    return (child as THREE.SpotLight)?.isSpotLight;
};

function injectShadowMeshCommon(
    spotLightRef: NgtInjectedRef<THREE.SpotLight>,
    meshRef: NgtInjectedRef<THREE.Mesh>,
    width: () => number,
    height: () => number,
    distance: () => number,
    injector?: Injector
) {
    injector = assertInjectionContext(injectShadowMeshCommon, injector);
    runInInjectionContext(injector, () => {
        const pos = new THREE.Vector3();
        const dir = new THREE.Vector3();

        effect(() => {
            const spotLight = spotLightRef.nativeElement;
            if (!spotLight) return;
            if (isSpotLight(spotLight)) {
                spotLight.shadow.mapSize.set(width(), height());
                checkUpdate(spotLight.shadow);
            } else {
                throw new Error('<ngts-spot-light-shadow> must be a child of a <ngts-spot-light>');
            }
        });

        injectBeforeRender(() => {
            const spotLight = spotLightRef.nativeElement;
            const mesh = meshRef.nativeElement;

            if (!spotLight) return;

            const A = spotLight.position;
            const B = spotLight.target.position;

            dir.copy(B).sub(A);
            const len = dir.length();
            dir.normalize().multiplyScalar(len * distance());
            pos.copy(A).add(dir);

            if (mesh) {
                mesh.position.copy(pos);
                mesh.lookAt(spotLight.target.position);
            }
        });
    });
}

extend({ Mesh, PlaneGeometry, MeshBasicMaterial });

@Component({
    selector: 'ngts-spot-light-shadow-mesh-no-shader',
    standalone: true,
    template: `
        <ngt-mesh [ref]="meshRef" [scale]="shadowMeshScale()" [castShadow]="true">
            <ngt-plane-geometry />
            <ngt-mesh-basic-material
                [transparent]="true"
                [side]="DoubleSide"
                [alphaTest]="shadowMeshAlphaTest()"
                [alphaMap]="shadowMeshMap()"
                [opacity]="debug() ? 1 : 0"
            >
                <ng-content />
            </ngt-mesh-basic-material>
        </ngt-mesh>
    `,
    imports: [NgIf],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsSpotLightShadowMeshNoShader extends NgtsSpotLightShadowMeshInput {
    readonly #spotLightApi = inject(NGTS_SPOT_LIGHT_API);

    readonly meshRef = injectNgtRef<THREE.Mesh>();
    readonly DoubleSide = THREE.DoubleSide;

    readonly debug = this.#spotLightApi.debug;

    constructor() {
        super();
        this.set({ distance: 0.4, alphaTest: 0.5, width: 512, height: 512 });

        effect(() => {
            const map = this.shadowMeshMap();
            if (map) {
                map.wrapS = map.wrapT = THREE.RepeatWrapping;
                checkUpdate(map);
            }
        });

        injectShadowMeshCommon(
            this.#spotLightApi.spotLight,
            this.meshRef,
            this.shadowMeshWidth,
            this.shadowMeshHeight,
            this.shadowMeshDistance
        );
    }
}

@Component({
    selector: 'ngts-spot-light-shadow-mesh-shader',
    standalone: true,
    template: `
        <ngt-mesh [ref]="meshRef" [scale]="shadowMeshScale()" [castShadow]="true">
            <ngt-plane-geometry />
            <ngt-mesh-basic-material
                [transparent]="true"
                [side]="DoubleSide"
                [alphaTest]="shadowMeshAlphaTest()"
                [alphaMap]="renderTarget().texture"
                [opacity]="debug() ? 1 : 0"
            >
                <ngt-value [rawValue]="RepeatWrapping" attach="alphaMap.wrapS" />
                <ngt-value [rawValue]="RepeatWrapping" attach="alphaMap.wrapT" />
                <ng-content />
            </ngt-mesh-basic-material>
        </ngt-mesh>
    `,
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsSpotLightShadowMeshShader extends NgtsSpotLightShadowMeshInput {
    readonly meshRef = injectNgtRef<THREE.Mesh>();
    readonly #spotLightApi = inject(NGTS_SPOT_LIGHT_API);

    readonly DoubleSide = THREE.DoubleSide;
    readonly RepeatWrapping = THREE.RepeatWrapping;

    readonly debug = this.#spotLightApi.debug;
    readonly renderTarget = computed(() => {
        const width = this.shadowMeshWidth();
        const height = this.shadowMeshHeight();

        return new THREE.WebGLRenderTarget(width, height, {
            format: THREE.RGBAFormat,
            encoding: THREE.LinearEncoding,
            stencilBuffer: false,
            // depthTexture: null!
        });
    });
    readonly uniforms = {
        uShadowMap: { value: this.shadowMeshMap() },
        uTime: { value: 0 },
    };

    readonly #fsQuad = computed(() => {
        const shader = this.shadowMeshShader();
        if (!shader) return null;
        return new FullScreenQuad(
            new THREE.ShaderMaterial({
                uniforms: this.uniforms,
                vertexShader: /* glsl */ `
                  varying vec2 vUv;

                  void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                  }
                `,
                fragmentShader: shader,
            })
        );
    });

    constructor() {
        super();
        this.set({ distance: 0.4, alphaTest: 0.5, width: 512, height: 512, scale: 1 });

        effect(() => {
            const map = this.shadowMeshMap();
            this.uniforms.uShadowMap.value = map;
        });

        effect((onCleanup) => {
            const fsQuad = this.#fsQuad();
            onCleanup(() => {
                if (fsQuad) {
                    fsQuad.dispose();
                    fsQuad.material.dispose();
                }
            });
        });

        effect((onCleanup) => {
            const renderTarget = this.renderTarget();
            onCleanup(() => {
                renderTarget.dispose();
            });
        });
        injectShadowMeshCommon(
            this.#spotLightApi.spotLight,
            this.meshRef,
            this.shadowMeshWidth,
            this.shadowMeshHeight,
            this.shadowMeshDistance
        );
        injectBeforeRender(({ delta, gl }) => {
            this.uniforms.uTime.value += delta;
            const fsQuad = this.#fsQuad();
            const renderTarget = this.renderTarget();
            if (fsQuad && renderTarget) {
                gl.setRenderTarget(renderTarget);
                fsQuad.render(gl);
                gl.setRenderTarget(null);
            }
        });
    }
}

@Component({
    selector: 'ngts-spot-light-shadow',
    standalone: true,
    template: `
        <ngts-spot-light-shadow-mesh-shader
            *ngIf="shadowMeshShader(); else noShader"
            [distance]="shadowMeshDistance()"
            [shader]="shadowMeshShader()"
            [alphaTest]="shadowMeshAlphaTest()"
            [scale]="shadowMeshScale()"
            [map]="shadowMeshMap()"
            [width]="shadowMeshWidth()"
            [height]="shadowMeshHeight()"
        />
        <ng-template #noShader>
            <ngts-spot-light-shadow-mesh-no-shader
                [distance]="shadowMeshDistance()"
                [alphaTest]="shadowMeshAlphaTest()"
                [scale]="shadowMeshScale()"
                [map]="shadowMeshMap()"
                [width]="shadowMeshWidth()"
                [height]="shadowMeshHeight()"
            />
        </ng-template>
    `,
    imports: [NgtsSpotLightShadowMeshShader, NgtsSpotLightShadowMeshNoShader, NgIf],
})
export class NgtsSpotLightShadow extends NgtsSpotLightShadowMeshInput {}
