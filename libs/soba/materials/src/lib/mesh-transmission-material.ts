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
	beforeRender,
	getInstanceState,
	NgtAnyRecord,
	NgtArgs,
	NgtAttachable,
	NgtThreeElements,
	omit,
	pick,
} from 'angular-three';
import { fbo } from 'angular-three-soba/misc';
import { MeshDiscardMaterial, MeshTransmissionMaterial } from 'angular-three-soba/vanilla-exports';
import { mergeInputs } from 'ngxtension/inject-inputs';
import * as THREE from 'three';

export type MeshTransmissionMaterialOptions = Exclude<
	ConstructorParameters<typeof MeshTransmissionMaterial>[0],
	undefined
>;

export type NgtsMeshTransmissionMaterialOptions = Partial<NgtThreeElements['ngt-mesh-physical-material']> &
	Omit<MeshTransmissionMaterialOptions, 'buffer' | 'anisotropicBlur' | 'samples' | 'transmissionSampler'> & {
		anisotropicBlur?: number;
		buffer?: THREE.Texture;
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
		background?: THREE.Texture | THREE.Color | null;
	};

const defaultOptions: NgtsMeshTransmissionMaterialOptions = {
	transmissionSampler: false,
	backside: false,
	side: THREE.FrontSide,
	transmission: 1,
	thickness: 0,
	backsideThickness: 0,
	backsideEnvMapIntensity: 1,
	samples: 10,
};

@Component({
	selector: 'ngts-mesh-transmission-material',
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
	protected parameters = omit(this.options, [
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

	protected transmissionSampler = pick(this.options, 'transmissionSampler');
	protected transmission = pick(this.options, 'transmission');
	protected thickness = pick(this.options, 'thickness');
	protected side = pick(this.options, 'side');

	materialRef = viewChild<ElementRef<MeshTransmissionMaterial & MeshTransmissionMaterialOptions>>('material');

	private backResolution = computed(() => this.backsideResolution() || this.resolution());

	private fboBack = fbo(() => ({ width: this.backResolution() }));
	private fboMain = fbo(() => ({ width: this.resolution() }));

	protected bufferTexture = computed(() => this.buffer() || this.fboMain.texture);
	protected anisotropicBlurOption = computed(() => this.anisotropicBlur() || this.anisotropy());

	private discardMaterial = new MeshDiscardMaterial();

	protected material = computed(() => {
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

		let oldBg: THREE.Texture | THREE.Color | null;
		let oldEnvMapIntensity: number | undefined;
		let oldTone: THREE.ToneMapping | undefined;
		let parent: THREE.Mesh | undefined;
		beforeRender(({ clock, gl, scene, camera }) => {
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
				this.fboMain,
				this.fboBack,
				this.transmissionSampler(),
				this.background(),
				this.backside(),
				this.backsideThickness(),
				this.backsideEnvMapIntensity(),
				this.thickness(),
				this.side(),
			];

			material.time = clock.elapsedTime;
			// Render only if the buffer matches the built-in and no transmission sampler is set
			// @ts-expect-error - we know material.buffer is not just undefined | null
			if (material.buffer === fboMain.texture && !transmissionSampler) {
				parent = getInstanceState(material)?.parent() as unknown as THREE.Mesh;

				if (parent) {
					// Save defaults
					oldTone = gl.toneMapping;
					oldBg = scene.background;
					oldEnvMapIntensity = material.envMapIntensity;

					// Switch off tonemapping lest it double tone maps
					// Save the current background and set the HDR as the new BG
					// Use discardmaterial, the parent will be invisible, but it's shadows will still be cast
					gl.toneMapping = THREE.NoToneMapping;
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
							side: THREE.BackSide,
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
