import {
	afterNextRender,
	ChangeDetectionStrategy,
	Component,
	computed,
	CUSTOM_ELEMENTS_SCHEMA,
	ElementRef,
	input,
	untracked,
	viewChild,
} from '@angular/core';
import { MeshDiscardMaterial, MeshTransmissionMaterial } from '@pmndrs/vanilla';
import {
	applyProps,
	getLocalState,
	injectBeforeRender,
	NgtAnyRecord,
	NgtArgs,
	NgtMeshPhysicalMaterial,
	omit,
	pick,
} from 'angular-three';
import { injectFBO } from 'angular-three-soba/misc';
import { injectAutoEffect } from 'ngxtension/auto-effect';
import { mergeInputs } from 'ngxtension/inject-inputs';
import { BackSide, Color, FrontSide, Mesh, NoToneMapping, Texture, ToneMapping } from 'three';

type MeshTransmissionMaterialOptions = ConstructorParameters<typeof MeshTransmissionMaterial>[0];

export type NgtsMeshTransmissionMaterialOptions = Partial<NgtMeshPhysicalMaterial> &
	Omit<MeshTransmissionMaterialOptions, 'buffer' | 'anisotropicBlur'> & {
		anisotropicBlur?: number;
		buffer?: Texture;
		/** transmissionSampler, you can use the threejs transmission sampler texture that is
		 *  generated once for all transmissive materials. The upside is that it can be faster if you
		 *  use multiple MeshPhysical and Transmission materials, the downside is that transmissive materials
		 *  using this can't see other transparent or transmissive objects, default: false */
		transmissionSampler: boolean;
		/** Render the backside of the material (more cost, better results), default: false */
		backside: boolean;
		/** Backside thickness (when backside is true), default: 0 */
		backsideThickness: number;
		backsideEnvMapIntensity: number;
		/** Resolution of the local buffer, default: undefined (fullscreen) */
		resolution?: number;
		/** Resolution of the local buffer for backfaces, default: undefined (fullscreen) */
		backsideResolution?: number;
		/** Refraction samples, default: 6 */
		samples: number;
		/** Buffer scene background (can be a texture, a cubetexture or a color), default: null */
		background?: Texture | Color;
	};

const defaultOptions: NgtsMeshTransmissionMaterialOptions = {
	transmissionSampler: false,
	backside: false,
	side: FrontSide,
	transmission: 1,
	thickness: 0,
	backsideThickness: 0,
	backsideEnvMapIntensity: 1,
	samples: 10,
};

@Component({
	selector: 'ngts-mesh-transmission-material',
	standalone: true,
	template: `
		<ngt-primitive *args="[material()]" #material>
			<ng-content />
		</ngt-primitive>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtArgs],
})
export class NgtsMeshTransmissionMaterial {
	options = input(defaultOptions, { transform: mergeInputs(defaultOptions) });
	private parameters = omit(this.options, [
		'buffer',
		'transmissionSampler',
		'backside',
		'side',
		'transmission',
		'thickness',
		'backsideThickness',
		'backsideEnvMapIntensity',
		'samples',
		'resolution',
		'backsideResolution',
		'background',
		'anisotropy',
		'anisotropicBlur',
	]);

	private resolution = pick(this.options, 'resolution');
	private backsideResolution = pick(this.options, 'backsideResolution');
	private samples = pick(this.options, 'samples');
	private transmissionSampler = pick(this.options, 'transmissionSampler');
	private buffer = pick(this.options, 'buffer');
	private transmission = pick(this.options, 'transmission');
	private anisotropy = pick(this.options, 'anisotropy');
	private anisotropicBlur = pick(this.options, 'anisotropicBlur');
	private thickness = pick(this.options, 'thickness');
	private side = pick(this.options, 'side');
	private background = pick(this.options, 'background');
	private backside = pick(this.options, 'backside');
	private backsideThickness = pick(this.options, 'backsideThickness');
	private backsideEnvMapIntensity = pick(this.options, 'backsideEnvMapIntensity');

	materialRef = viewChild<ElementRef<MeshTransmissionMaterial & MeshTransmissionMaterialOptions>>('material');

	private autoEffect = injectAutoEffect();

	private backResolution = computed(() => this.backsideResolution() || this.resolution());

	private fboBack = injectFBO(() => ({ width: this.backResolution() }));
	private fboMain = injectFBO(() => ({ width: this.resolution() }));

	private bufferTexture = computed(() => this.buffer() || this.fboMain().texture);
	private anisotropicBlurOption = computed(() => this.anisotropicBlur() || this.anisotropy());

	private discardMaterial = new MeshDiscardMaterial();

	material = computed(() => {
		const previousMaterial = untracked(this.materialRef)?.nativeElement;

		if (previousMaterial) {
			previousMaterial.dispose();
			delete (previousMaterial as NgtAnyRecord)['__ngt__'];
			delete (previousMaterial as NgtAnyRecord)['__ngt_renderer__'];
		}

		const [samples, transmissionSampler] = [this.samples(), this.transmissionSampler()];
		return new MeshTransmissionMaterial({ samples, transmissionSampler });
	});

	constructor() {
		afterNextRender(() => {
			this.autoEffect(() => {
				const material = this.materialRef()?.nativeElement;
				if (!material) return;
				applyProps(material, this.parameters());
			});

			this.autoEffect(() => {
				const material = this.materialRef()?.nativeElement;
				if (!material) return;
				// In order for this to not incur extra cost "transmission" must be set to 0 and treated as a reserved prop.
				// This is because THREE.WebGLRenderer will check for transmission > 0 and execute extra renders.
				// The exception is when transmissionSampler is set, in which case we are using three's built in sampler.
				applyProps(material, {
					_transmission: this.transmission(),
					transmission: this.transmissionSampler() ? this.transmission() : 0,
				});
			});

			this.updateParameter('buffer', this.bufferTexture);
			this.updateParameter('anisotropy', this.anisotropicBlurOption);
			this.updateParameter('side', this.side);
			this.updateParameter('thickness', this.thickness);
		});

		let oldBg: Texture | Color | null;
		let oldEnvMapIntensity: number | undefined;
		let oldTone: ToneMapping | undefined;
		let parent: Mesh | undefined;
		injectBeforeRender(({ clock, gl, scene, camera }) => {
			const material = this.materialRef()?.nativeElement;
			if (!material) return;

			const [
				fboMain,
				fboBack,
				transmissionSampler,
				background,
				backside,
				backsideThickness,
				backsideEnvMapIntensity,
				thickness,
				side,
			] = [
				this.fboMain(),
				this.fboBack(),
				this.transmissionSampler(),
				this.background(),
				this.backside(),
				this.backsideThickness(),
				this.backsideEnvMapIntensity(),
				this.thickness(),
				this.side(),
			];

			material.time = clock.getElapsedTime();
			// Render only if the buffer matches the built-in and no transmission sampler is set
			// @ts-ignore
			if (material.buffer === fboMain.texture && !transmissionSampler) {
				parent = getLocalState(material)?.parent() as Mesh;

				if (parent) {
					// Save defaults
					oldTone = gl.toneMapping;
					oldBg = scene.background;
					oldEnvMapIntensity = material.envMapIntensity;

					// Switch off tonemapping lest it double tone maps
					// Save the current background and set the HDR as the new BG
					// Use discardmaterial, the parent will be invisible, but it's shadows will still be cast
					gl.toneMapping = NoToneMapping;
					if (background) scene.background = background;
					parent.material = this.discardMaterial;

					if (backside) {
						// Render into the backside buffer
						gl.setRenderTarget(fboBack);
						gl.render(scene, camera);
						// And now prepare the material for the main render using the backside buffer
						parent.material = material;
						Object.assign(parent.material, {
							buffer: fboBack.texture,
							thickness: backsideThickness,
							side: BackSide,
							envMapIntensity: backsideEnvMapIntensity,
						});
					}

					// Render into the main buffer
					gl.setRenderTarget(fboMain);
					gl.render(scene, camera);

					parent.material = material;
					Object.assign(parent.material, {
						buffer: fboMain.texture,
						thickness,
						side,
						envMapIntensity: oldEnvMapIntensity,
					});

					// Set old state back
					scene.background = oldBg;
					gl.setRenderTarget(null);
					gl.toneMapping = oldTone;
				}
			}
		});
	}

	private updateParameter<TKey extends keyof NgtsMeshTransmissionMaterialOptions>(
		parameterName: TKey,
		parameter: () => NgtsMeshTransmissionMaterialOptions[TKey],
	) {
		this.autoEffect(() => {
			const material = this.materialRef()?.nativeElement;
			if (!material) return;
			applyProps(material, { [parameterName]: parameter() });
		});
	}
}
