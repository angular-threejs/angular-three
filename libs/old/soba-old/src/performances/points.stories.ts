import { CUSTOM_ELEMENTS_SCHEMA, Component, Input, effect, signal } from '@angular/core';
import { extend, injectBeforeRender, injectNgtStore } from 'angular-three-old';
import { NgtsPointMaterial } from 'angular-three-soba-old/materials';
import { NgtsPoint, NgtsPoints } from 'angular-three-soba-old/performances';
import { shaderMaterial } from 'angular-three-soba-old/shaders';
import * as THREE from 'three';
import { makeCanvasOptions, makeDecorators, makeStoryFunction } from '../setup-canvas';

import { NgFor } from '@angular/common';
import { NgtsSobaContent } from 'angular-three-soba-old/utils';
import * as buffer from 'maath/buffer';
import * as misc from 'maath/misc';

const rotationAxis = new THREE.Vector3(0, 1, 0).normalize();
const q = new THREE.Quaternion();

const MyPointsMaterial = shaderMaterial(
	{
		u: 1,
	},
	/* glsl */ `
    attribute float size;
    attribute vec3 color;

    varying vec3 vColor;

    void main() {
      vColor = color;
      vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
      gl_PointSize = size * ( 300.0 / -mvPosition.z );
      gl_Position = projectionMatrix * mvPosition;
    }

  `,
	/* glsl */ `
    varying vec3 vColor;

    void main() {
      gl_FragColor = vec4( vColor, 1.0 );

      #include <tonemapping_fragment>
      #include <encodings_fragment>
    }
  `,
);

extend({ MyPointsMaterial });

// @ts-expect-error
const makeBuffer = (...args) => Float32Array.from(...args);
const makeRandoms = () => [
	THREE.MathUtils.randFloatSpread(4),
	THREE.MathUtils.randFloatSpread(4),
	THREE.MathUtils.randFloatSpread(4),
];

@Component({
	selector: 'points-point-event',
	standalone: true,
	template: `
		<ngts-point
			[color]="clicked() ? 'hotpink' : hovered() ? 'red' : color"
			[position]="position"
			[size]="size"
			(click)="clicked.set(!clicked())"
			(pointerover)="hovered.set(true)"
			(pointerout)="hovered.set(false)"
		/>
	`,
	imports: [NgtsPoint],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class PointEvent {
	@Input() position: number[] = [];
	@Input() color: number[] = [];
	@Input() size = 0;

	hovered = signal(false);
	clicked = signal(false);
}

@Component({
	standalone: true,
	template: `
		<ngts-points [limit]="points.length" [range]="points.length">
			<ng-template ngtsSobaContent>
				<ngts-point-material
					[transparent]="true"
					[vertexColors]="true"
					[size]="15"
					[sizeAttenuation]="false"
					[depthWrite]="false"
				/>
				<points-point-event *ngFor="let p of points" color="orange" [position]="p.v3" />
			</ng-template>
		</ngts-points>
	`,
	imports: [NgtsPoints, NgtsSobaContent, NgFor, NgtsPointMaterial, PointEvent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class PointsSelectionStory {
	points = Array.from({ length: 10 * 10 }, () => ({ v3: makeRandoms(), size: Math.random() * 0.5 + 0.1 }));

	private store = injectNgtStore();
	private raycaster = this.store.select('raycaster');

	constructor() {
		effect((onCleanup) => {
			const raycaster = this.raycaster();
			if (raycaster.params.Points) {
				const oldThreshold = raycaster.params.Points.threshold;
				raycaster.params.Points.threshold = 0.05;
				onCleanup(() => {
					if (raycaster.params.Points) {
						raycaster.params.Points.threshold = oldThreshold;
					}
				});
			}
		});
	}
}

@Component({
	standalone: true,
	template: `
		<ngts-points>
			<ng-template ngtsSobaContent>
				<points-point-event *ngFor="let p of points" [position]="p.v3" [color]="p.v3" [size]="p.size" />
				<ngt-my-points-material />
			</ng-template>
		</ngts-points>
	`,
	imports: [NgtsPoints, NgtsSobaContent, PointEvent, NgFor],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class PointsInstancesStory {
	points = Array.from({ length: 10 * 10 * 10 }, () => ({ v3: makeRandoms(), size: Math.random() * 0.5 + 0.1 }));

	private store = injectNgtStore();
	private raycaster = this.store.select('raycaster');

	constructor() {
		effect((onCleanup) => {
			const raycaster = this.raycaster();
			if (raycaster.params.Points) {
				const oldThreshold = raycaster.params.Points.threshold;
				raycaster.params.Points.threshold = 0.05;
				onCleanup(() => {
					if (raycaster.params.Points) {
						raycaster.params.Points.threshold = oldThreshold;
					}
				});
			}
		});
	}
}

@Component({
	standalone: true,
	template: `
		<ngts-points [positions]="positionFinal" [colors]="color" [sizes]="size">
			<ngt-my-points-material *ngtsSobaContent />
		</ngts-points>
	`,
	imports: [NgtsPoints, NgtsSobaContent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class PointsBuffersStory {
	count = 10_000;

	positionA = makeBuffer({ length: this.count * 3 }, () => THREE.MathUtils.randFloatSpread(5));
	positionB = makeBuffer({ length: this.count * 3 }, () => THREE.MathUtils.randFloatSpread(10));
	positionFinal = this.positionB.slice();

	color = makeBuffer({ length: this.count * 3 }, () => Math.random());
	size = makeBuffer({ length: this.count }, () => Math.random() * 0.2);

	constructor() {
		injectBeforeRender(({ clock }) => {
			const et = clock.getElapsedTime();
			const t = misc.remap(Math.sin(et), [-1, 1], [0, 1]);

			buffer.rotate(this.color, { q: q.setFromAxisAngle(rotationAxis, t * 0.01) });
			buffer.lerp(this.positionA, this.positionB, this.positionFinal, t);
			buffer.rotate(this.positionB, { q: q.setFromAxisAngle(rotationAxis, t * t * 0.1) });
		});
	}
}

export default {
	title: 'Performance/Points',
	decorators: makeDecorators(),
};

const canvasOptions = makeCanvasOptions({ camera: { position: [5, 5, 5] } });

export const Buffers = makeStoryFunction(PointsBuffersStory, canvasOptions);
export const Instances = makeStoryFunction(PointsInstancesStory, canvasOptions);
export const Selection = makeStoryFunction(PointsSelectionStory, canvasOptions);
