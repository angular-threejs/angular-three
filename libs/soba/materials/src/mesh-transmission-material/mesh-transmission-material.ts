import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, Input } from '@angular/core';
import {
	extend,
	getLocalState,
	injectBeforeRender,
	injectNgtRef,
	NgtArgs,
	signalStore,
	type NgtAnyRecord,
	type NgtMeshPhysicalMaterial,
} from 'angular-three';
import { injectNgtsFBO } from 'angular-three-soba/misc';
import { DiscardMaterial, MeshTransmissionMaterial } from 'angular-three-soba/shaders';
import * as THREE from 'three';

extend({ MeshTransmissionMaterial });

export type NgtsMeshTranmissionMaterialState = {
	/** transmissionSampler, you can use the threejs transmission sampler texture that is
	 *  generated once for all transmissive materials. The upside is that it can be faster if you
	 *  use multiple MeshPhysical and Transmission materials, the downside is that transmissive materials
	 *  using this can't see other transparent or transmissive objects, default: false */
	transmissionSampler: boolean;
	/** Render the backside of the material (more cost, better results), default: false */
	backside: boolean;
	/** Backside thickness (when backside is true), default: 0 */
	backsideThickness: number;
	/** Resolution of the local buffer, default: undefined (fullscreen) */
	resolution: number;
	/** Resolution of the local buffer for backfaces, default: undefined (fullscreen) */
	backsideResolution: number;
	/** Refraction samples, default: 10 */
	samples: number;
	/** Buffer scene background (can be a texture, a cubetexture or a color), default: null */
	background: THREE.Texture | THREE.Color;
	/* Transmission, default: 1 */
	transmission: number;
	/* Thickness (refraction), default: 0 */
	thickness: number;
	/* Roughness (blur), default: 0 */
	roughness: number;
	/* Chromatic aberration, default: 0.03 */
	chromaticAberration: number;
	/* Anisotropy, default: 0.1 */
	anisotropy: number;
	/* AnisotropicBlur, default: 0.1 */
	anisotropicBlur: number;
	/* Distortion, default: 0 */
	distortion: number;
	/* Distortion scale, default: 0.5 */
	distortionScale: number;
	/* Temporal distortion (speed of movement), default: 0.0 */
	temporalDistortion: number;
	/** The scene rendered into a texture (use it to share a texture between materials), default: null  */
	buffer: THREE.Texture | null;
	/** Internals */
	time: number;
};

declare global {
	interface HTMLElementTagNameMap {
		/**
		 * @extends ngt-mesh-physical-material
		 */
		'ngts-mesh-transmission-material': NgtsMeshTranmissionMaterialState & NgtMeshPhysicalMaterial;
	}
}

@Component({
	selector: 'ngts-mesh-transmission-material',
	standalone: true,
	template: `
		<ngt-mesh-transmission-material
			ngtCompound
			*args="[samples(), transmissionSampler()]"
			[ref]="materialRef"
			[buffer]="buffer() || fboMainRef()?.texture"
			[_transmission]="transmission()"
			[transmission]="transmissionSampler() ? transmission() : 0"
			[thickness]="thickness()"
			[side]="side"
			[anisotropicBlur]="anisotropicBlur() ?? anisotropy()"
			[roughness]="roughness()"
			[chromaticAberration]="chromaticAberration()"
			[distortion]="distortion()"
			[distortionScale]="distortionScale()"
			[temporalDistortion]="temporalDistortion()"
			[time]="time()"
		/>
	`,
	imports: [NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsMeshTranmissionMaterial {
	private inputs = signalStore<NgtsMeshTranmissionMaterialState>({
		transmissionSampler: false,
		backside: false,
		transmission: 1,
		thickness: 0,
		backsideThickness: 0,
		samples: 10,
		roughness: 0,
		anisotropy: 0.1,
		anisotropicBlur: 0.1,
		chromaticAberration: 0.03,
		distortion: 0,
		distortionScale: 0.5,
		temporalDistortion: 0.0,
		buffer: null,
	});

	@Input() materialRef = injectNgtRef<MeshTransmissionMaterial & { time: number; buffer?: THREE.Texture }>();
	/** transmissionSampler, you can use the threejs transmission sampler texture that is
	 *  generated once for all transmissive materials. The upside is that it can be faster if you
	 *  use multiple MeshPhysical and Transmission materials, the downside is that transmissive materials
	 *  using this can't see other transparent or transmissive objects, default: false */
	@Input({ alias: 'transmissionSampler' }) set _transmissionSampler(transmissionSampler: boolean) {
		this.inputs.set({ transmissionSampler });
	}
	/** Render the backside of the material (more cost, better results), default: false */
	@Input({ alias: 'backside' }) set _backside(backside: boolean) {
		this.inputs.set({ backside });
	}
	/** Backside thickness (when backside is true), default: 0 */
	@Input({ alias: 'backsideThickness' }) set _backsideThickness(backsideThickness: number) {
		this.inputs.set({ backsideThickness });
	}
	/** Resolution of the local buffer, default: undefined (fullscreen) */
	@Input({ alias: 'resolution' }) set _resolution(resolution: number) {
		this.inputs.set({ resolution });
	}
	/** Resolution of the local buffer for backfaces, default: undefined (fullscreen) */
	@Input({ alias: 'backsideResolution' }) set _backsideResolution(backsideResolution: number) {
		this.inputs.set({ backsideResolution });
	}
	/** Refraction samples, default: 10 */
	@Input({ alias: 'samples' }) set _samples(samples: number) {
		this.inputs.set({ samples });
	}
	/** Buffer scene background (can be a texture, a cubetexture or a color), default: null */
	@Input({ alias: 'background' }) set _background(background: THREE.Texture | THREE.Color) {
		this.inputs.set({ background });
	}
	/* Transmission, default: 1 */
	@Input({ alias: 'transmission' }) set _transmission(transmission: number) {
		this.inputs.set({ transmission });
	}
	/* Thickness (refraction), default: 0 */
	@Input({ alias: 'thickness' }) set _thickness(thickness: number) {
		this.inputs.set({ thickness });
	}
	/* Roughness (blur), default: 0 */
	@Input({ alias: 'roughness' }) set _roughness(roughness: number) {
		this.inputs.set({ roughness });
	}
	/* Chromatic aberration, default: 0.03 */
	@Input({ alias: 'chromaticAberration' }) set _chromaticAberration(chromaticAberration: number) {
		this.inputs.set({ chromaticAberration });
	}
	/* Anisotropy, default: 0.1 */
	@Input({ alias: 'anisotropy' }) set _anisotropy(anisotropy: number) {
		this.inputs.set({ anisotropy });
	}
	/* AnisotropicBlur, default: 0.1 */
	@Input({ alias: 'anisotropicBlur' }) set _anisotropicBlur(anisotropicBlur: number) {
		this.inputs.set({ anisotropicBlur });
	}
	/* Distortion, default: 0 */
	@Input({ alias: 'distortion' }) set _distortion(distortion: number) {
		this.inputs.set({ distortion });
	}
	/* Distortion scale, default: 0.5 */
	@Input({ alias: 'distortionScale' }) set _distortionScale(distortionScale: number) {
		this.inputs.set({ distortionScale });
	}
	/* Temporal distortion (speed of movement), default: 0.0 */
	@Input({ alias: 'temporalDistortion' }) set _temporalDistortion(temporalDistortion: number) {
		this.inputs.set({ temporalDistortion });
	}
	/** The scene rendered into a texture (use it to share a texture between materials), default: null  */
	@Input({ alias: 'buffer' }) set _buffer(buffer: THREE.Texture) {
		this.inputs.set({ buffer });
	}
	/** Internals */
	@Input({ alias: 'time' }) set _time(time: number) {
		this.inputs.set({ time });
	}

	transmissionSampler = this.inputs.select('transmissionSampler');
	backside = this.inputs.select('backside');
	transmission = this.inputs.select('transmission');
	thickness = this.inputs.select('thickness');
	backsideThickness = this.inputs.select('backsideThickness');
	samples = this.inputs.select('samples');
	roughness = this.inputs.select('roughness');
	anisotropy = this.inputs.select('anisotropy');
	anisotropicBlur = this.inputs.select('anisotropicBlur');
	chromaticAberration = this.inputs.select('chromaticAberration');
	distortion = this.inputs.select('distortion');
	distortionScale = this.inputs.select('distortionScale');
	temporalDistortion = this.inputs.select('temporalDistortion');
	buffer = this.inputs.select('buffer');
	time = this.inputs.select('time');

	private discardMaterial = new DiscardMaterial();

	private backsideResolution = this.inputs.select('backsideResolution');
	private resolution = this.inputs.select('resolution');

	private fboBackSettings = computed(() => ({ width: this.backsideResolution() || this.resolution() }));
	private fboMainSettings = computed(() => ({ width: this.resolution() }));

	fboBackRef = injectNgtsFBO(this.fboBackSettings);
	fboMainRef = injectNgtsFBO(this.fboMainSettings);

	side = THREE.FrontSide;

	constructor() {
		let oldBg: THREE.Scene['background'];
		let oldTone: THREE.WebGLRenderer['toneMapping'];
		let parent: THREE.Object3D;

		injectBeforeRender((state) => {
			if (!this.materialRef.nativeElement) return;

			const { transmissionSampler, background, backside, backsideThickness, thickness } = this.inputs.get();

			this.materialRef.nativeElement.time = state.clock.getElapsedTime();
			// Render only if the buffer matches the built-in and no transmission sampler is set
			if (this.materialRef.nativeElement.buffer === this.fboMainRef()?.texture && !transmissionSampler) {
				parent = getLocalState(this.materialRef.nativeElement).instanceStore?.get('parent') as THREE.Object3D;
				if (parent) {
					// Save defaults
					oldTone = state.gl.toneMapping;
					oldBg = state.scene.background;

					// Switch off tonemapping lest it double tone maps
					// Save the current background and set the HDR as the new BG
					// Use discardmaterial, the parent will be invisible, but it's shadows will still be cast
					state.gl.toneMapping = THREE.NoToneMapping;
					if (background) state.scene.background = background;
					(parent as NgtAnyRecord)['material'] = this.discardMaterial;

					if (backside) {
						// Render into the backside buffer
						state.gl.setRenderTarget(this.fboBackRef());
						state.gl.render(state.scene, state.camera);
						// And now prepare the material for the main render using the backside buffer
						(parent as NgtAnyRecord)['material'] = this.materialRef.nativeElement;
						(parent as NgtAnyRecord)['material'].buffer = this.fboBackRef()?.texture;
						(parent as NgtAnyRecord)['material'].thickness = backsideThickness;
						(parent as NgtAnyRecord)['material'].side = THREE.BackSide;
					}

					// Render into the main buffer
					state.gl.setRenderTarget(this.fboMainRef());
					state.gl.render(state.scene, state.camera);

					(parent as NgtAnyRecord)['material'].thickness = thickness;
					(parent as NgtAnyRecord)['material'].side = this.side;
					(parent as NgtAnyRecord)['material'].buffer = this.fboMainRef()?.texture;

					// Set old state back
					state.scene.background = oldBg;
					state.gl.setRenderTarget(null);
					(parent as NgtAnyRecord)['material'] = this.materialRef.nativeElement;
					state.gl.toneMapping = oldTone;
				}
			}
		});
	}
}
