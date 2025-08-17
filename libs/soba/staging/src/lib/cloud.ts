import {
	afterEveryRender,
	afterRenderEffect,
	ChangeDetectionStrategy,
	Component,
	computed,
	CUSTOM_ELEMENTS_SCHEMA,
	ElementRef,
	inject,
	input,
	untracked,
	viewChild,
} from '@angular/core';
import {
	applyProps,
	beforeRender,
	checkUpdate,
	extend,
	NgtArgs,
	NgtColor,
	NgtThreeElements,
	NgtVector3,
	omit,
	pick,
} from 'angular-three';
import { textureResource } from 'angular-three-soba/loaders';
import { setUpdateRange } from 'angular-three-soba/misc';
import { CLOUD_URL } from 'angular-three-soba/vanilla-exports';
import { mergeInputs } from 'ngxtension/inject-inputs';
import * as THREE from 'three';
import { Group, InstancedBufferAttribute, InstancedMesh, PlaneGeometry } from 'three';

export interface NgtsCloudState {
	uuid: string;
	index: number;
	segments: number;
	dist: number;
	matrix: THREE.Matrix4;
	bounds: THREE.Vector3;
	position: THREE.Vector3;
	volume: number;
	length: number;
	ref: ElementRef<THREE.Group>;
	speed: number;
	growth: number;
	opacity: number;
	fade: number;
	density: number;
	rotation: number;
	rotationFactor: number;
	color: THREE.Color;
}

export interface NgtsCloudsOptions extends Partial<NgtThreeElements['ngt-group']> {
	/** Optional cloud texture, points to a default hosted on rawcdn.githack */
	texture: string;
	/** Maximum number of segments, default: 200 (make this tight to save memory!) */
	limit: number;
	/** How many segments it renders, default: undefined (all) */
	range?: number;
	/** Which material it will override, default: MeshLambertMaterial */
	material: typeof THREE.Material;
	/** Frustum culling, default: true */
	frustumCulled: boolean;
}

const defaultCloudsOptions: NgtsCloudsOptions = {
	limit: 200,
	material: THREE.MeshLambertMaterial,
	frustumCulled: true,
	texture: CLOUD_URL,
};

const parentMatrix = new THREE.Matrix4();
const translation = new THREE.Vector3();
const rotation = new THREE.Quaternion();
const cpos = new THREE.Vector3();
const cquat = new THREE.Quaternion();
const scale = new THREE.Vector3();

@Component({
	selector: 'ngts-clouds',
	template: `
		<ngt-group #group [parameters]="parameters()">
			<ng-content />
			<ngt-instanced-mesh
				#instances
				*args="[undefined, undefined, limit()]"
				[matrixAutoUpdate]="false"
				[frustumCulled]="frustumCulled()"
			>
				<ngt-instanced-buffer-attribute
					*args="[colors(), 3]"
					[usage]="DynamicDrawUsage"
					attach="instanceColor"
				/>
				<ngt-plane-geometry *args="imageBounds()">
					<ngt-instanced-buffer-attribute
						*args="[opacities(), 1]"
						[usage]="DynamicDrawUsage"
						attach="attributes.cloudOpacity"
					/>
				</ngt-plane-geometry>
				<ngt-primitive *args="[cloudMaterial()]" [map]="cloudTexture.value()" attach="material" />
			</ngt-instanced-mesh>
		</ngt-group>
	`,
	imports: [NgtArgs],
	changeDetection: ChangeDetectionStrategy.OnPush,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsClouds {
	protected readonly DynamicDrawUsage = THREE.DynamicDrawUsage;

	options = input(defaultCloudsOptions, { transform: mergeInputs(defaultCloudsOptions) });
	protected parameters = omit(this.options, ['material', 'texture', 'range', 'limit', 'frustumCulled']);

	private texture = pick(this.options, 'texture');
	private material = pick(this.options, 'material');
	private range = pick(this.options, 'range');

	cloudsRef = viewChild.required<ElementRef<THREE.Group>>('group');
	private instancesRef = viewChild<ElementRef<THREE.InstancedMesh>>('instances');

	protected limit = pick(this.options, 'limit');
	protected frustumCulled = pick(this.options, 'frustumCulled');

	protected opacities = computed(() => new Float32Array(Array.from({ length: this.limit() }, () => 1)));
	protected colors = computed(() => new Float32Array(Array.from({ length: this.limit() }, () => [1, 1, 1]).flat()));

	protected cloudTexture = textureResource(this.texture);
	protected cloudMaterial = computed(() => {
		const _CloudMaterial = class extends (this.material() as typeof THREE.Material) {
			constructor() {
				super();
				const opaque_fragment =
					parseInt(THREE.REVISION.replace(/\D+/g, '')) >= 154 ? 'opaque_fragment' : 'output_fragment';
				this.onBeforeCompile = (shader) => {
					shader.vertexShader =
						`attribute float cloudOpacity;
               varying float vOpacity;
              ` +
						shader.vertexShader.replace(
							'#include <fog_vertex>',
							`#include <fog_vertex>
                 vOpacity = cloudOpacity;
                `,
						);
					shader.fragmentShader =
						`varying float vOpacity;
              ` +
						shader.fragmentShader.replace(
							`#include <${opaque_fragment}>`,
							`#include <${opaque_fragment}>
                 gl_FragColor = vec4(outgoingLight, diffuseColor.a * vOpacity);
                `,
						);
				};
			}
		};

		const _material = new _CloudMaterial();
		_material.transparent = true;
		_material.depthWrite = false;
		checkUpdate(_material);

		return _material;
	});

	protected imageBounds = computed(() => {
		const texture = this.cloudTexture.value();
		if (!texture) return [1, 1];
		const [w, h] = [texture.image.width ?? 1, texture.image.height ?? 1];
		const max = Math.max(w, h);
		return [w / max, h / max];
	});

	clouds: Array<NgtsCloudState> = [];

	constructor() {
		extend({ Group, InstancedMesh, InstancedBufferAttribute, PlaneGeometry });

		afterEveryRender({
			write: () => {
				const instances = this.instancesRef()?.nativeElement;
				if (!instances) return;

				const [limit, range] = [this.limit(), this.range()];
				const count = Math.min(limit, range !== undefined ? range : limit, this.clouds.length);
				instances.count = count;
				setUpdateRange(instances.instanceMatrix, { start: 0, count: count * 16 });
				if (instances.instanceColor) {
					setUpdateRange(instances.instanceColor, { start: 0, count: count * 3 });
				}
				setUpdateRange(instances.geometry.attributes['cloudOpacity'] as THREE.BufferAttribute, {
					start: 0,
					count: count,
				});
			},
		});

		let time = 0;
		let index = 0;
		let config: NgtsCloudState;
		const qat = new THREE.Quaternion();
		const dir = new THREE.Vector3(0, 0, 1);
		const pos = new THREE.Vector3();

		beforeRender(({ delta, clock, camera }) => {
			const instances = this.instancesRef()?.nativeElement;
			if (!instances) return;

			time = clock.elapsedTime;
			parentMatrix.copy(instances.matrixWorld).invert();
			camera.matrixWorld.decompose(cpos, cquat, scale);

			for (index = 0; index < this.clouds.length; index++) {
				config = this.clouds[index];
				config.ref.nativeElement.matrixWorld.decompose(translation, rotation, scale);
				translation.add(pos.copy(config.position).applyQuaternion(rotation).multiply(scale));
				rotation
					.copy(cquat)
					.multiply(qat.setFromAxisAngle(dir, (config.rotation += delta * config.rotationFactor)));
				scale.multiplyScalar(
					config.volume + ((1 + Math.sin(time * config.density * config.speed)) / 2) * config.growth,
				);
				config.matrix.compose(translation, rotation, scale).premultiply(parentMatrix);
				config.dist = translation.distanceTo(cpos);
			}

			// depth-sort
			this.clouds.sort((a, b) => b.dist - a.dist);
			const opacities = instances.geometry.attributes['cloudOpacity'] as THREE.InstancedBufferAttribute;
			for (index = 0; index < this.clouds.length; index++) {
				config = this.clouds[index];
				opacities.array[index] =
					config.opacity * (config.dist < config.fade - 1 ? config.dist / config.fade : 1);
				instances.setMatrixAt(index, config.matrix);
				instances.setColorAt(index, config.color);
			}

			// update instance
			checkUpdate(instances.geometry.attributes['cloudOpacity']);
			checkUpdate(instances.instanceMatrix);
			if (instances.instanceColor) checkUpdate(instances.instanceColor);
		});
	}
}

export interface NgtsCloudOptions extends Partial<NgtThreeElements['ngt-group']> {
	/** A seeded random will show the same cloud consistently, default: Math.random() */
	seed: number;
	/** How many segments or particles the cloud will have, default: 20 */
	segments: number;
	/** The box3 bounds of the cloud, default: [5, 1, 1] */
	bounds: NgtVector3;
	/** How to arrange segment volume inside the bounds, default: inside (cloud are smaller at the edges) */
	concentrate: 'random' | 'inside' | 'outside';
	/** The general scale of the segments */
	scale?: NgtVector3;
	/** The volume/thickness of the segments, default: 6 */
	volume: number;
	/** The smallest volume when distributing clouds, default: 0.25 */
	smallestVolume: number;
	/** An optional function that allows you to distribute points and volumes (overriding all settings), default: null
	 *  Both point and volume are factors, point x/y/z can be between -1 and 1, volume between 0 and 1 */
	distribute?: (cloud: NgtsCloudState, index: number) => { point: THREE.Vector3; volume?: number };
	/** Growth factor for animated clouds (speed > 0), default: 4 */
	growth: number;
	/** Animation factor, default: 0 */
	speed: number;
	/** Camera distance until the segments will fade, default: 10 */
	fade: number;
	/** Opacity, default: 1 */
	opacity: number;
	/** Color, default: white */
	color: NgtColor;
}

const defaultCloudOptions: NgtsCloudOptions = {
	seed: Math.random(),
	segments: 20,
	bounds: [5, 1, 1],
	concentrate: 'inside',
	volume: 6,
	smallestVolume: 0.25,
	growth: 4,
	speed: 0,
	fade: 10,
	opacity: 1,
	color: '#ffffff',
};

@Component({
	selector: 'ngts-cloud-instance',
	template: `
		<ngt-group #group [parameters]="parameters()">
			<ng-content />
		</ngt-group>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsCloudInstance {
	options = input(defaultCloudOptions, { transform: mergeInputs(defaultCloudOptions) });
	protected parameters = omit(this.options, [
		'bounds',
		'seed',
		'segments',
		'concentrate',
		'distribute',
		'growth',
		'volume',
		'smallestVolume',
		'speed',
		'fade',
		'opacity',
		'color',
	]);

	private cloudInstanceRef = viewChild.required<ElementRef<THREE.Group>>('group');

	private uuid = THREE.MathUtils.generateUUID();

	private segments = pick(this.options, 'segments');
	private bounds = pick(this.options, 'bounds');
	private seed = pick(this.options, 'seed');
	private concentrate = pick(this.options, 'concentrate');
	private smallestVolume = pick(this.options, 'smallestVolume');
	private growth = pick(this.options, 'growth');
	private speed = pick(this.options, 'speed');
	private fade = pick(this.options, 'fade');
	private opacity = pick(this.options, 'opacity');
	private color = pick(this.options, 'color');
	private distribute = pick(this.options, 'distribute');
	private volume = pick(this.options, 'volume');

	private clouds = computed(() =>
		Array.from(
			{ length: this.segments() },
			(_, index) =>
				({
					segments: this.segments(),
					uuid: this.uuid,
					bounds: new THREE.Vector3(1, 1, 1),
					position: new THREE.Vector3(),
					index,
					ref: this.cloudInstanceRef(),
					dist: 0,
					matrix: new THREE.Matrix4(),
					color: new THREE.Color(),
					rotation: index * (Math.PI / this.segments()),
				}) as NgtsCloudState,
		),
	);

	private parent = inject(NgtsClouds);

	constructor() {
		extend({ Group });

		afterRenderEffect({
			write: () => {
				const [
					clouds,
					concentrate,
					bounds,
					fade,
					color,
					opacity,
					growth,
					volume,
					seed,
					segments,
					speed,
					distribute,
				] = [
					this.clouds(),
					this.concentrate(),
					this.bounds(),
					this.fade(),
					this.color(),
					this.opacity(),
					this.growth(),
					this.volume(),
					this.seed(),
					this.segments(),
					this.speed(),
					untracked(this.distribute),
				];

				const seedRef = { seed };

				clouds.forEach((cloud, index) => {
					applyProps(cloud, {
						volume,
						color,
						speed,
						growth,
						opacity,
						fade,
						bounds,
						density: Math.max(0.5, this.random(seedRef)),
						rotationFactor: Math.max(0.2, 0.5 * this.random(seedRef)) * speed,
					});

					// only distribute randomly if there are multiple segments
					const distributed = distribute?.(cloud, index);
					if (distributed || segments > 1) {
						cloud.position.copy(cloud.bounds).multiply(
							distributed?.point ?? {
								x: this.random(seedRef) * 2 - 1,
								y: this.random(seedRef) * 2 - 1,
								z: this.random(seedRef) * 2 - 1,
							},
						);
					}

					const xDiff = Math.abs(cloud.position.x);
					const yDiff = Math.abs(cloud.position.y);
					const zDiff = Math.abs(cloud.position.z);
					const max = Math.max(xDiff, yDiff, zDiff);

					cloud.length = 1;

					if (xDiff === max) cloud.length -= xDiff / cloud.bounds.x;
					if (yDiff === max) cloud.length -= yDiff / cloud.bounds.y;
					if (zDiff === max) cloud.length -= zDiff / cloud.bounds.z;

					cloud.volume =
						distributed?.volume ??
						Math.max(
							Math.max(0, untracked(this.smallestVolume)),
							concentrate === 'random'
								? this.random(seedRef)
								: concentrate === 'inside'
									? cloud.length
									: 1 - cloud.length,
						) * volume;
				});
			},
		});

		afterRenderEffect({
			write: (onCleanup) => {
				const temp = this.clouds();
				this.parent.clouds = [...this.parent.clouds, ...temp];
				onCleanup(() => {
					this.parent.clouds = this.parent.clouds.filter((item) => item.uuid !== this.uuid);
				});
			},
		});
	}

	private random(ref: { seed: number }) {
		const x = Math.sin(ref.seed++) * 10_000;
		return x - Math.floor(x);
	}
}

@Component({
	selector: 'ngts-cloud',
	template: `
		@if (parent) {
			<ngts-cloud-instance [options]="options()">
				<ng-content />
			</ngts-cloud-instance>
		} @else {
			<ngts-clouds>
				<ngts-cloud-instance [options]="options()">
					<ng-content />
				</ngts-cloud-instance>
			</ngts-clouds>
		}
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtsCloudInstance, NgtsClouds],
})
export class NgtsCloud {
	options = input<Partial<NgtsCloudOptions>>(defaultCloudOptions);
	protected parent = inject(NgtsClouds, { optional: true });

	cloudRef = viewChild(NgtsCloudInstance);
}
