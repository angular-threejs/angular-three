import {
	ChangeDetectionStrategy,
	Component,
	CUSTOM_ELEMENTS_SCHEMA,
	ElementRef,
	input,
	signal,
	viewChild,
} from '@angular/core';
import { extend, injectBeforeRender, NgtArgs, NgtPortal } from 'angular-three';
import { NgtpBloom, NgtpEffectComposer } from 'angular-three-postprocessing';
import { NgtsPerspectiveCamera } from 'angular-three-soba/cameras';
import { NgtsOrbitControls } from 'angular-three-soba/controls';
import { injectFBO } from 'angular-three-soba/misc';
import * as THREE from 'three';

import { SimulationMaterial } from './simulation-material';

import { NgtTweakNumber, NgtTweakPane } from 'angular-three-tweakpane';
import fragmentShader from './fragment.glsl' with { loader: 'text' };
import vertexShader from './vertex.glsl' with { loader: 'text' };

extend({ SimulationMaterial });

@Component({
	selector: 'app-fbo-particles',
	template: `
		<ngt-portal [container]="virtualScene">
			<ng-template portalContent>
				<ngt-mesh>
					<ngt-simulation-material #simulationMaterial *args="[size]" />
					<ngt-buffer-geometry>
						<ngt-buffer-attribute
							attach="attributes.position"
							[count]="positions.length / 3"
							[array]="positions"
							[itemSize]="3"
						/>
						<ngt-buffer-attribute
							attach="attributes.uv"
							[count]="uvs.length / 2"
							[array]="uvs"
							[itemSize]="2"
						/>
					</ngt-buffer-geometry>
				</ngt-mesh>
			</ng-template>
		</ngt-portal>

		<ngt-points [position]="[-1, -1, 0]" [rotation]="[0.05, -0.1, 0]">
			<ngt-buffer-geometry>
				<ngt-buffer-attribute
					attach="attributes.position"
					[count]="particlePositions.length / 3"
					[array]="particlePositions"
					[itemSize]="3"
				/>
			</ngt-buffer-geometry>
			<ngt-shader-material
				[depthWrite]="false"
				[uniforms]="uniforms"
				[vertexShader]="vertexShader"
				[fragmentShader]="fragmentShader"
				[blending]="AdditiveBlending"
			/>
		</ngt-points>
	`,
	imports: [NgtArgs, NgtPortal],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FBOParticles {
	protected readonly Math = Math;
	protected readonly vertexShader = vertexShader;
	protected readonly fragmentShader = fragmentShader;
	protected readonly AdditiveBlending = THREE.AdditiveBlending;

	frequency = input.required<number>();
	timeScale = input.required<number>();

	protected size = 128;
	protected virtualScene = new THREE.Scene();
	protected virtualCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 1 / Math.pow(2, 53), 1);
	protected positions = new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, 1, 1, 0, -1, 1, 0]);
	protected uvs = new Float32Array([
		0,
		0, // bottom-left
		1,
		0, // bottom-right
		1,
		1, // top-right
		0,
		0, // bottom-left
		1,
		1, // top-right
		0,
		1, // top-left
	]);
	protected renderTarget = injectFBO(() => ({
		width: this.size,
		height: this.size,
		settings: {
			minFilter: THREE.NearestFilter,
			magFilter: THREE.NearestFilter,
			format: THREE.RGBAFormat,
			stencilBuffer: false,
			type: THREE.FloatType,
		},
	}));

	protected particlePositions = (() => {
		const length = this.size * this.size;
		const particles = new Float32Array(length * 3);
		for (let i = 0; i < length; i++) {
			let i3 = i * 3;
			particles[i3 + 0] = (i % this.size) / this.size;
			particles[i3 + 1] = i / this.size / this.size;
		}
		return particles;
	})();

	protected uniforms: Record<string, THREE.IUniform> = {
		uPositions: { value: null },
	};

	private simulationMaterialRef = viewChild<ElementRef<SimulationMaterial>>('simulationMaterial');

	constructor() {
		injectBeforeRender(({ gl, clock }) => {
			gl.setRenderTarget(this.renderTarget());
			gl.clear();
			gl.render(this.virtualScene, this.virtualCamera);
			gl.setRenderTarget(null);

			const simulationMaterial = this.simulationMaterialRef()?.nativeElement;
			if (!simulationMaterial) return;

			this.uniforms['uPositions'].value = this.renderTarget().texture;
			simulationMaterial.uniforms['uFrequency'].value = this.frequency();
			simulationMaterial.uniforms['uTime'].value = clock.elapsedTime * this.timeScale();
		});
	}
}

@Component({
	selector: 'app-scene-graph',
	template: `
		<ngts-perspective-camera [options]="{ makeDefault: true, position: [0, 0, 3] }" />

		<ngt-color *args="['black']" attach="background" />
		<ngt-ambient-light [intensity]="Math.PI * 0.5" />

		<app-fbo-particles [frequency]="frequency()" [timeScale]="timeScale()" />

		<ngtp-effect-composer>
			<ngtp-bloom [options]="{ luminanceThreshold: 0, intensity: 4 }" />
		</ngtp-effect-composer>

		<ngts-orbit-controls [options]="{ enablePan: false }" />

		<ngt-tweak-pane title="Particles" [top]="48" [expanded]="true">
			<ngt-tweak-number [(value)]="frequency" label="frequency" [params]="{ min: 0.25, max: 1, step: 0.01 }" />
			<ngt-tweak-number [(value)]="timeScale" label="timeScale" [params]="{ min: 0.5, max: 1.5, step: 0.01 }" />
		</ngt-tweak-pane>
	`,
	imports: [
		NgtsPerspectiveCamera,
		NgtsOrbitControls,
		NgtArgs,
		FBOParticles,
		NgtpEffectComposer,
		NgtpBloom,
		NgtTweakPane,
		NgtTweakNumber,
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class SceneGraph {
	protected readonly Math = Math;

	protected frequency = signal(0.5);
	protected timeScale = signal(1);
}
