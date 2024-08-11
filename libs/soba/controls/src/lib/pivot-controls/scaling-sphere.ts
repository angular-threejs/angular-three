import {
	ChangeDetectionStrategy,
	Component,
	computed,
	CUSTOM_ELEMENTS_SCHEMA,
	ElementRef,
	inject,
	input,
	signal,
	Signal,
	viewChild,
} from '@angular/core';
import { extend, injectStore, NgtArgs, NgtThreeEvent } from 'angular-three';
import { calculateScaleFactor, NgtsHTML, NgtsHTMLContent } from 'angular-three-soba/misc';
import { Group, Matrix4, Mesh, MeshBasicMaterial, Quaternion, SphereGeometry, Vector3 } from 'three';
import { NgtsPivotControls } from './pivot-controls';

const vec1 = new Vector3();
const vec2 = new Vector3();

export function calculateOffset(clickPoint: Vector3, normal: Vector3, rayStart: Vector3, rayDir: Vector3) {
	const e1 = normal.dot(normal);
	const e2 = normal.dot(clickPoint) - normal.dot(rayStart);
	const e3 = normal.dot(rayDir);

	if (e3 === 0) {
		return -e2 / e1;
	}

	vec1
		.copy(rayDir)
		.multiplyScalar(e1 / e3)
		.sub(normal);
	vec2
		.copy(rayDir)
		.multiplyScalar(e2 / e3)
		.add(rayStart)
		.sub(clickPoint);

	return -vec1.dot(vec2) / vec1.dot(vec1);
}

const upV = new Vector3(0, 1, 0);
const scaleV = new Vector3();
const scaleMatrix = new Matrix4();

@Component({
	selector: 'ngts-scaling-sphere',
	standalone: true,
	template: `
		<ngt-group #group>
			<ngt-group
				[matrix]="matrixL()"
				[matrixAutoUpdate]="false"
				(pointerdown)="onPointerDown($any($event))"
				(pointermove)="onPointerMove($any($event))"
				(pointerup)="onPointerUp($any($event))"
				(pointerout)="onPointerOut($any($event))"
			>
				@if (pivotControls.annotations()) {
					<ngts-html [options]="{ position: [0, position() / 2, 0] }">
						<div
							#annotation
							ngtsHTMLContent
							style="display: none; background: #151520; color: white; padding: 6px 8px; border-radius: 7px; white-space: nowrap;"
							[class]="pivotControls.annotationsClass()"
						></div>
					</ngts-html>
				}
				<ngt-mesh #mesh [position]="[0, position(), 0]" [renderOrder]="500" [userData]="pivotControls.userData()">
					<ngt-sphere-geometry *args="[radius(), 12, 12]" />
					<ngt-mesh-basic-material
						[transparent]="true"
						[depthTest]="pivotControls.depthTest()"
						[color]="color()"
						[opacity]="pivotControls.opacity()"
						[polygonOffset]="true"
						[polygonOffsetFactor]="-10"
					/>
				</ngt-mesh>
			</ngt-group>
		</ngt-group>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtsHTML, NgtsHTMLContent, NgtArgs],
})
export class NgtsScalingSphere {
	direction = input.required<Vector3>();
	axis = input.required<0 | 1 | 2>();

	groupRef = viewChild.required<ElementRef<Group>>('group');
	annotationRef = viewChild<unknown, ElementRef<HTMLDivElement>>('annotation', { read: ElementRef });
	meshRef = viewChild.required<ElementRef<Mesh>>('mesh');

	pivotControls = inject(NgtsPivotControls);
	private store = injectStore();
	private controls = this.store.select('controls') as unknown as Signal<{ enabled: boolean }>;
	private size = this.store.select('size');

	private hovered = signal(false);
	private scale0 = 1;
	private scaleCurrent = 1;
	private clickInfo: {
		clickPoint: Vector3;
		dir: Vector3;
		mPLG: Matrix4;
		mPLGInv: Matrix4;
		offsetMultiplier: number;
	} | null = null;

	position = computed(() => (this.pivotControls.fixed() ? 1.2 : 1.2 * this.pivotControls.scale()));
	radius = computed(() =>
		this.pivotControls.fixed()
			? (this.pivotControls.lineWidth() / this.pivotControls.scale()) * 1.8
			: this.pivotControls.scale() / 22.5,
	);
	matrixL = computed(() => {
		const quaternion = new Quaternion().setFromUnitVectors(upV, this.direction().clone().normalize());
		return new Matrix4().makeRotationFromQuaternion(quaternion);
	});
	color = computed(() =>
		this.hovered() ? this.pivotControls.hoveredColor() : this.pivotControls.axisColors()[this.axis()],
	);

	constructor() {
		extend({ Group, Mesh, SphereGeometry, MeshBasicMaterial });
	}

	onPointerDown(event: NgtThreeEvent<PointerEvent>) {
		const [annotation, controls, fixed, scale, direction, axis, size, group] = [
			this.annotationRef()?.nativeElement,
			this.controls(),
			this.pivotControls.fixed(),
			this.pivotControls.scale(),
			this.direction(),
			this.axis(),
			this.size(),
			this.groupRef().nativeElement,
		];

		if (annotation) {
			annotation.innerText = `${scale.toFixed(2)}`;
			annotation.style.display = 'block';
		}

		event.stopPropagation();
		const rotation = new Matrix4().extractRotation(group.matrixWorld);
		const clickPoint = event.point.clone();
		const origin = new Vector3().setFromMatrixPosition(group.matrixWorld);
		const dir = direction.clone().applyMatrix4(rotation).normalize();
		const mPLG = group.matrixWorld.clone();
		const mPLGInv = mPLG.clone().invert();
		const offsetMultiplier = fixed
			? 1 / calculateScaleFactor(group.getWorldPosition(vec1), scale, event.camera, size)
			: 1;
		this.clickInfo = { clickPoint, dir, mPLG, mPLGInv, offsetMultiplier };
		this.pivotControls.onDragStart({ component: 'Sphere', axis, origin, directions: [dir] });

		if (controls) {
			controls.enabled = false;
		}
		// @ts-expect-error - setPointerCapture is not in the type definition
		event.target.setPointerCapture(event.pointerId);
	}

	onPointerMove(event: NgtThreeEvent<PointerEvent>) {
		event.stopPropagation();
		if (!this.hovered()) this.hovered.set(true);

		if (this.clickInfo) {
			const { clickPoint, dir, mPLG, mPLGInv, offsetMultiplier } = this.clickInfo;
			const [scaleLimits, axis, position, annotation, fixed, scale, mesh] = [
				this.pivotControls.scaleLimits(),
				this.axis(),
				this.position(),
				this.annotationRef()?.nativeElement,
				this.pivotControls.fixed(),
				this.pivotControls.scale(),
				this.meshRef().nativeElement,
			];

			const [min, max] = scaleLimits?.[axis] || [1e-5, undefined]; // always limit the minimal value, since setting it very low might break the transform
			const offsetW = calculateOffset(clickPoint, dir, event.ray.origin, event.ray.direction);
			const offsetL = offsetW * offsetMultiplier;
			const offsetH = fixed ? offsetL : offsetL / scale;
			let upscale = Math.pow(2, offsetH * 0.2);

			if (event.shiftKey) {
				upscale = Math.round(upscale * 10) / 10;
			}

			upscale = Math.max(upscale, min / this.scale0);

			if (max !== undefined) {
				upscale = Math.min(upscale, max / this.scale0);
			}

			this.scaleCurrent = this.scale0 * upscale;
			mesh.position.set(0, position + offsetL, 0);

			if (annotation) {
				annotation.innerText = `${this.scaleCurrent.toFixed(2)}`;
			}

			scaleV.set(1, 1, 1);
			scaleV.setComponent(axis, upscale);
			scaleMatrix.makeScale(scaleV.x, scaleV.y, scaleV.z).premultiply(mPLG).multiply(mPLGInv);
			this.pivotControls.onDrag(scaleMatrix);
		}
	}

	onPointerUp(event: NgtThreeEvent<PointerEvent>) {
		const [annotation, controls, position, mesh] = [
			this.annotationRef()?.nativeElement,
			this.controls(),
			this.position(),
			this.meshRef().nativeElement,
		];

		if (annotation) {
			annotation.style.display = 'none';
		}

		event.stopPropagation();
		this.scale0 = this.scaleCurrent;
		this.clickInfo = null;
		mesh.position.set(0, position, 0);
		this.pivotControls.onDragEnd();
		if (controls) {
			controls.enabled = true;
		}
		// @ts-expect-error - releasePointerCapture is not in the type definition
		event.target.releasePointerCapture(event.pointerId);
	}

	onPointerOut(event: NgtThreeEvent<PointerEvent>) {
		event.stopPropagation();
		this.hovered.set(false);
	}
}
