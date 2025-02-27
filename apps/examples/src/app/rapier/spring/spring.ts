import { ChangeDetectionStrategy, Component, computed, CUSTOM_ELEMENTS_SCHEMA, input, viewChild } from '@angular/core';
import { NgtArgs, NgtVector3, vector3 } from 'angular-three';
import { injectSpringJoint, NgtrBallCollider, NgtrRigidBody } from 'angular-three-rapier';
import { ColorRepresentation } from 'three';

@Component({
	selector: 'app-box',
	template: `
		<ngt-object3D rigidBody [options]="{ ccd: true, canSleep: false, density: 100 }" [position]="position()">
			<ngt-mesh castShadow receiveShadow>
				<ngt-box-geometry />
				<ngt-mesh-standard-material [color]="color()" />
			</ngt-mesh>
		</ngt-object3D>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtrRigidBody],
})
export class Box {
	position = input<NgtVector3>([0, 0, 0]);
	color = input<ColorRepresentation>('white');
}

@Component({
	selector: 'app-ball-spring',
	template: `
		<ngt-object3D
			rigidBody
			[options]="{ colliders: false, canSleep: false, ccd: true, mass: mass() }"
			[position]="position()"
			[name]="'spring-' + jointNum()"
		>
			<ngt-mesh castShadow receiveShadow>
				<ngt-sphere-geometry *args="[0.5]" />
				<ngt-mesh-standard-material color="#E09F3E" />
			</ngt-mesh>

			<ngt-object3D [ballCollider]="[0.5]" />
		</ngt-object3D>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtrRigidBody, NgtArgs, NgtrBallCollider],
})
export class BallSpring {
	floorRigidBody = input.required<NgtrRigidBody>();
	position = input.required<NgtVector3>();
	jointNum = input.required<number>();
	mass = input(1);
	total = input(30);

	private ballBody = viewChild.required(NgtrRigidBody);
	private stiffness = 1.0e3;

	constructor() {
		const floorBody = computed(() => this.floorRigidBody().rigidBody());
		const ballBody = computed(() => this.ballBody().rigidBody());

		const criticalDamping = computed(() => 2 * Math.sqrt(this.stiffness * this.mass()));
		const dampingRatio = computed(() => this.jointNum() / (this.total() / 2));
		const damping = computed(() => dampingRatio() * criticalDamping());
		const positionVector = vector3(this.position);

		injectSpringJoint(ballBody, floorBody, {
			data: () => ({
				body1Anchor: [0, 0, 0],
				body2Anchor: [positionVector().x, positionVector().y - 3, positionVector().z],
				restLength: 0,
				stiffness: this.stiffness,
				damping: damping(),
			}),
		});
	}
}

@Component({
	selector: 'app-rapier-spring',
	template: `
		<ngt-object3D #floor="rigidBody" rigidBody="fixed" [position]="[0, 0, 0]" />

		@for (ballPosition of balls; track $index) {
			<ngt-group>
				<app-ball-spring
					[floorRigidBody]="floor"
					[position]="ballPosition"
					[jointNum]="$index"
					[mass]="1"
					[total]="30"
				/>
				<app-box
					[position]="[ballPosition[0], ballPosition[1] + 3, ballPosition[2]]"
					[color]="COLORS_ARR[$index % 5]"
				/>
			</ngt-group>
		}
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'spring-rapier' },
	imports: [NgtrRigidBody, BallSpring, Box],
})
export default class SpringExample {
	protected readonly COLORS_ARR = ['#335C67', '#FFF3B0', '#E09F3E', '#9E2A2B', '#540B0E'];
	protected balls = Array.from({ length: 30 }, (_, i) => [-20 + 1.5 * (i + 1), 7.5, -30] as [number, number, number]);
}
