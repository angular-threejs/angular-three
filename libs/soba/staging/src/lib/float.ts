import {
	CUSTOM_ELEMENTS_SCHEMA,
	ChangeDetectionStrategy,
	Component,
	ElementRef,
	Injector,
	afterNextRender,
	inject,
	input,
	viewChild,
} from '@angular/core';
import { NgtGroup, extend, injectBeforeRender, omit } from 'angular-three-core-new';
import { mergeInputs } from 'ngxtension/inject-inputs';
import { Group, MathUtils } from 'three';

extend({ Group });

export interface NgtsFloatOptions extends Partial<NgtGroup> {
	enabled: boolean;
	speed: number;
	rotationIntensity: number;
	floatIntensity: number;
	floatingRange: [number?, number?];
}

const defaultOptions: NgtsFloatOptions = {
	enabled: true,
	speed: 1,
	rotationIntensity: 1,
	floatIntensity: 1,
	floatingRange: [-0.1, 0.1],
};

@Component({
	selector: 'ngts-float',
	standalone: true,
	template: `
		<ngt-group [parameters]="parameters()">
			<ngt-group #float [matrixAutoUpdate]="false">
				<ng-content />
			</ngt-group>
		</ngt-group>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgtsFloat {
	options = input(defaultOptions, { transform: mergeInputs(defaultOptions) });
	parameters = omit(this.options, ['enabled', 'speed', 'rotationIntensity', 'floatIntensity', 'floatingRange']);

	floatRef = viewChild.required<ElementRef<Group>>('float');

	constructor() {
		const injector = inject(Injector);

		const offset = Math.random() * 10000;
		afterNextRender(() => {
			injectBeforeRender(
				({ clock }) => {
					const [{ enabled, speed, rotationIntensity, floatingRange, floatIntensity }] = [this.options()];
					if (!enabled || speed === 0) return;

					const container = this.floatRef().nativeElement;

					const offsetTime = offset + clock.getElapsedTime();
					container.rotation.x = (Math.cos((offsetTime / 4) * speed) / 8) * rotationIntensity;
					container.rotation.y = (Math.sin((offsetTime / 4) * speed) / 8) * rotationIntensity;
					container.rotation.z = (Math.sin((offsetTime / 4) * speed) / 20) * rotationIntensity;

					let yPosition = Math.sin((offsetTime / 4) * speed) / 10;
					yPosition = MathUtils.mapLinear(yPosition, -0.1, 0.1, floatingRange[0] ?? -0.1, floatingRange[1] ?? 0.1);
					container.position.y = yPosition * floatIntensity;
					container.updateMatrix();
				},
				{ injector },
			);
		});
	}
}
