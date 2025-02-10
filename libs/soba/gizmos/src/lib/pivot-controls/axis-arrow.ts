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
import { extend, injectStore, NgtArgs, NgtThreeEvent } from 'angular-three';
import { NgtsLine } from 'angular-three-soba/abstractions';
import { NgtsHTML } from 'angular-three-soba/misc';
import * as THREE from 'three';
import { ConeGeometry, CylinderGeometry, Group, Mesh, MeshBasicMaterial } from 'three';
import { NgtsPivotControls } from './pivot-controls';

const vec1 = new THREE.Vector3();
const vec2 = new THREE.Vector3();

export function calculateOffset(
	clickPoint: THREE.Vector3,
	normal: THREE.Vector3,
	rayStart: THREE.Vector3,
	rayDir: THREE.Vector3,
) {
	const e1 = normal.dot(normal);
	const e2 = normal.dot(clickPoint) - normal.dot(rayStart);
	const e3 = normal.dot(rayDir);

	if (e3 === 0) {
		return -e2 / e1;
	}

	vec1.copy(rayDir)
		.multiplyScalar(e1 / e3)
		.sub(normal);
	vec2.copy(rayDir)
		.multiplyScalar(e2 / e3)
		.add(rayStart)
		.sub(clickPoint);

	return -vec1.dot(vec2) / vec1.dot(vec1);
}

const upV = new THREE.Vector3(0, 1, 0);
const offsetMatrix = new THREE.Matrix4();

@Component({
	selector: 'ngts-axis-arrow',
	template: `
		<ngt-group #group>
			<ngt-group
				[matrix]="matrixL()"
				[matrixAutoUpdate]="false"
				(pointerdown)="onPointerDown($any($event))"
				(pointerup)="onPointerUp($any($event))"
				(pointermove)="onPointerMove($any($event))"
				(pointerout)="onPointerOut($any($event))"
			>
				@if (pivotControls.annotations()) {
					<ngts-html [options]="{ position: [0, -coneLength(), 0] }">
						<div
							#annotation
							htmlContent
							style="display: none; background: #151520; color: white; padding: 6px 8px; border-radius: 7px; white-space: nowrap;"
							[class]="pivotControls.annotationsClass()"
						></div>
					</ngts-html>
				}

				<ngt-mesh
					[visible]="false"
					[position]="[0, (cylinderLength() + coneLength()) / 2.0, 0]"
					[userData]="pivotControls.userData()"
				>
					<ngt-cylinder-geometry
						*args="[coneWidth() * 1.4, coneWidth() * 1.4, cylinderLength() + coneLength(), 8, 1]"
					/>
				</ngt-mesh>

				<ngts-line
					[points]="[0, 0, 0, 0, cylinderLength(), 0]"
					[options]="{
						raycast: null,
						side: DoubleSide,
						polygonOffset: true,
						polygonOffsetFactor: -10,
						renderOrder: 1,
						fog: false,
						transparent: true,
						lineWidth: pivotControls.lineWidth(),
						color: color(),
						opacity: pivotControls.opacity(),
						depthTest: pivotControls.depthTest(),
					}"
				/>

				<ngt-mesh
					[raycast]="null"
					[position]="[0, cylinderLength() + coneLength() / 2.0, 0]"
					[renderOrder]="500"
				>
					<ngt-cone-geometry *args="[coneWidth(), coneLength(), 24, 1]" />
					<ngt-mesh-basic-material
						transparent
						polygonOffset
						[depthTest]="pivotControls.depthTest()"
						[color]="color()"
						[opacity]="pivotControls.opacity()"
						[polygonOffsetFactor]="-10"
						[fog]="false"
					/>
				</ngt-mesh>
			</ngt-group>
		</ngt-group>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtArgs, NgtsLine, NgtsHTML],
})
export class NgtsAxisArrow {
	protected readonly DoubleSide = THREE.DoubleSide;

	direction = input.required<THREE.Vector3>();
	axis = input.required<0 | 1 | 2>();

	private groupRef = viewChild.required<ElementRef<THREE.Group>>('group');
	private annotationRef = viewChild<'string', ElementRef<HTMLElement>>('annotation', { read: ElementRef });

	protected pivotControls = inject(NgtsPivotControls);
	private store = injectStore();

	private hovered = signal(false);
	private clickInfo: { clickPoint: THREE.Vector3; dir: THREE.Vector3 } | null = null;
	private offset0 = 0;

	protected color = computed(() =>
		this.hovered() ? this.pivotControls.hoveredColor() : this.pivotControls.axisColors()[this.axis()],
	);

	protected coneWidth = computed(() =>
		this.pivotControls.fixed()
			? (this.pivotControls.lineWidth() / this.pivotControls.scale()) * 1.6
			: this.pivotControls.scale() / 20,
	);
	protected coneLength = computed(() => (this.pivotControls.fixed() ? 0.2 : this.pivotControls.scale() / 5));
	protected cylinderLength = computed(() =>
		this.pivotControls.fixed() ? 1 - this.coneLength() : this.pivotControls.scale() - this.coneLength(),
	);
	protected matrixL = computed(() => {
		const quaternion = new THREE.Quaternion().setFromUnitVectors(upV, this.direction().clone().normalize());
		return new THREE.Matrix4().makeRotationFromQuaternion(quaternion);
	});

	constructor() {
		extend({ Group, Mesh, ConeGeometry, CylinderGeometry, MeshBasicMaterial });
	}

	onPointerDown(event: NgtThreeEvent<PointerEvent>) {
		const [group, direction, axis, controls, annotation] = [
			this.groupRef().nativeElement,
			this.direction(),
			this.axis(),
			this.store.controls() as unknown as { enabled: boolean },
			this.annotationRef()?.nativeElement,
		];

		if (annotation) {
			annotation.innerText = `${this.pivotControls.translation[axis].toFixed(2)}`;
			annotation.style.display = 'block';
		}

		event.stopPropagation();

		const rotation = new THREE.Matrix4().extractRotation(group.matrixWorld);
		const origin = new THREE.Vector3().setFromMatrixPosition(group.matrixWorld);
		const clickPoint = event.point.clone();
		const dir = direction.clone().applyMatrix4(rotation).normalize();
		this.clickInfo = { clickPoint, dir };
		this.offset0 = this.pivotControls.translation[axis];
		this.pivotControls.onDragStart({ component: 'Arrow', axis, origin, directions: [dir] });

		if (controls) controls.enabled = false;

		// @ts-expect-error - setPointerCapture is not in the type definition
		event.target.setPointerCapture(event.pointerId);
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

		// @ts-expect-error - setPointerCapture is not in the type definition
		event.target.releasePointerCapture(event.pointerId);
	}

	onPointerMove(event: NgtThreeEvent<PointerEvent>) {
		event.stopPropagation();

		if (!this.hovered()) {
			this.hovered.set(true);
		}

		if (this.clickInfo) {
			const { clickPoint, dir } = this.clickInfo;
			const [translationLimits, annotation, axis] = [
				this.pivotControls.translationLimits(),
				this.annotationRef()?.nativeElement,
				this.axis(),
			];

			const [min, max] = translationLimits?.[axis] || [undefined, undefined];

			let offset = calculateOffset(clickPoint, dir, event.ray.origin, event.ray.direction);
			if (min !== undefined) {
				offset = Math.max(offset, min - this.offset0);
			}

			if (max !== undefined) {
				offset = Math.min(offset, max - this.offset0);
			}

			this.pivotControls.translation[axis] = this.offset0 + offset;

			if (annotation) {
				annotation.innerText = `${this.pivotControls.translation[axis].toFixed(2)}`;
			}

			offsetMatrix.makeTranslation(dir.x * offset, dir.y * offset, dir.z * offset);
			this.pivotControls.onDrag(offsetMatrix);
		}
	}

	onPointerOut(event: NgtThreeEvent<PointerEvent>) {
		event.stopPropagation();
		this.hovered.set(false);
	}
}
