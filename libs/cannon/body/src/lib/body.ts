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
	untracked,
} from '@angular/core';
import { BodyShapeType } from '@pmndrs/cannon-worker-api';
import { resolveRef } from 'angular-three';
import { NgtcPhysics } from 'angular-three-cannon';
import { NgtcDebug } from 'angular-three-cannon/debug';
import { assertInjector } from 'ngxtension/assert-injector';
import { DynamicDrawUsage, InstancedMesh, Object3D } from 'three';
import { NgtcArgFn, NgtcBodyPropsMap, NgtcBodyPublicApi, NgtcGetByIndex } from './types';
import { defaultTransformArgs, makeBodyApi, prepare, setupCollision } from './utils';

export interface NgtcBodyOptions<TShape extends BodyShapeType> {
	transformArgs?: NgtcArgFn<NgtcBodyPropsMap[TShape]>;
	injector?: Injector;
}

function createInjectBody<TShape extends BodyShapeType>(type: TShape) {
	return <TObject extends Object3D>(
		getPropFn: NgtcGetByIndex<NgtcBodyPropsMap[TShape]>,
		ref: ElementRef<TObject> | TObject | Signal<ElementRef<TObject> | TObject | undefined>,
		options?: NgtcBodyOptions<TShape>,
	) => injectBody<TShape, TObject>(type, getPropFn, ref, options);
}

function injectBody<TShape extends BodyShapeType, TObject extends Object3D>(
	type: TShape,
	getPropFn: NgtcGetByIndex<NgtcBodyPropsMap[TShape]>,
	ref: ElementRef<TObject> | TObject | Signal<ElementRef<TObject> | TObject | undefined>,
	{ transformArgs, injector }: NgtcBodyOptions<TShape> = {},
): Signal<NgtcBodyPublicApi | null> {
	return assertInjector(injectBody, injector, () => {
		const physics = inject(NgtcPhysics, { optional: true });

		if (!physics) {
			throw new Error(`[NGT Cannon] injectBody was called outside of <ngtc-physics>`);
		}

		const debug = inject(NgtcDebug, { optional: true });

		const transform = transformArgs ?? defaultTransformArgs[type];
		const bodyRef = isSignal(ref) ? ref : signal(ref);
		const body = computed(() => resolveRef(bodyRef()));

		const api = computed(() => {
			const _body = body();
			if (!_body) return null;
			const { worker, ...rest } = physics.api;
			if (!worker()) return null;
			return makeBodyApi(_body, worker(), rest);
		});

		effect((onCleanup) => {
			const currentWorker = physics.api.worker();
			if (!currentWorker) return;

			const object = body();

			if (!isSignal(ref) && !object) {
				untracked(() => {
					(bodyRef as WritableSignal<TObject | undefined>).set(resolveRef(ref));
				});
				return;
			}

			if (!object) return;

			const [uuid, props] = (() => {
				let uuids: string[] = [];
				let temp: Object3D;
				if (object instanceof InstancedMesh) {
					object.instanceMatrix.setUsage(DynamicDrawUsage);
					uuids = new Array(object.count).fill(0).map((_, i) => `${object.uuid}/${i}`);
					temp = new Object3D();
				} else {
					uuids = [object.uuid];
				}
				return [
					uuids,
					uuids.map((id, index) => {
						const props = getPropFn(index);
						if (temp) {
							prepare(temp, props);
							(object as unknown as InstancedMesh).setMatrixAt(index, temp.matrix);
							(object as unknown as InstancedMesh).instanceMatrix.needsUpdate = true;
						} else {
							prepare(object, props);
						}
						physics.api.refs[id] = object;
						debug?.add(id, props, type);
						setupCollision(physics.api.events, props, id);
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
					delete physics.api.refs[id];
					debug?.remove(id);
					delete physics.api.events[id];
				});
				currentWorker.removeBodies({ uuid });
			});
		});

		return api;
	});
}

export const injectBox = createInjectBody('Box');
export const injectConvexPolyhedron = createInjectBody('ConvexPolyhedron');
export const injectCylinder = createInjectBody('Cylinder');
export const injectHeightfield = createInjectBody('Heightfield');
export const injectParticle = createInjectBody('Particle');
export const injectPlane = createInjectBody('Plane');
export const injectSphere = createInjectBody('Sphere');
export const injectTrimesh = createInjectBody('Trimesh');
export const injectCompound = createInjectBody('Compound');
