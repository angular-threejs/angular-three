import { CUSTOM_ELEMENTS_SCHEMA, Component, EventEmitter, Input, Output, effect } from '@angular/core';
import { extend, injectNgtRef, signalStore, type NgtGroup } from 'angular-three';
import * as THREE from 'three';
import { Group } from 'three';

extend({ Group });

export type NgtsCenteredEvent = {
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
};

export type NgtsCenterState = {
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
	precise?: boolean;
	/** Optional cacheKey to keep the component from recalculating on every render */
	cacheKey?: any;
};

declare global {
	interface HTMLElementTagNameMap {
		/**
		 * @extends ngt-group
		 */
		'ngts-center': NgtsCenterState & NgtGroup;
	}
}

@Component({
	selector: 'ngts-center',
	standalone: true,
	template: `
		<ngt-group [ref]="centerRef" ngtCompound>
			<ngt-group [ref]="outerRef">
				<ngt-group [ref]="innerRef">
					<ng-content />
				</ngt-group>
			</ngt-group>
		</ngt-group>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsCenter {
	private inputs = signalStore<NgtsCenterState>({
		precise: true,
		cacheKey: 0,
	});

	@Input() centerRef = injectNgtRef<Group>();
	outerRef = injectNgtRef<Group>();
	innerRef = injectNgtRef<Group>();

	@Input({ alias: 'top' }) set _top(top: boolean) {
		this.inputs.set({ top });
	}

	@Input({ alias: 'right' }) set _right(right: boolean) {
		this.inputs.set({ right });
	}

	@Input({ alias: 'bottom' }) set _bottom(bottom: boolean) {
		this.inputs.set({ bottom });
	}

	@Input({ alias: 'left' }) set _left(left: boolean) {
		this.inputs.set({ left });
	}

	@Input({ alias: 'front' }) set _front(front: boolean) {
		this.inputs.set({ front });
	}

	@Input({ alias: 'back' }) set _back(back: boolean) {
		this.inputs.set({ back });
	}

	@Input({ alias: 'disableX' }) set _disableX(disableX: boolean) {
		this.inputs.set({ disableX });
	}

	@Input({ alias: 'disableY' }) set _disableY(disableY: boolean) {
		this.inputs.set({ disableY });
	}

	@Input({ alias: 'disableZ' }) set _disableZ(disableZ: boolean) {
		this.inputs.set({ disableZ });
	}

	@Input({ alias: 'disable' }) set _disable(disable: boolean) {
		this.inputs.set({ disable });
	}

	@Input({ alias: 'precise' }) set _precise(precise: boolean) {
		this.inputs.set({ precise });
	}

	@Input({ alias: 'cacheKey' }) set _cacheKey(cacheKey: any) {
		this.inputs.set({ cacheKey });
	}

	@Output() centered = new EventEmitter<NgtsCenteredEvent>();

	constructor() {
		this.setPosition();
	}

	private setPosition() {
		const innerChildren = this.innerRef.children();

		effect(() => {
			const [
				outer,
				inner,
				centerRef,
				{ precise, top, bottom, left, front, right, back, disable, disableX, disableY, disableZ },
			] = [
				this.outerRef.nativeElement,
				this.innerRef.nativeElement,
				this.centerRef.nativeElement,
				this.inputs.state(),
				innerChildren(),
			];

			if (outer && inner && centerRef) {
				outer.matrixWorld.identity();
				const box3 = new THREE.Box3().setFromObject(inner, precise);
				const center = new THREE.Vector3();
				const sphere = new THREE.Sphere();
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

				if (this.centered.observed) {
					this.centered.emit({
						parent: centerRef.parent!,
						container: centerRef,
						width,
						height,
						depth,
						boundingBox: box3,
						boundingSphere: sphere,
						center: center,
						verticalAlignment: vAlign,
						horizontalAlignment: hAlign,
						depthAlignment: dAlign,
					});
				}
			}
		});
	}
}
