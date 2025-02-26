import { ChangeDetectionStrategy, Component, computed, CUSTOM_ELEMENTS_SCHEMA, input, viewChild } from '@angular/core';
import { NgtArgs, NgtVector3 } from 'angular-three';
import { injectRopeJoint, NgtrBallCollider, NgtrRigidBody } from 'angular-three-rapier';

const WALL_COLORS = ['#50514F', '#CBD4C2', '#FFFCFF', '#247BA0', '#C3B299'];

@Component({
	selector: 'app-floor',
	template: `
		<ngt-object3D rigidBody="fixed" [position]="[0, -1, 0]">
			<ngt-mesh receiveShadow>
				<ngt-box-geometry *args="[20, 1, 20]" />
				<ngt-mesh-standard-material />
			</ngt-mesh>
		</ngt-object3D>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtrRigidBody, NgtArgs],
})
export class Floor {}

@Component({
	selector: 'app-box-wall',
	template: `
		<ngt-group name="wall" [rotation]="[0, -0.7853982, 0]" [position]="[-1.8, 0, -1.8]">
			@for (row of rows(); track row) {
				@for (column of columns(); track column) {
					<ngt-object3D rigidBody [options]="{ density: 2 }" [position]="[column, row, 0]">
						<ngt-mesh castShadow receiveShadow>
							<ngt-box-geometry />
							<ngt-mesh-standard-material [color]="WALL_COLORS[row % WALL_COLORS.length]" />
						</ngt-mesh>
					</ngt-object3D>
				}
			}
		</ngt-group>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtrRigidBody],
})
export class BoxWall {
	protected readonly WALL_COLORS = WALL_COLORS;

	height = input.required<number>();
	width = input.required<number>();

	protected rows = computed(() => Array.from({ length: this.height() }, (_, i) => i));
	protected columns = computed(() => Array.from({ length: this.width() }, (_, i) => i));
}

@Component({
	selector: 'app-rope-joint',
	template: `
		<ngt-group>
			<!--      Anchor-->
			<ngt-object3D #anchor rigidBody [position]="anchorPosition()" />

			<!--      Wrecking Ball-->
			<ngt-object3D
				#ball
				rigidBody
				[position]="ballPosition()"
				[options]="{ colliders: false, density: 30, restitution: 1.2 }"
			>
				<ngt-mesh castShadow receiveShadow>
					<ngt-sphere-geometry *args="[2]" />
					<ngt-mesh-standard-material [metalness]="1" [roughness]="0.3" />
				</ngt-mesh>

				<ngt-object3D ballCollider [args]="[2]" />
			</ngt-object3D>
		</ngt-group>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtrRigidBody, NgtArgs, NgtrBallCollider],
})
export class RopeJoint {
	length = input.required<number>();
	anchorPosition = input.required<NgtVector3>();
	ballPosition = input.required<NgtVector3>();

	private anchorBody = viewChild.required('anchor', { read: NgtrRigidBody });
	private ballBody = viewChild.required('ball', { read: NgtrRigidBody });

	constructor() {
		const anchorBody = computed(() => this.anchorBody().rigidBody());
		const ballBody = computed(() => this.ballBody().rigidBody());

		injectRopeJoint(anchorBody, ballBody, {
			data: () => ({ body1Anchor: [0, 0, 0], body2Anchor: [0, 0, 0], length: this.length() }),
		});
	}
}

@Component({
	selector: 'app-rapier-rope-joint',
	template: `
		<ngt-group [scale]="3">
			<app-floor />
			<app-box-wall [height]="10" [width]="6" />
			<app-rope-joint [length]="35" [anchorPosition]="[0, 15, 0]" [ballPosition]="[-8, 15, 8]" />
		</ngt-group>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'rope-joint-rapier' },
	imports: [Floor, BoxWall, RopeJoint],
})
export default class RopeJointExample {}
