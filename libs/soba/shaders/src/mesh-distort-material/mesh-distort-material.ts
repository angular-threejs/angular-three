import { InjectionToken, Type } from '@angular/core';
import * as THREE from 'three';

interface Uniform<T> {
    value: T;
}

/**
 * npm i -D raw-loader glslify-loader glsl-noise
 * Usage: import distort from 'raw-loader!glslify-loader!angular-three-soba/assets/distort.vert.glsl'
 *
 * provideNgtsMeshDistortMaterialShader(distort)
 */

export type MeshDistortMaterial = Type<{ time: number; distort: number; radius: number } & THREE.MeshPhysicalMaterial>;

export const NGTS_DISTORT_MATERIAL_SHADER = new InjectionToken<MeshDistortMaterial>('DistortMaterialShader');

export function provideNgtsMeshDistortMaterialShader(distortShader: string) {
    return {
        provide: NGTS_DISTORT_MATERIAL_SHADER,
        useFactory: () => {
            return class extends THREE.MeshPhysicalMaterial {
                _time: Uniform<number>;
                _distort: Uniform<number>;
                _radius: Uniform<number>;

                constructor(parameters: THREE.MeshPhysicalMaterialParameters = {}) {
                    super(parameters);
                    this.setValues(parameters);
                    this._time = { value: 0 };
                    this._distort = { value: 0.4 };
                    this._radius = { value: 1 };
                }

                override onBeforeCompile(shader: THREE.Shader) {
                    shader.uniforms['time'] = this._time;
                    shader.uniforms['radius'] = this._radius;
                    shader.uniforms['distort'] = this._distort;

                    shader.vertexShader = `
									    uniform float time;
									    uniform float radius;
									    uniform float distort;
									    ${distortShader}
									    ${shader.vertexShader}
									  `;
                    shader.vertexShader = shader.vertexShader.replace(
                        '#include <begin_vertex>',
                        `
									      float updateTime = time / 50.0;
									      float noise = snoise(vec3(position / 2.0 + updateTime * 5.0));
									      vec3 transformed = vec3(position * (noise * pow(distort, 2.0) + radius));
									      `
                    );
                }

                get time() {
                    return this._time.value;
                }

                set time(v) {
                    this._time.value = v;
                }

                get distort() {
                    return this._distort.value;
                }

                set distort(v) {
                    this._distort.value = v;
                }

                get radius() {
                    return this._radius.value;
                }

                set radius(v) {
                    this._radius.value = v;
                }
            };
        },
    };
}
