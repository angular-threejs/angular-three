import {
	ChangeDetectionStrategy,
	Component,
	computed,
	CUSTOM_ELEMENTS_SCHEMA,
	DestroyRef,
	ElementRef,
	inject,
	input,
	untracked,
	viewChild,
} from '@angular/core';
import {
	getLocalState,
	injectBeforeRender,
	NgtAnyRecord,
	NgtArgs,
	NgtAttachable,
	NgtMeshPhysicalMaterial,
	omit,
	pick,
} from 'angular-three';
import { injectFBO } from 'angular-three-soba/misc';
import { MeshDiscardMaterial, MeshTransmissionMaterial } from 'angular-three-soba/vanilla-exports';
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
		<ngt-primitive
			*args="[material()]"
			#material
			[attach]="attach()"
			[parameters]="parameters()"
			[_transmission]="transmission()"
			[transmission]="transmissionSampler() ? transmission() : 0"
			[buffer]="bufferTexture()"
			[anisotropicBlur]="anisotropicBlurOption()"
			[side]="side()"
			[thickness]="thickness()"
		>
			<ng-content />
		</ngt-primitive>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtArgs],
})
export class NgtsMeshTransmissionMaterial {
	attach = input<NgtAttachable>('material');
	options = input(defaultOptions, { transform: mergeInputs(defaultOptions) });
	parameters = omit(this.options, [
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
	private buffer = pick(this.options, 'buffer');
	private anisotropy = pick(this.options, 'anisotropy');
	private anisotropicBlur = pick(this.options, 'anisotropicBlur');
	private background = pick(this.options, 'background');
	private backside = pick(this.options, 'backside');
	private backsideThickness = pick(this.options, 'backsideThickness');
	private backsideEnvMapIntensity = pick(this.options, 'backsideEnvMapIntensity');

	transmissionSampler = pick(this.options, 'transmissionSampler');
	transmission = pick(this.options, 'transmission');
	thickness = pick(this.options, 'thickness');
	side = pick(this.options, 'side');

	materialRef = viewChild<ElementRef<MeshTransmissionMaterial & MeshTransmissionMaterialOptions>>('material');

	private backResolution = computed(() => this.backsideResolution() || this.resolution());

	private fboBack = injectFBO(() => ({ width: this.backResolution() }));
	private fboMain = injectFBO(() => ({ width: this.resolution() }));

	bufferTexture = computed(() => this.buffer() || this.fboMain().texture);
	anisotropicBlurOption = computed(() => this.anisotropicBlur() || this.anisotropy());

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
		inject(DestroyRef).onDestroy(() => {
			const material = this.materialRef()?.nativeElement;
			if (material) {
				material.dispose();
				delete (material as NgtAnyRecord)['__ngt__'];
				delete (material as NgtAnyRecord)['__ngt_renderer__'];
			}
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
			// @ts-expect-error - we know material.buffer is not just undefined | null
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
}
