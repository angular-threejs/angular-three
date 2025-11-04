import {
	ChangeDetectionStrategy,
	Component,
	CUSTOM_ELEMENTS_SCHEMA,
	effect,
	ElementRef,
	input,
	output,
	viewChild,
} from '@angular/core';
import { extend, getInstanceState, NgtThreeElements, omit, pick } from 'angular-three';
import { mergeInputs } from 'ngxtension/inject-inputs';
import * as THREE from 'three';
import { Group } from 'three';

export interface NgtsCenterState {
	/** The next parent above <Center> */
	parent: THREE.Object3D;
	/** The outmost container group of the <Center> component */
	container: THREE.Object3D;
	width: number;
	height: number;
	depth: number;
	boundingBox: THREE.Box3;
	boundingSphere: THREE.Sphere;
	center: THREE.Vector3;
	verticalAlignment: number;
	horizontalAlignment: number;
	depthAlignment: number;
}

export interface NgtsCenterOptions {
	top?: boolean;
	right?: boolean;
	bottom?: boolean;
	left?: boolean;
	front?: boolean;
	back?: boolean;
	/** Disable all axes */
	disable?: boolean;
	/** Disable x-axis centering */
	disableX?: boolean;
	/** Disable y-axis centering */
	disableY?: boolean;
	/** Disable z-axis centering */
	disableZ?: boolean;
	/** See https://threejs.org/docs/index.html?q=box3#api/en/math/Box3.setFromObject */
	precise: boolean;
	/** Optional cacheKey to keep the component from recalculating on every render */
	cacheKey: any;
	/*
	 * object to compute box3d from
	 */
	object?: THREE.Object3D | null;
}

const defaultOptions: Partial<NgtThreeElements['ngt-group']> & NgtsCenterOptions = {
	precise: true,
	cacheKey: 0,
};

@Component({
	selector: 'ngts-center',
	template: `
		<ngt-group #group [parameters]="parameters()">
			<ngt-group #outer>
				<ngt-group #inner>
					<ng-content />
				</ngt-group>
			</ngt-group>
		</ngt-group>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgtsCenter {
	options = input(defaultOptions, { transform: mergeInputs(defaultOptions) });
	protected parameters = omit(this.options, [
		'top',
		'right',
		'bottom',
		'left',
		'front',
		'back',
		'disable',
		'disableX',
		'disableY',
		'disableZ',
		'precise',
		'cacheKey',
		'object',
	]);

	centered = output<NgtsCenterState>();

	groupRef = viewChild.required<ElementRef<THREE.Group>>('group');
	private outerRef = viewChild.required<ElementRef<THREE.Group>>('outer');
	private innerRef = viewChild.required<ElementRef<THREE.Group>>('inner');

	private centerOptions = pick(this.options, [
		'top',
		'right',
		'bottom',
		'left',
		'front',
		'back',
		'disable',
		'disableX',
		'disableY',
		'disableZ',
		'precise',
		'cacheKey',
		'object',
	]);

	private box = new THREE.Box3();
	private center = new THREE.Vector3();
	private sphere = new THREE.Sphere();

	constructor() {
		extend({ Group });

		effect(() => {
			const inner = this.innerRef().nativeElement;
			const innerInstanceState = getInstanceState(inner);
			if (!innerInstanceState) return;

			const children = [...innerInstanceState.objects(), ...innerInstanceState.nonObjects()];
			if (!children?.length) return;

			const [
				{ precise, top, bottom, right, left, front, back, disable, disableZ, disableY, disableX, object },
				group,
				outer,
			] = [this.centerOptions(), this.groupRef().nativeElement, this.outerRef().nativeElement];

			outer.matrixWorld.identity();
			this.box.setFromObject(object ?? inner, precise);

			const width = this.box.max.x - this.box.min.x;
			const height = this.box.max.y - this.box.min.y;
			const depth = this.box.max.z - this.box.min.z;

			this.box.getCenter(this.center);
			this.box.getBoundingSphere(this.sphere);

			const vAlign = top ? height / 2 : bottom ? -height / 2 : 0;
			const hAlign = left ? -width / 2 : right ? width / 2 : 0;
			const dAlign = front ? depth / 2 : back ? -depth / 2 : 0;

			outer.position.set(
				disable || disableX ? 0 : -this.center.x + hAlign,
				disable || disableY ? 0 : -this.center.y + vAlign,
				disable || disableZ ? 0 : -this.center.z + dAlign,
			);

			this.centered.emit({
				parent: group.parent!,
				container: group,
				width,
				height,
				depth,
				boundingBox: this.box,
				boundingSphere: this.sphere,
				center: this.center,
				verticalAlignment: vAlign,
				horizontalAlignment: hAlign,
				depthAlignment: dAlign,
			});
		});
	}
}
