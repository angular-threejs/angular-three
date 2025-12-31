import {
	ElementRef,
	Injector,
	Signal,
	WritableSignal,
	computed,
	effect,
	inject,
	isSignal,
	signal,
} from '@angular/core';
import { BodyShapeType } from '@pmndrs/cannon-worker-api';
import { is, resolveRef } from 'angular-three';
import { NgtcPhysics } from 'angular-three-cannon';
import { NgtcDebug } from 'angular-three-cannon/debug';
import { assertInjector } from 'ngxtension/assert-injector';
import * as THREE from 'three';
import { NgtcArgFn, NgtcBodyPropsMap, NgtcBodyPublicApi, NgtcGetByIndex } from './types';
import { defaultTransformArgs, makeBodyApi, prepare, setupCollision } from './utils';

/**
 * Configuration options for creating a physics body.
 * @template TShape - The shape type of the physics body
 */
export interface NgtcBodyOptions<TShape extends BodyShapeType> {
	/**
	 * Custom function to transform body arguments before passing to the physics engine.
	 * Useful for converting Three.js geometries to physics-compatible formats.
	 */
	transformArgs?: NgtcArgFn<NgtcBodyPropsMap[TShape]>;
	/**
	 * Angular injector to use for dependency injection.
	 * If not provided, uses the current injection context.
	 */
	injector?: Injector;
}

function createBody<TShape extends BodyShapeType>(type: TShape) {
	return <TObject extends THREE.Object3D>(
		getPropFn: NgtcGetByIndex<NgtcBodyPropsMap[TShape]>,
		ref: ElementRef<TObject> | TObject | Signal<ElementRef<TObject> | TObject | undefined>,
		options?: NgtcBodyOptions<TShape>,
	) => body<TShape, TObject>(type, getPropFn, ref, options);
}

function body<TShape extends BodyShapeType, TObject extends THREE.Object3D>(
	type: TShape,
	getPropFn: NgtcGetByIndex<NgtcBodyPropsMap[TShape]>,
	ref: ElementRef<TObject> | TObject | Signal<ElementRef<TObject> | TObject | undefined>,
	{ transformArgs, injector }: NgtcBodyOptions<TShape> = {},
): Signal<NgtcBodyPublicApi | null> {
	return assertInjector(body, injector, () => {
		const physics = inject(NgtcPhysics, { optional: true });

		if (!physics) {
			throw new Error(`[NGT Cannon] injectBody was called outside of <ngtc-physics>`);
		}

		const debug = inject(NgtcDebug, { optional: true });

		const transform = transformArgs ?? defaultTransformArgs[type];
		const isRefSignal = isSignal(ref);
		const bodyRef = (isRefSignal ? ref : signal(ref)) as WritableSignal<TObject | undefined>;
		const body = computed(() => resolveRef(bodyRef()));

		const api = computed(() => {
			const _body = body();
			if (!_body) return null;

			const { worker, ...rest } = physics;
			const _worker = worker();
			if (!_worker) return null;

			return makeBodyApi(_body, _worker, rest);
		});

		effect((onCleanup) => {
			const currentWorker = physics.worker();
			if (!currentWorker) return;

			const object = body();

			if (!isRefSignal && !object) {
				bodyRef.set(resolveRef(ref));
				return;
			}

			if (!object) return;

			const [uuid, props] = (() => {
				let uuids: string[] = [];
				let temp: THREE.Object3D;
				if (is.three<THREE.InstancedMesh>(object, 'isInstancedMesh')) {
					object.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
					uuids = new Array(object.count).fill(0).map((_, i) => `${object.uuid}/${i}`);
					temp = new THREE.Object3D();
				} else {
					uuids = [object.uuid];
				}
				return [
					uuids,
					uuids.map((id, index) => {
						const props = getPropFn(index);
						if (temp) {
							prepare(temp, props);
							(object as unknown as THREE.InstancedMesh).setMatrixAt(index, temp.matrix);
							(object as unknown as THREE.InstancedMesh).instanceMatrix.needsUpdate = true;
						} else {
							prepare(object, props);
						}
						physics.refs[id] = object;
						debug?.add(id, props, type);
						setupCollision(physics.events, props, id);
						// @ts-expect-error - if args is undefined, there's default
						return { ...props, args: transform(props.args) };
					}),
				];
			})();

			// Register on mount, unregister on unmount
			currentWorker.addBodies({
				props: props.map(({ onCollide, onCollideBegin, onCollideEnd, ...serializableProps }) => {
					return {
						onCollide: Boolean(onCollide),
						onCollideBegin: Boolean(onCollideBegin),
						onCollideEnd: Boolean(onCollideEnd),
						...serializableProps,
					};
				}),
				type,
				uuid,
			});

			onCleanup(() => {
				uuid.forEach((id) => {
					delete physics.refs[id];
					debug?.remove(id);
					delete physics.events[id];
				});
				currentWorker.removeBodies({ uuid });
			});
		});

		return api;
	});
}

/**
 * Creates a box-shaped physics body.
 *
 * @param getPropFn - Function returning body properties for each instance index
 * @param ref - Reference to the Three.js Object3D to attach physics to
 * @param options - Optional configuration for the body
 * @returns Signal containing the body's public API, or null if not ready
 *
 * @example
 * ```typescript
 * const mesh = viewChild.required<ElementRef<Mesh>>('mesh');
 * const api = box(() => ({ mass: 1, args: [1, 1, 1], position: [0, 5, 0] }), mesh);
 * ```
 */
export const box = createBody('Box');

/**
 * Creates a convex polyhedron physics body from vertices and faces.
 *
 * @param getPropFn - Function returning body properties for each instance index
 * @param ref - Reference to the Three.js Object3D to attach physics to
 * @param options - Optional configuration for the body
 * @returns Signal containing the body's public API, or null if not ready
 *
 * @example
 * ```typescript
 * const mesh = viewChild.required<ElementRef<Mesh>>('mesh');
 * const api = convexPolyhedron(() => ({
 *   mass: 1,
 *   args: [vertices, faces],
 *   position: [0, 5, 0]
 * }), mesh);
 * ```
 */
export const convexPolyhedron = createBody('ConvexPolyhedron');

/**
 * Creates a cylinder-shaped physics body.
 *
 * @param getPropFn - Function returning body properties for each instance index
 * @param ref - Reference to the Three.js Object3D to attach physics to
 * @param options - Optional configuration for the body
 * @returns Signal containing the body's public API, or null if not ready
 *
 * @example
 * ```typescript
 * const mesh = viewChild.required<ElementRef<Mesh>>('mesh');
 * // args: [radiusTop, radiusBottom, height, numSegments]
 * const api = cylinder(() => ({ mass: 1, args: [0.5, 0.5, 2, 16], position: [0, 5, 0] }), mesh);
 * ```
 */
export const cylinder = createBody('Cylinder');

/**
 * Creates a heightfield physics body for terrain simulation.
 *
 * @param getPropFn - Function returning body properties for each instance index
 * @param ref - Reference to the Three.js Object3D to attach physics to
 * @param options - Optional configuration for the body
 * @returns Signal containing the body's public API, or null if not ready
 *
 * @example
 * ```typescript
 * const mesh = viewChild.required<ElementRef<Mesh>>('mesh');
 * const heightData = [[0, 0, 0], [0, 1, 0], [0, 0, 0]];
 * const api = heightfield(() => ({
 *   mass: 0,
 *   args: [heightData, { elementSize: 1 }],
 *   position: [0, 0, 0]
 * }), mesh);
 * ```
 */
export const heightfield = createBody('Heightfield');

/**
 * Creates a particle (point mass) physics body with no shape.
 *
 * @param getPropFn - Function returning body properties for each instance index
 * @param ref - Reference to the Three.js Object3D to attach physics to
 * @param options - Optional configuration for the body
 * @returns Signal containing the body's public API, or null if not ready
 *
 * @example
 * ```typescript
 * const mesh = viewChild.required<ElementRef<Mesh>>('mesh');
 * const api = particle(() => ({ mass: 1, position: [0, 5, 0] }), mesh);
 * ```
 */
export const particle = createBody('Particle');

/**
 * Creates an infinite plane physics body, typically used for floors or walls.
 *
 * @param getPropFn - Function returning body properties for each instance index
 * @param ref - Reference to the Three.js Object3D to attach physics to
 * @param options - Optional configuration for the body
 * @returns Signal containing the body's public API, or null if not ready
 *
 * @example
 * ```typescript
 * const mesh = viewChild.required<ElementRef<Mesh>>('mesh');
 * const api = plane(() => ({
 *   mass: 0, // Static body
 *   rotation: [-Math.PI / 2, 0, 0], // Horizontal
 *   position: [0, 0, 0]
 * }), mesh);
 * ```
 */
export const plane = createBody('Plane');

/**
 * Creates a sphere-shaped physics body.
 *
 * @param getPropFn - Function returning body properties for each instance index
 * @param ref - Reference to the Three.js Object3D to attach physics to
 * @param options - Optional configuration for the body
 * @returns Signal containing the body's public API, or null if not ready
 *
 * @example
 * ```typescript
 * const mesh = viewChild.required<ElementRef<Mesh>>('mesh');
 * // args: [radius]
 * const api = sphere(() => ({ mass: 1, args: [1], position: [0, 5, 0] }), mesh);
 * ```
 */
export const sphere = createBody('Sphere');

/**
 * Creates a trimesh physics body from vertices and indices.
 * Useful for complex static geometry like terrain or obstacles.
 *
 * @param getPropFn - Function returning body properties for each instance index
 * @param ref - Reference to the Three.js Object3D to attach physics to
 * @param options - Optional configuration for the body
 * @returns Signal containing the body's public API, or null if not ready
 *
 * @example
 * ```typescript
 * const mesh = viewChild.required<ElementRef<Mesh>>('mesh');
 * const api = trimesh(() => ({
 *   mass: 0,
 *   args: [vertices, indices],
 *   position: [0, 0, 0]
 * }), mesh);
 * ```
 */
export const trimesh = createBody('Trimesh');

/**
 * Creates a compound physics body composed of multiple shapes.
 * Useful for complex objects that can be approximated by combining primitives.
 *
 * @param getPropFn - Function returning body properties for each instance index
 * @param ref - Reference to the Three.js Object3D to attach physics to
 * @param options - Optional configuration for the body
 * @returns Signal containing the body's public API, or null if not ready
 *
 * @example
 * ```typescript
 * const mesh = viewChild.required<ElementRef<Mesh>>('mesh');
 * const api = compound(() => ({
 *   mass: 1,
 *   shapes: [
 *     { type: 'Box', args: [1, 1, 1], position: [0, 0, 0] },
 *     { type: 'Sphere', args: [0.5], position: [0, 1, 0] }
 *   ],
 *   position: [0, 5, 0]
 * }), mesh);
 * ```
 */
export const compound = createBody('Compound');

/**
 * @deprecated Use `box` instead. Will be removed in v5.0.0
 * @since v4.0.0
 */
export const injectBox = box;

/**
 * @deprecated Use `convexPolyhedron` instead. Will be removed in v5.0.0
 * @since v4.0.0
 */
export const injectConvexPolyhedron = convexPolyhedron;

/**
 * @deprecated Use `cylinder` instead. Will be removed in v5.0.0
 * @since v4.0.0
 */
export const injectCylinder = cylinder;

/**
 * @deprecated Use `heightfield` instead. Will be removed in v5.0.0
 * @since v4.0.0
 */
export const injectHeightfield = heightfield;

/**
 * @deprecated Use `particle` instead. Will be removed in v5.0.0
 * @since v4.0.0
 */
export const injectParticle = particle;

/**
 * @deprecated Use `plane` instead. Will be removed in v5.0.0
 * @since v4.0.0
 */
export const injectPlane = plane;

/**
 * @deprecated Use `sphere` instead. Will be removed in v5.0.0
 * @since v4.0.0
 */
export const injectSphere = sphere;

/**
 * @deprecated Use `trimesh` instead. Will be removed in v5.0.0
 * @since v4.0.0
 */
export const injectTrimesh = trimesh;

/**
 * @deprecated Use `compound` instead. Will be removed in v5.0.0
 * @since v4.0.0
 */
export const injectCompound = compound;
