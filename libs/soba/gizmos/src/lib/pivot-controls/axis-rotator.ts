import {
	ChangeDetectionStrategy,
	Component,
	computed,
	CUSTOM_ELEMENTS_SCHEMA,
	ElementRef,
	inject,
	input,
	Signal,
	signal,
	viewChild,
} from '@angular/core';
import { extend, injectStore, NgtThreeEvent } from 'angular-three';
import { NgtsLine } from 'angular-three-soba/abstractions';
import { NgtsHTML, NgtsHTMLContent } from 'angular-three-soba/misc';
import { DoubleSide, Group, Matrix4, Plane, Ray, Vector3 } from 'three';
import { NgtsPivotControls } from './pivot-controls';

const clickDir = new Vector3();
const intersectionDir = new Vector3();

function toDegrees(radians: number) {
	return (radians * 180) / Math.PI;
}

function toRadians(degrees: number) {
	return (degrees * Math.PI) / 180;
}

function calculateAngle(clickPoint: Vector3, intersectionPoint: Vector3, origin: Vector3, e1: Vector3, e2: Vector3) {
	clickDir.copy(clickPoint).sub(origin);
	intersectionDir.copy(intersectionPoint).sub(origin);
	const dote1e1 = e1.dot(e1);
	const dote2e2 = e2.dot(e2);
	const uClick = clickDir.dot(e1) / dote1e1;
	const vClick = clickDir.dot(e2) / dote2e2;
	const uIntersection = intersectionDir.dot(e1) / dote1e1;
	const vIntersection = intersectionDir.dot(e2) / dote2e2;
	const angleClick = Math.atan2(vClick, uClick);
	const angleIntersection = Math.atan2(vIntersection, uIntersection);
	return angleIntersection - angleClick;
}

function fmod(num: number, denom: number) {
	let k = Math.floor(num / denom);
	k = k < 0 ? k + 1 : k;

	return num - k * denom;
}

function minimizeAngle(angle: number) {
	let result = fmod(angle, 2 * Math.PI);

	if (Math.abs(result) < 1e-6) {
		return 0.0;
	}

	if (result < 0.0) {
		result += 2 * Math.PI;
	}

	return result;
}

const rotMatrix = new Matrix4();
const posNew = new Vector3();
const ray = new Ray();
const intersection = new Vector3();

@Component({
	selector: 'ngts-axis-rotator',
	standalone: true,
	template: `
		<ngt-group
			#group
			[matrix]="matrixL()"
			[matrixAutoUpdate]="false"
			(pointerdown)="onPointerDown($any($event))"
			(pointermove)="onPointerMove($any($event))"
			(pointerup)="onPointerUp($any($event))"
			(pointerout)="onPointerOut($any($event))"
		>
			@if (pivotControls.annotations()) {
				<ngts-html [options]="{ position: [r(), r(), 0] }">
					<div
						#annotation
						ngtsHTMLContent
						style="display: none; background: #151520; color: white; padding: 6px 8px; border-radius: 7px; white-space: nowrap"
						[class]="pivotControls.annotationsClass()"
					></div>
				</ngts-html>
			}

			<ngts-line
				[points]="arc()"
				[options]="{ lineWidth: pivotControls.lineWidth() * 4, visible: false, userData: pivotControls.userData() }"
			/>

			<ngts-line
				[points]="arc()"
				[options]="{
					transparent: true,
					raycast: null,
					depthTest: pivotControls.depthTest(),
					lineWidth: pivotControls.lineWidth(),
					side: DoubleSide,
					color: hovered() ? pivotControls.hoveredColor() : pivotControls.axisColors()[axis()],
					opacity: pivotControls.opacity(),
					polygonOffset: true,
					polygonOffsetFactor: -10,
					fog: false,
				}"
			/>
		</ngt-group>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtsLine, NgtsHTML, NgtsHTMLContent],
})
export class NgtsAxisRotator {
	protected readonly DoubleSide = DoubleSide;

	dir1 = input.required<Vector3>();
	dir2 = input.required<Vector3>();
	axis = input.required<0 | 1 | 2>();

	groupRef = viewChild.required<ElementRef<Group>>('group');
	annotationRef = viewChild<unknown, ElementRef<HTMLDivElement>>('annotation', { read: ElementRef });

	pivotControls = inject(NgtsPivotControls);
	private store = injectStore();
	private controls = this.store.select('controls') as unknown as Signal<{ enabled: boolean }>;

	hovered = signal(false);
	private angle = 0;
	private angle0 = 0;
	private clickInfo: {
		clickPoint: Vector3;
		origin: Vector3;
		e1: Vector3;
		e2: Vector3;
		normal: Vector3;
		plane: Plane;
	} | null = null;

	matrixL = computed(() => {
		const dir1N = this.dir1().clone().normalize();
		const dir2N = this.dir2().clone().normalize();
		return new Matrix4().makeBasis(dir1N, dir2N, dir1N.clone().cross(dir2N));
	});
	r = computed(() => (this.pivotControls.fixed() ? 0.65 : this.pivotControls.scale() * 0.65));
	arc = computed(() => {
		const segments = 32;
		const points: Vector3[] = [];
		for (let j = 0; j <= segments; j++) {
			const angle = (j * (Math.PI / 2)) / segments;
			points.push(new Vector3(Math.cos(angle) * this.r(), Math.sin(angle) * this.r(), 0));
		}
		return points;
	});

	constructor() {
		extend({ Group });
	}

	onPointerDown(event: NgtThreeEvent<PointerEvent>) {
		const [annotation, group, axis, controls] = [
			this.annotationRef()?.nativeElement,
			this.groupRef().nativeElement,
			this.axis(),
			this.controls(),
		];

		if (annotation) {
			annotation.innerText = `${toDegrees(this.angle).toFixed(0)}º`;
			annotation.style.display = 'block';
		}

		event.stopPropagation();
		const clickPoint = event.point.clone();
		const origin = new Vector3().setFromMatrixPosition(group.matrixWorld);
		const e1 = new Vector3().setFromMatrixColumn(group.matrixWorld, 0).normalize();
		const e2 = new Vector3().setFromMatrixColumn(group.matrixWorld, 1).normalize();
		const normal = new Vector3().setFromMatrixColumn(group.matrixWorld, 2).normalize();
		const plane = new Plane().setFromNormalAndCoplanarPoint(normal, origin);
		this.clickInfo = { clickPoint, origin, e1, e2, normal, plane };
		this.pivotControls.onDragStart({ component: 'Rotator', axis, origin, directions: [e1, e2, normal] });

		if (controls) {
			controls.enabled = false;
		}

		// @ts-expect-error - setPointerCapture is not a function on PointerEvent
		event.target.setPointerCapture(event.pointerId);
	}

	onPointerMove(event: NgtThreeEvent<PointerEvent>) {
		event.stopPropagation();
		if (!this.hovered()) this.hovered.set(true);
		if (this.clickInfo) {
			const { clickPoint, origin, e1, e2, normal, plane } = this.clickInfo;
			const [rotationLimits, axis, annotation] = [
				this.pivotControls.rotationLimits(),
				this.axis(),
				this.annotationRef()?.nativeElement,
			];

			const [min, max] = rotationLimits?.[axis] || [undefined, undefined];

			ray.copy(event.ray);
			ray.intersectPlane(plane, intersection);
			ray.direction.negate();
			ray.intersectPlane(plane, intersection);
			let deltaAngle = calculateAngle(clickPoint, intersection, origin, e1, e2);
			let degrees = toDegrees(deltaAngle);

			if (event.shiftKey) {
				degrees = Math.round(degrees / 10) * 10;
				deltaAngle = toRadians(degrees);
			}

			if (min !== undefined && max !== undefined && max - min < 2 * Math.PI) {
				deltaAngle = minimizeAngle(deltaAngle);
				deltaAngle = deltaAngle > Math.PI ? deltaAngle - 2 * Math.PI : deltaAngle;
				deltaAngle = Math.round(deltaAngle / 10) * 10;
				this.angle = this.angle0 + deltaAngle;
			} else {
				this.angle = minimizeAngle(this.angle0 + deltaAngle);
				this.angle = this.angle > Math.PI ? this.angle - 2 * Math.PI : this.angle;
			}

			if (annotation) {
				degrees = toDegrees(this.angle);
				annotation.innerText = `${degrees.toFixed(0)}º`;
			}

			rotMatrix.makeRotationAxis(normal, deltaAngle);
			posNew.copy(origin).applyMatrix4(rotMatrix).sub(origin).negate();
			rotMatrix.setPosition(posNew);
			this.pivotControls.onDrag(rotMatrix);
		}
	}

	onPointerUp(event: NgtThreeEvent<PointerEvent>) {
		const [annotation, controls] = [this.annotationRef()?.nativeElement, this.controls()];
		if (annotation) {
			annotation.style.display = 'none';
		}
		event.stopPropagation();
		this.clickInfo = null;
		this.pivotControls.onDragEnd();
		if (controls) {
			controls.enabled = true;
		}
		// @ts-expect-error - releasePointerCapture is not a function on PointerEvent
		event.target.releasePointerCapture(event.pointerId);
	}

	onPointerOut(event: NgtThreeEvent<PointerEvent>) {
		event.stopPropagation();
		this.hovered.set(false);
	}
}
