import { Directive, effect, ElementRef, inject, input } from '@angular/core';
import { color, uniform } from 'three/tsl';
import * as THREE from 'three/webgpu';
import { outputNodeFn, shadowNodeFn } from './tsl';

@Directive({ selector: 'ngt-mesh-physical-node-material[slice]' })
export class SliceMaterial {
	arcAngle = input(0.5 * Math.PI);
	startAngle = input(0);
	sliceColor = input('black');

	private material = inject<ElementRef<THREE.MeshPhysicalNodeMaterial>>(ElementRef);

	private uArcAngle = uniform(0.5 * Math.PI);
	private uStartAngle = uniform(0);
	private uColor = uniform(color('black'));

	constructor() {
		this.material.nativeElement.outputNode = outputNodeFn({
			startAngle: this.uStartAngle,
			arcAngle: this.uArcAngle,
			color: this.uColor,
		});
		this.material.nativeElement.castShadowNode = shadowNodeFn({
			startAngle: this.uStartAngle,
			arcAngle: this.uArcAngle,
		});
		this.material.nativeElement.side = THREE.DoubleSide;

		effect(() => {
			const [arcAngle, startAngle, sliceColor] = [this.arcAngle(), this.startAngle(), this.sliceColor()];
			this.uStartAngle.value = startAngle;
			this.uArcAngle.value = arcAngle;
			this.uColor.value.set(sliceColor);
		});
	}
}
