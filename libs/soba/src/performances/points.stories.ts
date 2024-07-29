import {
	afterNextRender,
	ChangeDetectionStrategy,
	Component,
	computed,
	CUSTOM_ELEMENTS_SCHEMA,
	input,
	signal,
	viewChild,
} from '@angular/core';
import { Meta } from '@storybook/angular';
import { extend, injectBeforeRender, injectObjectEvents, injectStore } from 'angular-three';
import { NgtsPoint, NgtsPointsBuffer, NgtsPointsInstances } from 'angular-three-soba/performances';
import { shaderMaterial } from 'angular-three-soba/vanilla-exports';
import { buffer, misc } from 'maath';
import { injectAutoEffect } from 'ngxtension/auto-effect';
import { MathUtils, Quaternion, Vector3 } from 'three';
import { makeDecorators, makeStoryFunction } from '../setup-canvas';

const rotationAxis = new Vector3(0, 1, 0).normalize();
const q = new Quaternion();

const MyPointsMaterial = shaderMaterial(
	{ u: 1 },
	/* language=glsl glsl */ `
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
	/* language=glsl glsl */ `
    varying vec3 vColor;

    void main() {
      gl_FragColor = vec4( vColor, 1.0 );

      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }
  `,
);

extend({ MyPointsMaterial });

const n = 10_000;

@Component({
	selector: 'point-with-events',
	standalone: true,
	template: `
		<ngts-point [options]="{ position: position(), size: finalSize(), color: $any(finalColor()) }" />
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtsPoint],
})
class PointWithEvents {
	position = input([0, 0, 0]);
	color = input([1, 1, 1]);
	size = input(1);

	pointRef = viewChild.required(NgtsPoint);

	hovered = signal(false);
	clicked = signal(false);

	finalColor = computed(() => (this.hovered() ? 'hotpink' : this.color()));
	finalSize = computed(() => this.size() * (this.clicked() ? 1.5 : 1));

	constructor() {
		injectObjectEvents(() => this.pointRef().positionPointRef(), {
			pointerover: (event) => {
				event.stopPropagation();
				this.hovered.set(true);
			},
			pointerout: () => {
				this.hovered.set(false);
			},
			click: (event) => {
				event.stopPropagation();
				this.clicked.update((prev) => !prev);
			},
		});
	}
}

@Component({
	standalone: true,
	template: `
		<ngts-points-instances>
			@for (point of points; track $index) {
				<point-with-events [position]="point" [size]="Math.random() * 0.5 + 0.1" [color]="point" />
			}
			<ngt-my-points-material />
		</ngts-points-instances>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtsPointsInstances, PointWithEvents],
})
class BasicPointsInstancesStory {
	points = (() => {
		const n = 10;
		return Array.from({ length: n * n * n }, () => [
			MathUtils.randFloatSpread(4),
			MathUtils.randFloatSpread(4),
			MathUtils.randFloatSpread(4),
		]);
	})();

	private store = injectStore();

	constructor() {
		const autoEffect = injectAutoEffect();
		afterNextRender(() => {
			autoEffect(() => {
				const raycaster = this.store.snapshot.raycaster;
				const old = raycaster.params.Points.threshold;
				raycaster.params.Points.threshold = 0.05;
				return () => {
					if (raycaster.params.Points) raycaster.params.Points.threshold = old;
				};
			});
		});
	}

	protected readonly Math = Math;
}

@Component({
	standalone: true,
	template: `
		<ngts-points-buffer [positions]="positionFinal" [colors]="color" [sizes]="size">
			<ngt-my-points-material />
		</ngts-points-buffer>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtsPointsBuffer],
})
class BasicPointsBufferStory {
	positionA = Float32Array.from({ length: n * 3 }, () => MathUtils.randFloatSpread(5));
	positionB = Float32Array.from({ length: n * 3 }, () => MathUtils.randFloatSpread(10));
	positionFinal = this.positionB.slice(0);
	color = Float32Array.from({ length: n * 3 }, () => Math.random());
	size = Float32Array.from({ length: n }, () => Math.random() * 0.2);

	constructor() {
		injectBeforeRender(({ clock }) => {
			const elapsedTime = clock.getElapsedTime();
			const t = misc.remap(Math.sin(elapsedTime), [-1, 1], [0, 1]);

			buffer.rotate(this.color, { q: q.setFromAxisAngle(rotationAxis, t * 0.01) });
			buffer.lerp(this.positionA, this.positionB, this.positionFinal, t);
			buffer.rotate(this.positionB, { q: q.setFromAxisAngle(rotationAxis, t * t * 0.1) });
		});
	}
}

export default {
	title: 'Performances/Points',
	decorators: makeDecorators(),
} as Meta;

export const BasicPointsBuffer = makeStoryFunction(BasicPointsBufferStory, {
	camera: { position: [5, 5, 5] },
});

export const BasicPointsInstances = makeStoryFunction(BasicPointsInstancesStory, {
	camera: { position: [5, 5, 5] },
});
