import {
	ChangeDetectionStrategy,
	Component,
	computed,
	CUSTOM_ELEMENTS_SCHEMA,
	Directive,
	input,
	viewChild,
	viewChildren,
} from '@angular/core';
import { injectBeforeRender, NgtArgs, NgtVector3, NON_ROOT } from 'angular-three';
import { injectPrismaticJoint, injectSphericalJoint, NgtrRigidBody, NgtrRigidBodyType } from 'angular-three-rapier';
import { Quaternion, Vector3 } from 'three';

@Component({
	selector: 'app-rope-segment',
	standalone: true,
	imports: [NgtrRigidBody],
	template: `
		<ngt-object3D [ngtrRigidBody]="type()" [position]="position()">
			<ng-content />
		</ngt-object3D>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RopeSegment {
	type = input.required<NgtrRigidBodyType>();
	position = input<NgtVector3>([0, 0, 0]);

	rigidBodyRef = viewChild.required(NgtrRigidBody);
}

@Directive({ selector: 'ng-container[ropeJoint]', standalone: true })
export class RopeJoint {
	bodyA = input.required<NgtrRigidBody>();
	bodyB = input.required<NgtrRigidBody>();

	constructor() {
		const bodyA = computed(() => this.bodyA().rigidBody());
		const bodyB = computed(() => this.bodyB().rigidBody());
		injectSphericalJoint(bodyA, bodyB, { data: { body1Anchor: [-0.5, 0, 0], body2Anchor: [0.5, 0, 0] } });
	}
}

@Component({
	selector: 'app-rope',
	standalone: true,
	template: `
		<ngt-group>
			@for (i of count(); track $index) {
				<app-rope-segment [type]="$index === 0 ? 'kinematicPosition' : 'dynamic'" [position]="[$index, 0, 0]">
					<ngt-mesh [castShadow]="true" [scale]="0.5">
						<!-- TODO: *args works but clunky. Find a better way -->
						<ngt-sphere-geometry />
						<ngt-mesh-physical-material />
					</ngt-mesh>
				</app-rope-segment>
			}

			@for (segment of ropeSegments(); track $index) {
				@if (!$first) {
					<ng-container
						ropeJoint
						[bodyA]="segment.rigidBodyRef()"
						[bodyB]="ropeSegments()[$index - 1].rigidBodyRef()"
					/>
				}
			}
		</ngt-group>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [RopeSegment, NgtArgs, RopeJoint, NgtrRigidBody],
})
export class Rope {
	length = input.required<number>();
	protected count = computed(() => Array.from({ length: this.length() }));
	protected ropeSegments = viewChildren(RopeSegment);

	constructor() {
		const q = new Quaternion();
		const v = new Vector3();

		injectBeforeRender(() => {
			const now = performance.now();
			const ropeSegments = this.ropeSegments();
			const firstRope = ropeSegments[0]?.rigidBodyRef()?.rigidBody();

			if (firstRope) {
				q.set(0, Math.sin(now / 500) * 3, 0, q.w);
				v.set(0, Math.sin(now / 500) * 3, 0);

				firstRope.setNextKinematicRotation(q);
				firstRope.setNextKinematicTranslation(v);
			}
		});
	}
}

@Component({
	selector: 'app-prismatic',
	standalone: true,
	template: `
		<ngt-group>
			<ngt-object3D #bodyA ngtrRigidBody>
				<ngt-mesh>
					<ngt-box-geometry />
				</ngt-mesh>
			</ngt-object3D>
			<ngt-object3D #bodyB ngtrRigidBody>
				<ngt-mesh>
					<ngt-box-geometry />
				</ngt-mesh>
			</ngt-object3D>
		</ngt-group>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtrRigidBody],
})
export class Prismatic {
	bodyA = viewChild.required('bodyA', { read: NgtrRigidBody });
	bodyB = viewChild.required('bodyB', { read: NgtrRigidBody });

	constructor() {
		const bodyA = computed(() => this.bodyA().rigidBody());
		const bodyB = computed(() => this.bodyB().rigidBody());
		injectPrismaticJoint(bodyA, bodyB, {
			data: { body1Anchor: [-4, 0, 0], body2Anchor: [0, 4, 0], axis: [1, 0, 0], limits: [-2, 2] },
		});
	}
}

@Component({
	standalone: true,
	template: `
		<ngt-group>
			<app-rope [length]="40" />
			<app-prismatic />
		</ngt-group>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'joints-rapier' },
	imports: [Rope, Prismatic],
})
export class JointsExample {
	static [NON_ROOT] = true;
}
