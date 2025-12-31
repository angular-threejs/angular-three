import {
	ChangeDetectionStrategy,
	Component,
	computed,
	CUSTOM_ELEMENTS_SCHEMA,
	effect,
	ElementRef,
	input,
} from '@angular/core';
import { is, NgtAnyRecord, NgtArgs, NgtAttachable, omit, pick } from 'angular-three';
import * as THREE from 'three';
import CustomShaderMaterial from 'three-custom-shader-material/vanilla';

/**
 * A wrapper component for three-custom-shader-material that allows extending
 * existing Three.js materials with custom vertex and fragment shaders.
 *
 * @example
 * ```html
 * <ngts-custom-shader-material
 *   [baseMaterial]="MeshStandardMaterial"
 *   [options]="{
 *     vertexShader: myVertexShader,
 *     fragmentShader: myFragmentShader,
 *     uniforms: { time: { value: 0 } }
 *   }"
 * />
 * ```
 */
@Component({
	selector: 'ngts-custom-shader-material',
	template: `
		<ngt-primitive *args="[material()]" [attach]="attach()" [parameters]="parameters()">
			<ng-content />
		</ngt-primitive>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtArgs],
})
export class NgtsCustomShaderMaterial {
	/**
	 * The base Three.js material to extend. Can be a material instance, material class, or ElementRef to a material.
	 */
	baseMaterial = input.required<THREE.Material | typeof THREE.Material | ElementRef<THREE.Material>>();

	/**
	 * How to attach the material to its parent object.
	 * @default 'material'
	 */
	attach = input<NgtAttachable>('material');

	/**
	 * Configuration options for the custom shader material including vertex/fragment shaders,
	 * uniforms, and cache key.
	 */
	options = input({} as Omit<ConstructorParameters<typeof CustomShaderMaterial>[0], 'baseMaterial'>);

	/** Material parameters excluding shader-specific options. */
	parameters = omit(this.options, ['fragmentShader', 'vertexShader', 'uniforms', 'cacheKey']);

	private base = computed(() => {
		const baseMaterial = this.baseMaterial();
		return is.ref(baseMaterial) ? baseMaterial.nativeElement : baseMaterial;
	});

	private fragmentShader = pick(this.options, 'fragmentShader');
	private vertexShader = pick(this.options, 'vertexShader');
	private uniforms = pick(this.options, 'uniforms');
	private cacheKey = pick(this.options, 'cacheKey');

	/** The computed CustomShaderMaterial instance that combines the base material with custom shaders. */
	material = computed(() => {
		const [base, fragmentShader, vertexShader, uniforms, cacheKey] = [
			this.base(),
			this.fragmentShader(),
			this.vertexShader(),
			this.uniforms(),
			this.cacheKey(),
		];

		// NOTE: this is specific to angular-three
		if (is.instance(base)) {
			delete (base as NgtAnyRecord)['__ngt__'];
			delete (base as NgtAnyRecord)['__ngt_renderer__'];
		}

		return new CustomShaderMaterial({
			baseMaterial: base,
			fragmentShader,
			vertexShader,
			uniforms,
			cacheKey,
		});
	});

	constructor() {
		effect((onCleanup) => {
			const material = this.material();
			onCleanup(() => material.dispose());
		});
	}
}
