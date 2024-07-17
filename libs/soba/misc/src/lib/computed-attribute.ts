import {
	CUSTOM_ELEMENTS_SCHEMA,
	ChangeDetectionStrategy,
	Component,
	ElementRef,
	afterNextRender,
	input,
	viewChild,
} from '@angular/core';
import { NgtArgs, NgtBufferAttribute, getLocalState } from 'angular-three';
import { injectAutoEffect } from 'ngxtension/auto-effect';
import { BufferAttribute, BufferGeometry } from 'three';

@Component({
	selector: 'ngts-computed-attribute',
	standalone: true,
	template: `
		<ngt-primitive #primitive *args="[bufferAttribute]" [attach]="['attributes', name()]" [parameters]="options()">
			<ng-content />
		</ngt-primitive>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtArgs],
})
/**
 * Used exclusively as a child of a BufferGeometry.
 * Computes the BufferAttribute by calling the `compute` function
 * and attaches the attribute to the geometry.
 */
export class NgtsComputedAttribute {
	compute = input.required<(geometry: BufferGeometry) => BufferAttribute>();
	name = input.required<string>();
	options = input({} as Partial<NgtBufferAttribute>);

	bufferAttribute = new BufferAttribute(new Float32Array(0), 1);
	primitive = viewChild<ElementRef<BufferAttribute>>('primitive');

	constructor() {
		const autoEffect = injectAutoEffect();

		afterNextRender(() => {
			autoEffect(() => {
				const primitive = this.primitive()?.nativeElement;
				if (!primitive) return;

				const localState = getLocalState(primitive);
				if (!localState) return;

				const geometry = ((primitive as any).parent as BufferGeometry) ?? localState.parent();
				console.log(geometry);

				const attribute = this.compute()(geometry);
				primitive.copy(attribute);
			});
		});
	}
}
