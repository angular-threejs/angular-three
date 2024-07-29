import {
	afterNextRender,
	ChangeDetectionStrategy,
	Component,
	CUSTOM_ELEMENTS_SCHEMA,
	ElementRef,
	input,
	viewChild,
} from '@angular/core';
import { checkUpdate, extend, NgtArgs, NgtGroup, omit, pick } from 'angular-three';
import { injectAutoEffect } from 'ngxtension/auto-effect';
import { mergeInputs } from 'ngxtension/inject-inputs';
import { BufferAttribute, Group, Mesh, PlaneGeometry } from 'three';

function easeInExpo(x: number) {
	return x === 0 ? 0 : Math.pow(2, 10 * x - 10);
}

export interface NgtsBackdropOptions extends Partial<NgtGroup> {
	floor: number;
	segments: number;
	receiveShadow?: boolean;
}

const defaultOptions: NgtsBackdropOptions = {
	floor: 0.25,
	segments: 20,
};

@Component({
	selector: 'ngts-backdrop',
	standalone: true,
	template: `
		<ngt-group #group [parameters]="parameters()">
			<ngt-mesh [receiveShadow]="receiveShadow()" [rotation]="[-Math.PI / 2, 0, Math.PI / 2]">
				<ngt-plane-geometry #plane *args="[1, 1, segments(), segments()]" />
				<ng-content />
			</ngt-mesh>
		</ngt-group>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtArgs],
})
export class NgtsBackdrop {
	protected readonly Math = Math;

	options = input(defaultOptions, { transform: mergeInputs(defaultOptions) });
	parameters = omit(this.options, ['floor', 'segments', 'receiveShadow']);

	groupRef = viewChild.required<ElementRef<Group>>('group');
	planeRef = viewChild<ElementRef<PlaneGeometry>>('plane');

	receiveShadow = pick(this.options, 'receiveShadow');
	segments = pick(this.options, 'segments');
	private floor = pick(this.options, 'floor');

	constructor() {
		extend({ Group, Mesh, PlaneGeometry });

		const autoEffect = injectAutoEffect();
		afterNextRender(() => {
			autoEffect(() => {
				const plane = this.planeRef()?.nativeElement;
				if (!plane) return;

				const [segments, floor] = [this.segments(), this.floor()];

				let i = 0;
				const offset = segments / segments / 2;
				const position = plane.attributes['position'] as BufferAttribute;
				for (let x = 0; x < segments + 1; x++) {
					for (let y = 0; y < segments + 1; y++) {
						position.setXYZ(
							i++,
							x / segments - offset + (x === 0 ? -floor : 0),
							y / segments - offset,
							easeInExpo(x / segments),
						);
					}
				}

				checkUpdate(position);
				plane.computeVertexNormals();
			});
		});
	}
}
