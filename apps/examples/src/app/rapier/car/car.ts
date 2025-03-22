import {
	ChangeDetectionStrategy,
	Component,
	computed,
	CUSTOM_ELEMENTS_SCHEMA,
	Directive,
	inject,
	input,
} from '@angular/core';
import { beforeRender, NgtArgs, NgtVector3 } from 'angular-three';
import { injectRevoluteJoint, NgtrRigidBody } from 'angular-three-rapier';
import { ResetOrbitControls } from '../reset-orbit-controls';

@Directive({ selector: '[rigidBody][wheel]' })
export class WheelJoint {
	body = input.required<NgtrRigidBody>({ alias: 'wheel' });
	bodyAnchor = input.required<NgtVector3>({ alias: 'position' });

	private wheel = inject(NgtrRigidBody, { host: true });
	private rigidBody = computed(() => this.body().rigidBody());

	constructor() {
		const revoluteJoint = injectRevoluteJoint(this.rigidBody, this.wheel.rigidBody, {
			data: () => ({ body1Anchor: this.bodyAnchor(), body2Anchor: [0, 0, 0], axis: [0, 0, 1] }),
		});

		beforeRender(() => {
			const joint = revoluteJoint();
			if (!joint) return;
			joint.configureMotorVelocity(20, 10);
		});
	}
}

@Component({
	selector: 'app-car-rapier',
	template: `
		<ngt-group>
			<ngt-object3D #body="rigidBody" rigidBody="dynamic" [options]="{ colliders: 'cuboid' }">
				<ngt-mesh castShadow receiveShadow name="chassis" [scale]="[6, 1, 1.9]">
					<ngt-box-geometry />
					<ngt-mesh-standard-material color="red" />
				</ngt-mesh>
			</ngt-object3D>

			@for (position of wheelPositions; track $index) {
				<ngt-object3D
					rigidBody="dynamic"
					[position]="position"
					[options]="{ colliders: 'hull' }"
					[wheel]="body"
				>
					<ngt-mesh castShadow receiveShadow [rotation.x]="Math.PI / 2">
						<ngt-cylinder-geometry *args="[1, 1, 1, 32]" />
						<ngt-mesh-standard-material color="grey" />
					</ngt-mesh>
				</ngt-object3D>
			}
		</ngt-group>
	`,
	hostDirectives: [ResetOrbitControls],
	changeDetection: ChangeDetectionStrategy.OnPush,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	imports: [NgtrRigidBody, WheelJoint, NgtArgs],
})
export default class CarExample {
	protected wheelPositions: NgtVector3[] = [
		[-3, 0, 2],
		[-3, 0, -2],
		[3, 0, 2],
		[3, 0, -2],
	];
	protected readonly Math = Math;
}
