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

export interface NgtcBodyOptions<TShape extends BodyShapeType> {
	transformArgs?: NgtcArgFn<NgtcBodyPropsMap[TShape]>;
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

export const box = createBody('Box');
export const convexPolyhedron = createBody('ConvexPolyhedron');
export const cylinder = createBody('Cylinder');
export const heightfield = createBody('Heightfield');
export const particle = createBody('Particle');
export const plane = createBody('Plane');
export const sphere = createBody('Sphere');
export const trimesh = createBody('Trimesh');
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
