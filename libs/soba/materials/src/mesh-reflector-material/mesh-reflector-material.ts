import { NgIf } from '@angular/common';
import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, Input } from '@angular/core';
import {
    extend,
    getLocalState,
    injectBeforeRender,
    injectNgtRef,
    NgtArgs,
    NgtRenderState,
    NgtSignalStore,
    NgtStore,
} from 'angular-three';
import { BlurPass, MeshReflectorMaterial } from 'angular-three-soba/shaders';
import * as THREE from 'three';

extend({ MeshReflectorMaterial });

export interface NgtsMeshReflectorMaterialState {
    resolution: number;
    mixBlur: number;
    mixStrength: number;
    blur: [number, number] | number;
    mirror: number;
    minDepthThreshold: number;
    maxDepthThreshold: number;
    depthScale: number;
    depthToBlurRatioBias: number;
    distortionMap?: THREE.Texture;
    distortion: number;
    mixContrast: number;
    reflectorOffset: number;
}

@Component({
    selector: 'ngts-mesh-reflector-material',
    standalone: true,
    template: `
        <ngt-mesh-reflector-material
            ngtCompound
            attach="material"
            *ngIf="defines()"
            [ref]="materialRef"
            [defines]="defines()"
            [mirror]="reflectorMirror()"
            [textureMatrix]="reflectorTextureMatrix()"
            [mixBlur]="reflectorMixBlur()"
            [tDiffuse]="reflectorTDiffuse()"
            [tDepth]="reflectorTDepth()"
            [tDiffuseBlur]="reflectorTDiffuseBlur()"
            [hasBlur]="reflectorHasBlur()"
            [mixStrength]="reflectorMixStrength()"
            [minDepthThreshold]="reflectorMinDepthThreshold()"
            [maxDepthThreshold]="reflectorMaxDepthThreshold()"
            [depthScale]="reflectorDepthScale()"
            [depthToBlurRatioBias]="reflectorDepthToBlurRatioBias()"
            [distortion]="reflectorDistortion()"
            [distortionMap]="reflectorDistortionMap()"
            [mixContrast]="reflectorMixContrast()"
        >
            <ng-content />
        </ngt-mesh-reflector-material>
    `,
    imports: [NgtArgs, NgIf],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsMeshReflectorMaterial extends NgtSignalStore<NgtsMeshReflectorMaterialState> {
    @Input() materialRef = injectNgtRef<MeshReflectorMaterial>();

    @Input() set resolution(resolution: number) {
        this.set({ resolution });
    }

    @Input() set mixBlur(mixBlur: number) {
        this.set({ mixBlur });
    }

    @Input() set mixStrength(mixStrength: number) {
        this.set({ mixStrength });
    }

    @Input() set blur(blur: [number, number] | number) {
        this.set({ blur });
    }

    @Input() set mirror(mirror: number) {
        this.set({ mirror });
    }

    @Input() set minDepthThreshold(minDepthThreshold: number) {
        this.set({ minDepthThreshold });
    }

    @Input() set maxDepthThreshold(maxDepthThreshold: number) {
        this.set({ maxDepthThreshold });
    }

    @Input() set depthScale(depthScale: number) {
        this.set({ depthScale });
    }

    @Input() set depthToBlurRatioBias(depthToBlurRatioBias: number) {
        this.set({ depthToBlurRatioBias });
    }

    @Input() set distortionMap(distortionMap: THREE.Texture) {
        this.set({ distortionMap });
    }

    @Input() set distortion(distortion: number) {
        this.set({ distortion });
    }

    @Input() set mixContrast(mixContrast: number) {
        this.set({ mixContrast });
    }

    @Input() set reflectorOffset(reflectorOffset: number) {
        this.set({ reflectorOffset });
    }

    readonly reflectorProps = computed(() => this.#reflectorEntities().reflectorProps);
    readonly defines = computed(() => this.reflectorProps().defines);
    readonly reflectorMirror = computed(() => this.reflectorProps().mirror);
    readonly reflectorTextureMatrix = computed(() => this.reflectorProps().textureMatrix);
    readonly reflectorMixBlur = computed(() => this.reflectorProps().mixBlur);
    readonly reflectorTDiffuse = computed(() => this.reflectorProps().tDiffuse);
    readonly reflectorTDepth = computed(() => this.reflectorProps().tDepth);
    readonly reflectorTDiffuseBlur = computed(() => this.reflectorProps().tDiffuseBlur);
    readonly reflectorHasBlur = computed(() => this.reflectorProps().hasBlur);
    readonly reflectorMixStrength = computed(() => this.reflectorProps().mixStrength);
    readonly reflectorMinDepthThreshold = computed(() => this.reflectorProps().minDepthThreshold);
    readonly reflectorMaxDepthThreshold = computed(() => this.reflectorProps().maxDepthThreshold);
    readonly reflectorDepthScale = computed(() => this.reflectorProps().depthScale);
    readonly reflectorDepthToBlurRatioBias = computed(() => this.reflectorProps().depthToBlurRatioBias);
    readonly reflectorDistortion = computed(() => this.reflectorProps().distortion);
    readonly reflectorDistortionMap = computed(() => this.reflectorProps().distortionMap);
    readonly reflectorMixContrast = computed(() => this.reflectorProps().mixContrast);

    readonly #store = inject(NgtStore);
    readonly #gl = this.#store.select('gl');

    readonly #reflectorPlane = new THREE.Plane();
    readonly #normal = new THREE.Vector3();
    readonly #reflectorWorldPosition = new THREE.Vector3();
    readonly #cameraWorldPosition = new THREE.Vector3();
    readonly #rotationMatrix = new THREE.Matrix4();
    readonly #lookAtPosition = new THREE.Vector3(0, 0, -1);
    readonly #clipPlane = new THREE.Vector4();
    readonly #view = new THREE.Vector3();
    readonly #target = new THREE.Vector3();
    readonly #q = new THREE.Vector4();
    readonly #textureMatrix = new THREE.Matrix4();
    readonly #virtualCamera = new THREE.PerspectiveCamera();

    readonly #blur = this.select('blur');
    readonly #resolution = this.select('resolution');
    readonly #mirror = this.select('mirror');
    readonly #mixBlur = this.select('mixBlur');
    readonly #mixStrength = this.select('mixStrength');
    readonly #minDepthThreshold = this.select('minDepthThreshold');
    readonly #maxDepthThreshold = this.select('maxDepthThreshold');
    readonly #depthScale = this.select('depthScale');
    readonly #depthToBlurRatioBias = this.select('depthToBlurRatioBias');
    readonly #distortion = this.select('distortion');
    readonly #distortionMap = this.select('distortionMap');
    readonly #mixContrast = this.select('mixContrast');

    readonly #normalizedBlur = computed(() => {
        const blur = this.#blur();
        return Array.isArray(blur) ? blur : [blur, blur];
    });

    readonly #hasBlur = computed(() => {
        const [x, y] = this.#normalizedBlur();
        return x + y > 0;
    });

    readonly #reflectorEntities = computed(() => {
        const gl = this.#gl();
        const resolution = this.#resolution();
        const blur = this.#normalizedBlur();
        const minDepthThreshold = this.#minDepthThreshold();
        const maxDepthThreshold = this.#maxDepthThreshold();
        const depthScale = this.#depthScale();
        const depthToBlurRatioBias = this.#depthToBlurRatioBias();
        const mirror = this.#mirror();
        const mixBlur = this.#mixBlur();
        const mixStrength = this.#mixStrength();
        const mixContrast = this.#mixContrast();
        const distortion = this.#distortion();
        const distortionMap = this.#distortionMap();
        const hasBlur = this.#hasBlur();

        const parameters = {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            encoding: gl.outputEncoding,
            type: THREE.HalfFloatType,
        };
        const fbo1 = new THREE.WebGLRenderTarget(resolution, resolution, parameters);
        fbo1.depthBuffer = true;
        fbo1.depthTexture = new THREE.DepthTexture(resolution, resolution);
        fbo1.depthTexture.format = THREE.DepthFormat;
        fbo1.depthTexture.type = THREE.UnsignedShortType;

        const fbo2 = new THREE.WebGLRenderTarget(resolution, resolution, parameters);
        const blurPass = new BlurPass({
            gl,
            resolution,
            width: blur[0],
            height: blur[1],
            minDepthThreshold,
            maxDepthThreshold,
            depthScale,
            depthToBlurRatioBias,
        });
        const reflectorProps = {
            mirror,
            textureMatrix: this.#textureMatrix,
            mixBlur,
            tDiffuse: fbo1.texture,
            tDepth: fbo1.depthTexture,
            tDiffuseBlur: fbo2.texture,
            hasBlur,
            mixStrength,
            minDepthThreshold,
            maxDepthThreshold,
            depthScale,
            depthToBlurRatioBias,
            distortion,
            distortionMap,
            mixContrast,
            defines: {
                USE_BLUR: hasBlur ? '' : undefined,
                USE_DEPTH: depthScale > 0 ? '' : undefined,
                USE_DISTORTION: distortionMap ? '' : undefined,
            },
        };

        return { fbo1, fbo2, blurPass, reflectorProps };
    });

    constructor() {
        super({
            mixBlur: 0,
            mixStrength: 1,
            resolution: 256,
            blur: [0, 0],
            minDepthThreshold: 0.9,
            maxDepthThreshold: 1,
            depthScale: 0,
            depthToBlurRatioBias: 0.25,
            mirror: 0,
            distortion: 1,
            mixContrast: 1,
            reflectorOffset: 0,
        });

        injectBeforeRender(this.#onBeforeRender.bind(this));
    }

    #onBeforeRender(state: NgtRenderState) {
        if (!this.materialRef.nativeElement) return;
        const parent = getLocalState(this.materialRef.nativeElement).parent();
        if (!parent) return;

        const { gl, scene } = state;
        const hasBlur = this.#hasBlur();
        const { fbo1, fbo2, blurPass } = this.#reflectorEntities();

        if (fbo1 && fbo2 && blurPass) {
            parent.visible = false;
            const currentXrEnabled = gl.xr.enabled;
            const currentShadowAutoUpdate = gl.shadowMap.autoUpdate;
            this.#beforeRender(state);
            gl.xr.enabled = false;
            gl.shadowMap.autoUpdate = false;
            gl.setRenderTarget(fbo1);
            gl.state.buffers.depth.setMask(true);
            if (!gl.autoClear) gl.clear();
            gl.render(scene, this.#virtualCamera);
            if (hasBlur) blurPass.render(gl, fbo1, fbo2);
            gl.xr.enabled = currentXrEnabled;
            gl.shadowMap.autoUpdate = currentShadowAutoUpdate;
            parent.visible = true;
            gl.setRenderTarget(null);
        }
    }

    #beforeRender(state: NgtRenderState) {
        const parent = getLocalState(this.materialRef.nativeElement).parent();
        if (!parent) return;

        const { camera } = state;

        this.#reflectorWorldPosition.setFromMatrixPosition(parent.matrixWorld);
        this.#cameraWorldPosition.setFromMatrixPosition(camera.matrixWorld);
        this.#rotationMatrix.extractRotation(parent.matrixWorld);
        this.#normal.set(0, 0, 1);
        this.#normal.applyMatrix4(this.#rotationMatrix);
        this.#reflectorWorldPosition.addScaledVector(this.#normal, this.get('reflectorOffset'));
        this.#view.subVectors(this.#reflectorWorldPosition, this.#cameraWorldPosition);
        // Avoid rendering when reflector is facing away
        if (this.#view.dot(this.#normal) > 0) return;
        this.#view.reflect(this.#normal).negate();
        this.#view.add(this.#reflectorWorldPosition);
        this.#rotationMatrix.extractRotation(camera.matrixWorld);
        this.#lookAtPosition.set(0, 0, -1);
        this.#lookAtPosition.applyMatrix4(this.#rotationMatrix);
        this.#lookAtPosition.add(this.#cameraWorldPosition);
        this.#target.subVectors(this.#reflectorWorldPosition, this.#lookAtPosition);
        this.#target.reflect(this.#normal).negate();
        this.#target.add(this.#reflectorWorldPosition);
        this.#virtualCamera.position.copy(this.#view);
        this.#virtualCamera.up.set(0, 1, 0);
        this.#virtualCamera.up.applyMatrix4(this.#rotationMatrix);
        this.#virtualCamera.up.reflect(this.#normal);
        this.#virtualCamera.lookAt(this.#target);
        this.#virtualCamera.far = camera.far; // Used in WebGLBackground
        this.#virtualCamera.updateMatrixWorld();
        this.#virtualCamera.projectionMatrix.copy(camera.projectionMatrix);
        // Update the texture matrix
        this.#textureMatrix.set(0.5, 0.0, 0.0, 0.5, 0.0, 0.5, 0.0, 0.5, 0.0, 0.0, 0.5, 0.5, 0.0, 0.0, 0.0, 1.0);
        this.#textureMatrix.multiply(this.#virtualCamera.projectionMatrix);
        this.#textureMatrix.multiply(this.#virtualCamera.matrixWorldInverse);
        this.#textureMatrix.multiply(parent.matrixWorld);
        // Now update projection matrix with new clip plane, implementing code from: http://www.terathon.com/code/oblique.html
        // Paper explaining this technique: http://www.terathon.com/lengyel/Lengyel-Oblique.pdf
        this.#reflectorPlane.setFromNormalAndCoplanarPoint(this.#normal, this.#reflectorWorldPosition);
        this.#reflectorPlane.applyMatrix4(this.#virtualCamera.matrixWorldInverse);
        this.#clipPlane.set(
            this.#reflectorPlane.normal.x,
            this.#reflectorPlane.normal.y,
            this.#reflectorPlane.normal.z,
            this.#reflectorPlane.constant
        );
        const projectionMatrix = this.#virtualCamera.projectionMatrix;
        this.#q.x = (Math.sign(this.#clipPlane.x) + projectionMatrix.elements[8]) / projectionMatrix.elements[0];
        this.#q.y = (Math.sign(this.#clipPlane.y) + projectionMatrix.elements[9]) / projectionMatrix.elements[5];
        this.#q.z = -1.0;
        this.#q.w = (1.0 + projectionMatrix.elements[10]) / projectionMatrix.elements[14];
        // Calculate the scaled plane vector
        this.#clipPlane.multiplyScalar(2.0 / this.#clipPlane.dot(this.#q));
        // Replacing the third row of the projection matrix
        projectionMatrix.elements[2] = this.#clipPlane.x;
        projectionMatrix.elements[6] = this.#clipPlane.y;
        projectionMatrix.elements[10] = this.#clipPlane.z + 1.0;
        projectionMatrix.elements[14] = this.#clipPlane.w;
    }
}
