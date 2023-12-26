import { NgIf } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, Component, computed, effect, inject, type Injector } from '@angular/core';
import { checkUpdate, extend, injectBeforeRender, injectNgtRef, type NgtInjectedRef } from 'angular-three-old';
import { assertInjector } from 'ngxtension/assert-injector';
import * as THREE from 'three';
import { Mesh, MeshBasicMaterial, PlaneGeometry } from 'three';
import { FullScreenQuad } from 'three-stdlib';
import { NgtsSpotLightShadowMeshInput, type NgtsSpotLightShadowMeshInputState } from './shadow-mesh-input';
import { injectNgtsSpotLightApi } from './spot-light';

const isSpotLight = (child: THREE.Object3D | null): child is THREE.SpotLight => {
	return (child as THREE.SpotLight)?.isSpotLight;
};

function injectShadowMeshCommon(
	spotLightRef: NgtInjectedRef<THREE.SpotLight>,
	meshRef: NgtInjectedRef<THREE.Mesh>,
	width: () => number,
	height: () => number,
	distance: () => number,
	injector?: Injector,
) {
	return assertInjector(injectShadowMeshCommon, injector, () => {
		const pos = new THREE.Vector3();
		const dir = new THREE.Vector3();

		effect(() => {
			const spotLight = spotLightRef.nativeElement;
			if (!spotLight) return;
			if (isSpotLight(spotLight)) {
				spotLight.shadow.mapSize.set(width(), height());
				if (spotLight.shadow.map) {
					spotLight.shadow.map.setSize(width(), height());
				}
				spotLight.shadow.needsUpdate = true;
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
		<ngt-mesh [ref]="meshRef" [scale]="shadowMeshInput.scale()" [castShadow]="true">
			<ngt-plane-geometry />
			<ngt-mesh-basic-material
				[transparent]="true"
				[side]="DoubleSide"
				[alphaTest]="shadowMeshInput.alphaTest()"
				[alphaMap]="shadowMeshInput.map()"
				[opacity]="debug() ? 1 : 0"
			>
				<ng-content />
			</ngt-mesh-basic-material>
		</ngt-mesh>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsSpotLightShadowMeshNoShader {
	shadowMeshInput = inject(NgtsSpotLightShadowMeshInput);

	meshRef = injectNgtRef<THREE.Mesh>();
	DoubleSide = THREE.DoubleSide;

	private spotLightApi = injectNgtsSpotLightApi();
	debug = this.spotLightApi.debug;

	constructor() {
		effect(() => {
			this.shadowMeshInput.inputs.patch({ distance: 0.4, alphaTest: 0.5, width: 512, height: 512, scale: 1 });
		});

		effect(() => {
			const map = this.shadowMeshInput.map();
			if (map) {
				map.wrapS = map.wrapT = THREE.RepeatWrapping;
				checkUpdate(map);
			}
		});

		injectShadowMeshCommon(
			this.spotLightApi.spotLight,
			this.meshRef,
			this.shadowMeshInput.width,
			this.shadowMeshInput.height,
			this.shadowMeshInput.distance,
		);
	}
}

@Component({
	selector: 'ngts-spot-light-shadow-mesh-shader',
	standalone: true,
	template: `
		<ngt-mesh [ref]="meshRef" [scale]="shadowMeshInput.scale()" [castShadow]="true">
			<ngt-plane-geometry />
			<ngt-mesh-basic-material
				[transparent]="true"
				[side]="DoubleSide"
				[alphaTest]="shadowMeshInput.alphaTest()"
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
export class NgtsSpotLightShadowMeshShader {
	shadowMeshInput = inject(NgtsSpotLightShadowMeshInput);
	meshRef = injectNgtRef<THREE.Mesh>();

	DoubleSide = THREE.DoubleSide;
	RepeatWrapping = THREE.RepeatWrapping;

	private spotLightApi = injectNgtsSpotLightApi();
	debug = this.spotLightApi.debug;
	renderTarget = computed(() => {
		const [width, height] = [this.shadowMeshInput.width(), this.shadowMeshInput.height()];

		return new THREE.WebGLRenderTarget(width, height, {
			format: THREE.RGBAFormat,
			encoding: THREE.LinearEncoding,
			stencilBuffer: false,
			// depthTexture: null!
		});
	});

	private uniforms = {
		uShadowMap: { value: this.shadowMeshInput.map() },
		uTime: { value: 0 },
	};

	private fsQuad = computed(() => {
		const shader = this.shadowMeshInput.shader();
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
			}),
		);
	});

	constructor() {
		effect(() => {
			this.shadowMeshInput.inputs.patch({
				distance: 0.4,
				alphaTest: 0.5,
				width: 512,
				height: 512,
				scale: 4,
				shader: /* glsl */ `
          varying vec2 vUv;

          uniform sampler2D uShadowMap;
          uniform float uTime;

          void main() {
            vec3 color = texture2D(uShadowMap, vUv).xyz;
            gl_FragColor = vec4(color, 1.);
          }
        `,
			});
		});

		injectShadowMeshCommon(
			this.spotLightApi.spotLight,
			this.meshRef,
			this.shadowMeshInput.width,
			this.shadowMeshInput.height,
			this.shadowMeshInput.distance,
		);

		injectBeforeRender(({ delta, gl }) => {
			this.uniforms.uTime.value += delta;
			const fsQuad = this.fsQuad();
			const renderTarget = this.renderTarget();
			if (fsQuad && renderTarget) {
				gl.setRenderTarget(renderTarget);
				fsQuad.render(gl);
				gl.setRenderTarget(null);
			}
		});

		effect(() => {
			const map = this.shadowMeshInput.map();
			if (map) {
				this.uniforms.uShadowMap.value = map;
			}
		});

		effect((onCleanup) => {
			const fsQuad = this.fsQuad();
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
	}
}

declare global {
	interface HTMLElementTagNameMap {
		'ngts-spot-light-shadow': NgtsSpotLightShadowMeshInputState;
	}
}

@Component({
	selector: 'ngts-spot-light-shadow',
	standalone: true,
	template: `
		<ngts-spot-light-shadow-mesh-shader *ngIf="shader(); else noShader" />
		<ng-template #noShader>
			<ngts-spot-light-shadow-mesh-no-shader />
		</ng-template>
	`,
	imports: [NgtsSpotLightShadowMeshShader, NgtsSpotLightShadowMeshNoShader, NgIf],
	providers: [{ provide: NgtsSpotLightShadowMeshInput, useExisting: NgtsSpotLightShadow }],
})
export class NgtsSpotLightShadow extends NgtsSpotLightShadowMeshInput {}
