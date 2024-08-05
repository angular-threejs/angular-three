import {
	afterNextRender,
	ChangeDetectionStrategy,
	Component,
	computed,
	CUSTOM_ELEMENTS_SCHEMA,
	ElementRef,
	input,
} from '@angular/core';
import { is, NgtAnyRecord, NgtArgs, NgtAttachable, omit, pick } from 'angular-three';
import { injectAutoEffect } from 'ngxtension/auto-effect';
import { Material } from 'three';
import CustomShaderMaterial from 'three-custom-shader-material/vanilla';

@Component({
	selector: 'ngts-custom-shader-material',
	standalone: true,
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
	baseMaterial = input.required<Material | typeof Material | ElementRef<Material>>();
	attach = input<NgtAttachable>('material');
	options = input({} as Omit<ConstructorParameters<typeof CustomShaderMaterial>[0], 'baseMaterial'>);
	parameters = omit(this.options, ['fragmentShader', 'vertexShader', 'uniforms', 'cacheKey']);

	base = computed(() => {
		const baseMaterial = this.baseMaterial();
		return is.ref(baseMaterial) ? baseMaterial.nativeElement : baseMaterial;
	});

	private fragmentShader = pick(this.options, 'fragmentShader');
	private vertexShader = pick(this.options, 'vertexShader');
	private uniforms = pick(this.options, 'uniforms');
	private cacheKey = pick(this.options, 'cacheKey');

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
		const autoEffect = injectAutoEffect();
		afterNextRender(() => {
			autoEffect(() => {
				const material = this.material();
				return () => material.dispose();
			});
		});
	}
}
