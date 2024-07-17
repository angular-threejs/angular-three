import {
	ChangeDetectionStrategy,
	Component,
	CUSTOM_ELEMENTS_SCHEMA,
	ElementRef,
	input,
	viewChild,
} from '@angular/core';
import { Meta } from '@storybook/angular';
import { merge, NgtArgs } from 'angular-three';
import { NgtsComputedAttribute, NgtsSampler, NgtsSamplerOptions, TransformFn } from 'angular-three-soba/misc';
import { BufferAttribute, BufferGeometry, InstancedMesh, Mesh, Vector3 } from 'three';
import { makeDecorators, makeStoryObject } from '../setup-canvas';

const transformInstances: TransformFn = ({ dummy, position }) => {
	dummy.position.copy(position);
	dummy.scale.setScalar(Math.random() * 0.75);
};

function remap(x: number, [low1, high1]: number[], [low2, high2]: number[]) {
	return low2 + ((x - low1) * (high2 - low2)) / (high1 - low1);
}

function computeUpness(geometry: BufferGeometry) {
	const { array, count } = geometry.attributes['normal'];
	const arr = Float32Array.from({ length: count });

	const normalVector = new Vector3();
	const up = new Vector3(0, 1, 0);

	for (let i = 0; i < count; i++) {
		const n = array.slice(i * 3, i * 3 + 3);
		normalVector.set(n[0], n[1], n[2]);

		const dot = normalVector.dot(up);
		const value = dot > 0.4 ? remap(dot, [0.4, 1], [0, 1]) : 0;
		arr[i] = Number(value);
	}

	return new BufferAttribute(arr, 1);
}

@Component({
	standalone: true,
	template: `
		<ngts-sampler [options]="mergedOptions()">
			<ngt-mesh>
				<ngt-torus-knot-geometry>
					<ngts-computed-attribute name="upness" [compute]="computeUpness" />
				</ngt-torus-knot-geometry>
				<ngt-mesh-normal-material />
			</ngt-mesh>

			<ngt-instanced-mesh *args="[undefined, undefined, 1000]">
				<ngt-sphere-geometry *args="[0.1, 32, 32, Math.PI / 2]" />
				<ngt-mesh-normal-material />
			</ngt-instanced-mesh>
		</ngts-sampler>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtsSampler, NgtsComputedAttribute, NgtArgs],
})
class WeightSamplerStory {
	protected readonly computeUpness = computeUpness;
	protected readonly Math = Math;

	options = input({} as NgtsSamplerOptions);
	mergedOptions = merge(this.options, { weight: 'upness', transform: transformInstances }, 'backfill');
}

@Component({
	standalone: true,
	template: `
		<ngts-sampler [options]="mergedOptions()">
			<ngt-mesh>
				<ngt-torus-knot-geometry />
				<ngt-mesh-normal-material />
			</ngt-mesh>

			<ngt-instanced-mesh *args="[undefined, undefined, 1000]">
				<ngt-sphere-geometry *args="[0.1, 32, 32]" />
				<ngt-mesh-normal-material />
			</ngt-instanced-mesh>
		</ngts-sampler>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtsSampler, NgtArgs],
})
class TransformSamplerStory {
	options = input({} as NgtsSamplerOptions);
	mergedOptions = merge(this.options, { transform: transformInstances }, 'backfill');
}

@Component({
	standalone: true,
	template: `
		<ngts-sampler [options]="options()" [mesh]="meshRef()" [instances]="instancedMeshRef()" />

		<ngt-mesh #mesh>
			<ngt-torus-knot-geometry />
			<ngt-mesh-normal-material />
		</ngt-mesh>

		<ngt-instanced-mesh #instancedMesh *args="[undefined, undefined, 1000]">
			<ngt-sphere-geometry *args="[0.1, 32, 32]" />
			<ngt-mesh-normal-material />
		</ngt-instanced-mesh>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	imports: [NgtsSampler, NgtArgs],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
class RefSamplerStory {
	options = input({} as NgtsSamplerOptions);

	meshRef = viewChild.required<ElementRef<Mesh>>('mesh');
	instancedMeshRef = viewChild<ElementRef<InstancedMesh>>('instancedMesh');
}

@Component({
	standalone: true,
	template: `
		<ngts-sampler [options]="options()">
			<ngt-mesh>
				<ngt-torus-knot-geometry />
				<ngt-mesh-normal-material />
			</ngt-mesh>

			<ngt-instanced-mesh *args="[undefined, undefined, 1000]">
				<ngt-sphere-geometry *args="[0.1, 32, 32]" />
				<ngt-mesh-normal-material />
			</ngt-instanced-mesh>
		</ngts-sampler>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtsSampler, NgtArgs],
})
class DefaultSamplerStory {
	options = input({} as NgtsSamplerOptions);
}

export default {
	title: 'Misc/Sampler',
	decorators: makeDecorators(),
} as Meta;

export const Default = makeStoryObject(DefaultSamplerStory, {
	canvasOptions: { camera: { position: [0, 0, 5] } },
	argsOptions: {
		options: {
			count: 500,
		},
	},
});

export const WithElementRef = makeStoryObject(RefSamplerStory, {
	canvasOptions: { camera: { position: [0, 0, 5] } },
	argsOptions: {
		options: {
			count: 500,
		},
	},
});

export const UsingTransform = makeStoryObject(TransformSamplerStory, {
	canvasOptions: { camera: { position: [0, 0, 5] } },
	argsOptions: {
		options: {
			count: 500,
		},
	},
});

export const WithWeight = makeStoryObject(WeightSamplerStory, {
	canvasOptions: { camera: { position: [0, 0, 5] } },
	argsOptions: {
		options: {
			count: 500,
			weight: 'upness',
			transform: transformInstances,
		},
	},
});
