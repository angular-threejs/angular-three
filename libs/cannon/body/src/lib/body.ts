import { Injector, afterNextRender } from '@angular/core';
import { BodyShapeType } from '@pmndrs/cannon-worker-api';
import { NgtInjectedRef, injectNgtRef } from 'angular-three';
import { injectNgtcPhysicsApi } from 'angular-three-cannon';
import { injectNgtcDebugApi } from 'angular-three-cannon/debug';
import { assertInjector } from 'ngxtension/assert-injector';
import { injectAutoEffect } from 'ngxtension/auto-effect';
import { DynamicDrawUsage, InstancedMesh, Object3D } from 'three';
import { NgtcArgFn, NgtcBodyPropsMap, NgtcBodyReturn, NgtcGetByIndex } from './types';
import { defaultTransformArgs, makeBodyApi, prepare, setupCollision } from './utils';

export interface NgtcBodyOptions<TShape extends BodyShapeType> {
	transformArgs?: NgtcArgFn<NgtcBodyPropsMap[TShape]>;
	ref?: NgtInjectedRef<Object3D>;
	injector?: Injector;
}

function createInjectBody<TShape extends BodyShapeType>(type: TShape) {
	return <TObject extends Object3D>(
		getPropFn: NgtcGetByIndex<NgtcBodyPropsMap[TShape]>,
		options?: NgtcBodyOptions<TShape>,
	) => injectBody<TShape, TObject>(type, getPropFn, options);
}

function injectBody<TShape extends BodyShapeType, TObject extends Object3D>(
	type: TShape,
	getPropFn: NgtcGetByIndex<NgtcBodyPropsMap[TShape]>,
	{ transformArgs, ref, injector }: NgtcBodyOptions<TShape> = {},
): NgtcBodyReturn<TObject> {
	return assertInjector(injectBody, injector, () => {
		const physicsApi = injectNgtcPhysicsApi({ optional: true });

		if (!physicsApi) {
			throw new Error(`[NGT Cannon] injectBody was called outside of <ngtc-physics>`);
		}

		const autoEffect = injectAutoEffect();
		const debugApi = injectNgtcDebugApi({ optional: true });

		const { add: addToDebug, remove: removeFromDebug } = debugApi || {};
		const transform = transformArgs ?? defaultTransformArgs[type];
		const bodyResult = { ref: ref ?? injectNgtRef() };

		afterNextRender(() => {
			Object.assign(bodyResult, { api: makeBodyApi(bodyResult.ref, physicsApi) });
			autoEffect(() => {
				const currentWorker = physicsApi.worker();
				if (!currentWorker) return;

				if (!bodyResult.ref.nativeElement) {
					bodyResult.ref.nativeElement = new Object3D();
					return;
				}

				const object = bodyResult.ref.nativeElement;
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
								(object as InstancedMesh).setMatrixAt(index, temp.matrix);
								(object as InstancedMesh).instanceMatrix.needsUpdate = true;
							} else {
								prepare(object, props);
							}
							physicsApi.refs[id] = object;
							addToDebug?.(id, props, type);
							setupCollision(physicsApi.events, props, id);
							// @ts-expect-error - if args is undefined, there's default
							return { ...props, args: transform(props.args) };
						}),
					];
				})();
				// Register on mount, unregister on unmount
				currentWorker.addBodies({
					props: props.map(({ onCollide, onCollideBegin, onCollideEnd, ...serializableProps }) => {
						return { onCollide: Boolean(onCollide), ...serializableProps };
					}),
					type,
					uuid,
				});

				return () => {
					uuid.forEach((id) => {
						delete physicsApi.refs[id];
						removeFromDebug?.(id);
						delete physicsApi.events[id];
					});
					currentWorker.removeBodies({ uuid });
				};
			});
		});

		return bodyResult as NgtcBodyReturn<TObject>;
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
