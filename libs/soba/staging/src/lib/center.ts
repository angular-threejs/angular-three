import {
	afterNextRender,
	ChangeDetectionStrategy,
	Component,
	CUSTOM_ELEMENTS_SCHEMA,
	ElementRef,
	input,
	output,
	viewChild,
} from '@angular/core';
import { extend, getLocalState, NgtGroup, omit, pick } from 'angular-three';
import { injectAutoEffect } from 'ngxtension/auto-effect';
import { mergeInputs } from 'ngxtension/inject-inputs';
import { Box3, Group, Object3D, Sphere, Vector3 } from 'three';

export interface NgtsCenterState {
	/** The next parent above <Center> */
	parent: Object3D;
	/** The outmost container group of the <Center> component */
	container: Object3D;
	width: number;
	height: number;
	depth: number;
	boundingBox: Box3;
	boundingSphere: Sphere;
	center: Vector3;
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
}

const defaultOptions: Partial<NgtGroup> & NgtsCenterOptions = {
	precise: true,
	cacheKey: 0,
};

@Component({
	selector: 'ngts-center',
	standalone: true,
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
	parameters = omit(this.options, [
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
	]);

	centered = output<NgtsCenterState>();

	groupRef = viewChild.required<ElementRef<Group>>('group');
	private outerRef = viewChild.required<ElementRef<Group>>('outer');
	private innerRef = viewChild.required<ElementRef<Group>>('inner');

	centerOptions = pick(this.options, [
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
	]);

	constructor() {
		extend({ Group });

		const autoEffect = injectAutoEffect();

		afterNextRender(() => {
			autoEffect(() => {
				const [
					{ precise, top, bottom, right, left, front, back, disable, disableZ, disableY, disableX },
					group,
					outer,
					inner,
				] = [
					this.centerOptions(),
					this.groupRef().nativeElement,
					this.outerRef().nativeElement,
					this.innerRef().nativeElement,
				];

				const localState = getLocalState(inner);
				const children = localState?.objects();
				if (!children?.length) return;

				outer.matrixWorld.identity();
				const box3 = new Box3().setFromObject(inner, precise);
				const center = new Vector3();
				const sphere = new Sphere();

				const width = box3.max.x - box3.min.x;
				const height = box3.max.y - box3.min.y;
				const depth = box3.max.z - box3.min.z;

				box3.getCenter(center);
				box3.getBoundingSphere(sphere);

				const vAlign = top ? height / 2 : bottom ? -height / 2 : 0;
				const hAlign = left ? -width / 2 : right ? width / 2 : 0;
				const dAlign = front ? depth / 2 : back ? -depth / 2 : 0;

				outer.position.set(
					disable || disableX ? 0 : -center.x + hAlign,
					disable || disableY ? 0 : -center.y + vAlign,
					disable || disableZ ? 0 : -center.z + dAlign,
				);

				this.centered.emit({
					parent: group.parent!,
					container: group,
					width,
					height,
					depth,
					boundingBox: box3,
					boundingSphere: sphere,
					center,
					verticalAlignment: vAlign,
					horizontalAlignment: hAlign,
					depthAlignment: dAlign,
				});
			});
		});
	}
}
