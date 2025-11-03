import {
	ChangeDetectionStrategy,
	Component,
	computed,
	CUSTOM_ELEMENTS_SCHEMA,
	ElementRef,
	inject,
	input,
	signal,
	viewChild,
} from '@angular/core';
import { extend, injectStore, NgtThreeEvent, objectEvents } from 'angular-three';
import { NgtsLine } from 'angular-three-soba/abstractions';
import { NgtsHTML } from 'angular-three-soba/misc';
import * as THREE from 'three';
import { Group, Mesh, MeshBasicMaterial, PlaneGeometry } from 'three';
import { NgtsPivotControls } from './pivot-controls';

function decomposeIntoBasis(e1: THREE.Vector3, e2: THREE.Vector3, offset: THREE.Vector3) {
	const i1 =
		Math.abs(e1.x) >= Math.abs(e1.y) && Math.abs(e1.x) >= Math.abs(e1.z)
			? 0
			: Math.abs(e1.y) >= Math.abs(e1.x) && Math.abs(e1.y) >= Math.abs(e1.z)
				? 1
				: 2;
	const e2DegrowthOrder = [0, 1, 2].sort((a, b) => Math.abs(e2.getComponent(b)) - Math.abs(e2.getComponent(a)));
	const i2 = i1 === e2DegrowthOrder[0] ? e2DegrowthOrder[1] : e2DegrowthOrder[0];
	const a1 = e1.getComponent(i1);
	const a2 = e1.getComponent(i2);
	const b1 = e2.getComponent(i1);
	const b2 = e2.getComponent(i2);
	const c1 = offset.getComponent(i1);
	const c2 = offset.getComponent(i2);

	const y = (c2 - c1 * (a2 / a1)) / (b2 - b1 * (a2 / a1));
	const x = (c1 - y * b1) / a1;

	return [x, y];
}

const ray = new THREE.Ray();
const intersection = new THREE.Vector3();
const offsetMatrix = new THREE.Matrix4();

@Component({
	selector: 'ngts-plane-slider',
	template: `
		<ngt-group #group [matrix]="matrixL()" [matrixAutoUpdate]="false">
			@if (pivotControls.annotations()) {
				<ngts-html [options]="{ position: [0, 0, 0] }">
					<div
						#annotation
						htmlContent
						style="display: none; background: #151520; color: white; padding: 6px 8px; border-radius: 7px; white-space: nowrap"
						[class]="pivotControls.annotationsClass()"
					></div>
				</ngts-html>
			}
			<ngt-group [position]="[pos1() * 1.7, pos1() * 1.7, 0]">
				<ngt-mesh
					#mesh
					visible
					[scale]="length()"
					[userData]="pivotControls.userData()"
					[renderOrder]="pivotControls.renderOrder()"
				>
					<ngt-plane-geometry />
					<ngt-mesh-basic-material
						transparent
						polygonOffset
						[depthTest]="pivotControls.depthTest()"
						[color]="color()"
						[polygonOffsetFactor]="-10"
						[side]="DoubleSide"
						[fog]="false"
					/>
				</ngt-mesh>
				<ngts-line
					[points]="points()"
					[options]="{
						position: [-length() / 2, -length() / 2, 0],
						transparent: true,
						depthTest: pivotControls.depthTest(),
						lineWidth: pivotControls.lineWidth(),
						color: color(),
						opacity: pivotControls.opacity(),
						polygonOffset: true,
						polygonOffsetFactor: -10,
						userData: pivotControls.userData(),
						fog: false,
						renderOrder: pivotControls.renderOrder(),
					}"
				/>
			</ngt-group>
		</ngt-group>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtsHTML, NgtsLine],
})
export class NgtsPlaneSlider {
	protected readonly DoubleSide = THREE.DoubleSide;

	dir1 = input.required<THREE.Vector3>();
	dir2 = input.required<THREE.Vector3>();
	axis = input.required<0 | 1 | 2>();

	groupRef = viewChild.required<ElementRef<THREE.Group>>('group');
	private meshRef = viewChild.required<ElementRef<THREE.Mesh>>('mesh');
	annotationRef = viewChild<string, ElementRef<HTMLDivElement>>('annotation', { read: ElementRef });

	protected pivotControls = inject(NgtsPivotControls);
	private store = injectStore();

	private hovered = signal(false);
	private clickInfo: { clickPoint: THREE.Vector3; e1: THREE.Vector3; e2: THREE.Vector3; plane: THREE.Plane } | null =
		null;
	private offsetX0 = 0;
	private offsetY0 = 0;

	protected matrixL = computed(() => {
		const dir1N = this.dir1().clone().normalize();
		const dir2N = this.dir2().clone().normalize();
		return new THREE.Matrix4().makeBasis(dir1N, dir2N, dir1N.clone().cross(dir2N));
	});

	protected pos1 = computed(() => (this.pivotControls.fixed() ? 1 / 7 : this.pivotControls.scale() / 7));
	protected length = computed(() => (this.pivotControls.fixed() ? 0.225 : this.pivotControls.scale() * 0.225));
	protected color = computed(() =>
		this.hovered() ? this.pivotControls.hoveredColor() : this.pivotControls.axisColors()[this.axis()],
	);
	points = computed(() => {
		const length = this.length();
		return [
			new THREE.Vector3(0, 0, 0),
			new THREE.Vector3(0, length, 0),
			new THREE.Vector3(length, length, 0),
			new THREE.Vector3(length, 0, 0),
			new THREE.Vector3(0, 0, 0),
		];
	});

	constructor() {
		extend({ Group, Mesh, PlaneGeometry, MeshBasicMaterial });

		// TODO: (chau) remove this when event binding syntax no longer trigger cdr
		objectEvents(this.meshRef, {
			pointerdown: this.onPointerDown.bind(this),
			pointermove: this.onPointerMove.bind(this),
			pointerup: this.onPointerUp.bind(this),
			pointerout: this.onPointerOut.bind(this),
		});
	}

	onPointerDown(event: NgtThreeEvent<PointerEvent>) {
		const [annotation, axis, group, controls] = [
			this.annotationRef()?.nativeElement,
			this.axis(),
			this.groupRef().nativeElement,
			this.store.controls() as unknown as { enabled: boolean },
		];

		if (annotation) {
			annotation.innerText = `${this.pivotControls.translation[(axis + 1) % 3].toFixed(2)}, ${this.pivotControls.translation[(axis + 2) % 3].toFixed(2)}`;
			annotation.style.display = 'block';
		}

		event.stopPropagation();
		const clickPoint = event.point.clone();
		const origin = new THREE.Vector3().setFromMatrixPosition(group.matrixWorld);
		const e1 = new THREE.Vector3().setFromMatrixColumn(group.matrixWorld, 0).normalize();
		const e2 = new THREE.Vector3().setFromMatrixColumn(group.matrixWorld, 1).normalize();
		const normal = new THREE.Vector3().setFromMatrixColumn(group.matrixWorld, 2).normalize();
		const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(normal, origin);
		this.clickInfo = { clickPoint, e1, e2, plane };
		this.offsetX0 = this.pivotControls.translation[(axis + 1) % 3];
		this.offsetY0 = this.pivotControls.translation[(axis + 2) % 3];
		this.pivotControls.onDragStart({ component: 'Slider', axis, origin, directions: [e1, e2, normal] });

		if (controls) controls.enabled = false;

		// @ts-expect-error - setPointerCapture is not defined on ThreeEvent
		event.target.setPointerCapture(event.pointerId);
	}

	onPointerMove(event: NgtThreeEvent<PointerEvent>) {
		event.stopPropagation();
		if (!this.hovered()) this.hovered.set(true);

		if (this.clickInfo) {
			const { clickPoint, e1, e2, plane } = this.clickInfo;
			const [translationLimits, axis, annotation] = [
				this.pivotControls.translationLimits(),
				this.axis(),
				this.annotationRef()?.nativeElement,
			];

			const [minX, maxX] = translationLimits?.[(axis + 1) % 3] || [undefined, undefined];
			const [minY, maxY] = translationLimits?.[(axis + 2) % 3] || [undefined, undefined];

			ray.copy(event.ray);
			ray.intersectPlane(plane, intersection);
			ray.direction.negate();
			ray.intersectPlane(plane, intersection);
			intersection.sub(clickPoint);
			let [offsetX, offsetY] = decomposeIntoBasis(e1, e2, intersection);
			/* let offsetY = (intersection.y - (intersection.x * e1.y) / e1.x) / (e2.y - (e2.x * e1.y) / e1.x)
      let offsetX = (intersection.x - offsetY * e2.x) / e1.x */
			if (minX !== undefined) {
				offsetX = Math.max(offsetX, minX - this.offsetX0);
			}
			if (maxX !== undefined) {
				offsetX = Math.min(offsetX, maxX - this.offsetX0);
			}
			if (minY !== undefined) {
				offsetY = Math.max(offsetY, minY - this.offsetY0);
			}
			if (maxY !== undefined) {
				offsetY = Math.min(offsetY, maxY - this.offsetY0);
			}
			this.pivotControls.translation[(axis + 1) % 3] = this.offsetX0 + offsetX;
			this.pivotControls.translation[(axis + 2) % 3] = this.offsetY0 + offsetY;

			if (annotation) {
				annotation.innerText = `${this.pivotControls.translation[(axis + 1) % 3].toFixed(2)}, ${this.pivotControls.translation[(axis + 2) % 3].toFixed(2)}`;
			}

			offsetMatrix.makeTranslation(
				offsetX * e1.x + offsetY * e2.x,
				offsetX * e1.y + offsetY * e2.y,
				offsetX * e1.z + offsetY * e2.z,
			);
			this.pivotControls.onDrag(offsetMatrix);
		}
	}

	onPointerUp(event: NgtThreeEvent<PointerEvent>) {
		const [annotation, controls] = [
			this.annotationRef()?.nativeElement,
			this.store.controls() as unknown as { enabled: boolean },
		];
		if (annotation) {
			annotation.style.display = 'none';
		}
		event.stopPropagation();
		this.clickInfo = null;
		this.pivotControls.onDragEnd();

		if (controls) controls.enabled = true;

		// @ts-expect-error - releasePointerCapture is not defined on ThreeEvent
		event.target.releasePointerCapture(event.pointerId);
	}

	onPointerOut(event: NgtThreeEvent<PointerEvent>) {
		event.stopPropagation();
		this.hovered.set(false);
	}
}
