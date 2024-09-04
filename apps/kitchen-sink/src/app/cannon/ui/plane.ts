import {
	CUSTOM_ELEMENTS_SCHEMA,
	ChangeDetectionStrategy,
	Component,
	ElementRef,
	inject,
	input,
	viewChild,
} from '@angular/core';
import { NgtArgs } from 'angular-three';
import { injectPlane } from 'angular-three-cannon/body';
import { Mesh } from 'three';
import { PositionRotationInput } from './position-rotation-input';

@Component({
	selector: 'app-ui-plane',
	standalone: true,
	template: `
		<ngt-mesh #mesh [receiveShadow]="true">
			<ngt-plane-geometry *args="[size(), size()]" />
			@if (useShadowMaterial()) {
				<ngt-shadow-material [color]="color()" />
			} @else {
				<ngt-mesh-standard-material [color]="color()" />
			}
		</ngt-mesh>
	`,
	imports: [NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	hostDirectives: [{ directive: PositionRotationInput, inputs: ['position', 'rotation'] }],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiPlane {
	protected positionRotationInput = inject(PositionRotationInput, { host: true });

	color = input('#171717');
	size = input(10);
	useShadowMaterial = input(true);

	private mesh = viewChild.required<ElementRef<Mesh>>('mesh');

	constructor() {
		injectPlane(
			() => ({
				type: 'Static',
				rotation: this.positionRotationInput.rotation(),
				position: this.positionRotationInput.position(),
			}),
			this.mesh,
		);
	}
}
