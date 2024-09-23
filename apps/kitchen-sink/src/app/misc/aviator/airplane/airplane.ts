import {
	afterNextRender,
	ChangeDetectionStrategy,
	Component,
	CUSTOM_ELEMENTS_SCHEMA,
	effect,
	ElementRef,
	inject,
	viewChild,
} from '@angular/core';
import { injectBeforeRender, NgtArgs } from 'angular-three';
import { BoxGeometry, DoubleSide, Matrix4, Object3D } from 'three';
import {
	COLORS,
	PLANE_AMP_HEIGHT,
	PLANE_AMP_WIDTH,
	PLANE_DEFAULT_HEIGHT,
	PLANE_MAX_SPEED,
	PLANE_MIN_SPEED,
	PLANE_MOVE_SENSITIVITY,
	PLANE_ROT_X_SENSITIVITY,
	PLANE_ROT_Z_SENSITIVITY,
} from '../constants';
import { GameStore } from '../game.store';
import { Pilot } from './pilot';
import { Propeller } from './propeller';
import { Tire } from './tire';
import { Wheel } from './wheel';

const frontUR = [40, 25, -25];
const frontUL = [40, 25, 25];
const frontLR = [40, -25, -25];
const frontLL = [40, -25, 25];
const backUR = [-40, 15, -5];
const backUL = [-40, 15, 5];
const backLR = [-40, 5, -5];
const backLL = [-40, 5, 5];

@Component({
	selector: 'app-airplane',
	standalone: true,
	template: `
		<ngt-object3D
			#airplane
			[castShadow]="true"
			[receiveShadow]="true"
			[scale]="0.25"
			[position]="[0, PLANE_DEFAULT_HEIGHT, 0]"
		>
			<!-- cabin -->
			<ngt-mesh [castShadow]="true" [receiveShadow]="true">
				<ngt-buffer-geometry>
					<ngt-buffer-attribute attach="attributes.position" *args="[cabinVertices, 3]" />
				</ngt-buffer-geometry>
				<ngt-mesh-phong-material [color]="COLORS.red" [flatShading]="true" [side]="DoubleSide" />
			</ngt-mesh>

			<!-- engine -->
			<ngt-mesh [position]="[50, 0, 0]" [castShadow]="true" [receiveShadow]="true">
				<ngt-box-geometry *args="[20, 50, 50]" />
				<ngt-mesh-phong-material [color]="COLORS.white" [flatShading]="true" />
			</ngt-mesh>

			<!-- tail plane -->
			<ngt-mesh [position]="[-40, 20, 0]" [castShadow]="true" [receiveShadow]="true">
				<ngt-box-geometry *args="[15, 20, 5]" />
				<ngt-mesh-phong-material [color]="COLORS.red" [flatShading]="true" />
			</ngt-mesh>

			<!-- side wing -->
			<ngt-mesh [position]="[0, 15, 0]" [castShadow]="true" [receiveShadow]="true">
				<ngt-box-geometry *args="[30, 5, 120]" />
				<ngt-mesh-phong-material [color]="COLORS.red" [flatShading]="true" />
			</ngt-mesh>

			<!-- windshield -->
			<ngt-mesh [position]="[20, 27, 0]" [castShadow]="true" [receiveShadow]="true">
				<ngt-box-geometry *args="[3, 15, 20]" />
				<ngt-mesh-phong-material [color]="COLORS.white" [transparent]="true" [opacity]="0.3" [flatShading]="true" />
			</ngt-mesh>

			<!-- propeller -->
			<app-propeller />

			<!-- wheels -->
			<app-wheel [position]="[25, -20, 25]" />
			<app-tire [position]="[25, -28, 25]" />
			<app-wheel [position]="[25, -20, -25]" />
			<app-tire [position]="[25, -28, -25]" />
			<app-tire [position]="[-35, -5, 0]" [scale]="0.5" />

			<!-- suspension -->
			<ngt-mesh [position]="[-35, -5, 0]" [rotation]="[0, 0, -0.3]">
				<ngt-box-geometry #suspensionGeometry *args="[4, 20, 4]" />
				<ngt-mesh-phong-material [color]="COLORS.red" [flatShading]="true" />
			</ngt-mesh>

			<!-- pilot -->
			<app-pilot [position]="[5, 27, 0]" />
		</ngt-object3D>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [Pilot, Propeller, Wheel, Tire, NgtArgs],
})
export class Airplane {
	protected readonly PLANE_DEFAULT_HEIGHT = PLANE_DEFAULT_HEIGHT;
	protected readonly COLORS = COLORS;
	protected readonly DoubleSide = DoubleSide;

	protected cabinVertices = new Float32Array(
		this.makeTetrahedron(frontUR, frontUL, frontLR, frontLL) // front
			.concat(this.makeTetrahedron(backUR, backUL, backLR, backLL)) // back
			.concat(this.makeTetrahedron(backUL, backLL, frontUL, frontLL)) // side
			.concat(this.makeTetrahedron(backUR, backLR, frontUR, frontLR)) // side
			.concat(this.makeTetrahedron(frontUL, backUL, frontUR, backUR)) // top
			.concat(this.makeTetrahedron(frontLL, backLL, frontLR, backLR)), // bottom
	);

	private suspensionGeometryRef = viewChild<ElementRef<BoxGeometry>>('suspensionGeometry');
	private airplaneRef = viewChild.required<ElementRef<Object3D>>('airplane');

	constructor() {
		const gameStore = inject(GameStore);

		afterNextRender(() => {
			gameStore.airplaneRef = this.airplaneRef;
		});

		effect(() => {
			const suspensionGeometry = this.suspensionGeometryRef()?.nativeElement;
			if (!suspensionGeometry) return;

			suspensionGeometry.applyMatrix4(new Matrix4().makeTranslation(0, 10, 0));
		});

		injectBeforeRender(({ delta, pointer }) => {
			const airplane = this.airplaneRef().nativeElement;
			if (!airplane) return;

			if (gameStore.state.status === 'playing') {
				gameStore.state.planeSpeed = this.normalize(pointer.x, -0.5, 0.5, PLANE_MIN_SPEED, PLANE_MAX_SPEED);
				let targetX = this.normalize(pointer.x, -1, 1, -PLANE_AMP_WIDTH * 0.7, -PLANE_AMP_WIDTH);
				let targetY = this.normalize(
					pointer.y,
					-0.75,
					0.75,
					PLANE_DEFAULT_HEIGHT - PLANE_AMP_HEIGHT,
					PLANE_DEFAULT_HEIGHT + PLANE_AMP_HEIGHT,
				);

				gameStore.state.planeCollisionDisplacementX += gameStore.state.planeCollisionSpeedX;
				targetX += gameStore.state.planeCollisionDisplacementX;

				gameStore.state.planeCollisionDisplacementY += gameStore.state.planeCollisionSpeedY;
				targetY += gameStore.state.planeCollisionDisplacementY;

				airplane.position.x += (targetX - airplane.position.x) * delta * 1_000 * PLANE_MOVE_SENSITIVITY;
				airplane.position.y += (targetY - airplane.position.y) * delta * 1_000 * PLANE_MOVE_SENSITIVITY;

				airplane.rotation.x = (airplane.position.y - targetY) * delta * 1_000 * PLANE_ROT_Z_SENSITIVITY;
				airplane.rotation.z = (targetY - airplane.position.y) * delta * 1_000 * PLANE_ROT_X_SENSITIVITY;
			}

			gameStore.state.planeCollisionSpeedX += (0 - gameStore.state.planeCollisionSpeedX) * delta * 1_000 * 0.03;
			gameStore.state.planeCollisionDisplacementX +=
				(0 - gameStore.state.planeCollisionDisplacementX) * delta * 1_000 * 0.01;
			gameStore.state.planeCollisionSpeedY += (0 - gameStore.state.planeCollisionSpeedY) * delta * 1_000 * 0.03;
			gameStore.state.planeCollisionDisplacementY +=
				(0 - gameStore.state.planeCollisionDisplacementY) * delta * 1_000 * 0.01;
		});
	}

	private makeTetrahedron(a: number[], b: number[], c: number[], d: number[]) {
		return [a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2], b[0], b[1], b[2], c[0], c[1], c[2], d[0], d[1], d[2]];
	}

	private normalize(v: number, vmin: number, vmax: number, tmin: number, tmax: number) {
		const nv = Math.max(Math.min(v, vmax), vmin);
		const dv = vmax - vmin;
		const pc = (nv - vmin) / dv;
		const dt = tmax - tmin;
		return tmin + pc * dt;
	}
}
