import {
	CUSTOM_ELEMENTS_SCHEMA,
	ChangeDetectionStrategy,
	Component,
	ElementRef,
	computed,
	inject,
	input,
	signal,
	viewChild,
} from '@angular/core';
import { Triplet } from '@pmndrs/cannon-worker-api';
import { NgtArgs } from 'angular-three';
import { NgtcPhysics } from 'angular-three-cannon';
import { convexPolyhedron } from 'angular-three-cannon/body';
import { NgtcDebug } from 'angular-three-cannon/debug';
import { gltfResource } from 'angular-three-soba/loaders';
import { BoxGeometry, BufferGeometry, ConeGeometry, Mesh } from 'three';
import { GLTF, Geometry } from 'three-stdlib';
import { UiPlane } from '../ui/plane';
import { PositionRotationInput } from '../ui/position-rotation-input';

function toConvexProps(bufferGeometry: BufferGeometry): [vertices: Triplet[], faces: Triplet[]] {
	const geo = new Geometry().fromBufferGeometry(bufferGeometry);
	geo.mergeVertices();
	const vertices: Triplet[] = geo.vertices.map((v) => [v.x, v.y, v.z]);
	const faces: Triplet[] = geo.faces.map((f) => [f.a, f.b, f.c]);
	return [vertices, faces];
}

// A cone is a convex shape by definition...
@Component({
	selector: 'app-cone',
	template: `
		<ngt-mesh
			#mesh
			castShadow
			[geometry]="geometry()"
			[rotation]="positionRotationInputs.rotation()"
			[position]="positionRotationInputs.position()"
		>
			<ngt-mesh-normal-material />
		</ngt-mesh>
	`,
	hostDirectives: [{ directive: PositionRotationInput, inputs: ['position', 'rotation'] }],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Cone {
	protected positionRotationInputs = inject(PositionRotationInput, { host: true });

	sides = input.required<number>();

	protected geometry = computed(() => new ConeGeometry(0.7, 0.7, this.sides(), 1));
	private args = computed(() => toConvexProps(this.geometry()));

	private mesh = viewChild.required<ElementRef<Mesh>>('mesh');

	constructor() {
		convexPolyhedron(
			() => ({
				args: this.args(),
				mass: 100,
				position: this.positionRotationInputs.position(),
				rotation: this.positionRotationInputs.rotation(),
			}),
			this.mesh,
		);
	}
}

// ...And so is a cube!
@Component({
	selector: 'app-cube',
	template: `
		<ngt-mesh
			#mesh
			receiveShadow
			castShadow
			[geometry]="geometry()"
			[rotation]="positionRotationInputs.rotation()"
			[position]="positionRotationInputs.position()"
		>
			<ngt-mesh-normal-material />
		</ngt-mesh>
	`,
	hostDirectives: [{ directive: PositionRotationInput, inputs: ['position', 'rotation'] }],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Cube {
	protected positionRotationInputs = inject(PositionRotationInput, { host: true });
	size = input.required<number>();
	// NOTE: this is wildly inefficient vs useBox
	protected geometry = computed(() => new BoxGeometry(this.size(), this.size(), this.size()));
	private args = computed(() => toConvexProps(this.geometry()));

	private mesh = viewChild.required<ElementRef<Mesh>>('mesh');

	constructor() {
		convexPolyhedron(
			() => ({
				args: this.args(),
				mass: 100,
				position: this.positionRotationInputs.position(),
				rotation: this.positionRotationInputs.rotation(),
			}),
			this.mesh,
		);
	}
}

type DiamondGLTF = GLTF & {
	materials: {};
	nodes: { Cylinder: Mesh };
};

@Component({
	selector: 'app-diamond',
	template: `
		@if (geometry(); as geometry) {
			<ngt-mesh
				#mesh
				castShadow
				receiveShadow
				[geometry]="geometry"
				[rotation]="positionRotationInputs.rotation()"
			>
				<ngt-mesh-standard-material wireframe color="white" />
			</ngt-mesh>
		}
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	hostDirectives: [{ directive: PositionRotationInput, inputs: ['position', 'rotation'] }],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Diamond {
	protected positionRotationInputs = inject(PositionRotationInput, { host: true });

	private gltf = gltfResource<DiamondGLTF>(() => './diamond.glb');
	protected geometry = computed(() => {
		const gltf = this.gltf.value();
		if (!gltf) return null;
		return gltf.nodes.Cylinder.geometry;
	});
	private args = computed(() => {
		const geometry = this.geometry();
		if (!geometry) return undefined;
		return toConvexProps(geometry);
	});

	private mesh = viewChild<ElementRef<Mesh>>('mesh');

	constructor() {
		convexPolyhedron(
			() => ({
				args: this.args(),
				mass: 100,
				position: this.positionRotationInputs.position(),
				rotation: this.positionRotationInputs.rotation(),
			}),
			this.mesh,
		);
	}
}

@Component({
	selector: 'app-scene-graph',
	template: `
		<ngt-color *args="['lightpink']" attach="background" />
		<ngt-spot-light castShadow [angle]="0.3" [decay]="0" [intensity]="2 * Math.PI" [penumbra]="1" [position]="15">
			<ngt-vector2 *args="[2048, 2048]" attach="shadow.mapSize" />
		</ngt-spot-light>

		<ngtc-physics [options]="{ gravity: gravity() }" [debug]="{ enabled: false, scale: 1.1 }">
			<ngt-group (pointerdown)="toggleInvertGravity()">
				<app-ui-plane [rotation]="[-Math.PI / 2, 0, 0]" />
				<app-diamond [position]="[1, 5, 0]" [rotation]="[0.4, 0.1, 0.1]" />
				<app-cone [position]="[-1, 5, 0.5]" [rotation]="[0.1, 0.2, 0.1]" [sides]="6" />
				<app-cone [position]="[-1, 6, 0]" [rotation]="[0.5, 0.1, 0.1]" [sides]="8" />
				<app-cube [position]="[2, 3, -0.3]" [rotation]="[0.5, 0.4, -1]" [size]="0.4" />
				<app-cone [position]="[-0.3, 7, 1]" [rotation]="[1, 0.4, 0.1]" [sides]="7" />
			</ngt-group>
		</ngtc-physics>
	`,
	imports: [NgtArgs, NgtcPhysics, NgtcDebug, UiPlane, Diamond, Cone, Cube],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'convex-experience' },
})
export class SceneGraph {
	protected Math = Math;

	private invertGravity = signal(false);
	protected gravity = computed<Triplet>(() => [0, this.invertGravity() ? 5 : -10, 0]);

	toggleInvertGravity() {
		this.invertGravity.update((prev) => !prev);
	}
}
