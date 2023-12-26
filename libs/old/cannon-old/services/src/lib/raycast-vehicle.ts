import { effect, untracked, type Injector } from '@angular/core';
import type { WheelInfoOptions } from '@pmndrs/cannon-worker-api';
import { injectNgtcPhysicsApi } from 'angular-three-cannon-old';
import { injectNgtRef, type NgtAnyRecord, type NgtInjectedRef } from 'angular-three-old';
import { assertInjector } from 'ngxtension/assert-injector';
import * as THREE from 'three';
import { createSubscribe, getUUID } from './body';

function isString(v: unknown): v is string {
	return typeof v === 'string';
}

export type NgtcRaycastVehicleState = {
	chassisBody: NgtInjectedRef<THREE.Object3D>;
	wheelInfos: WheelInfoOptions[];
	wheels: Array<NgtInjectedRef<THREE.Object3D>>;
	indexForwardAxis?: number;
	indexRightAxis?: number;
	indexUpAxis?: number;
};

export type NgtcRaycastVehiclePublicApi = {
	applyEngineForce: (value: number, wheelIndex: number) => void;
	setBrake: (brake: number, wheelIndex: number) => void;
	setSteeringValue: (value: number, wheelIndex: number) => void;
	sliding: { subscribe: (callback: (sliding: boolean) => void) => void };
	remove: () => void;
};

export type NgtcRaycastVehicleReturn<TObject extends THREE.Object3D = THREE.Object3D> = {
	ref: NgtInjectedRef<TObject>;
	api: NgtcRaycastVehiclePublicApi;
};

export function injectRaycastVehicle<TObject extends THREE.Object3D = THREE.Object3D>(
	fn: () => NgtcRaycastVehicleState,
	{
		ref,
		injector,
		deps = () => ({}),
	}: { ref?: NgtInjectedRef<TObject>; injector?: Injector; deps?: () => NgtAnyRecord } = {},
): NgtcRaycastVehicleReturn<TObject> {
	return assertInjector(injectRaycastVehicle, injector, () => {
		const physicsApi = injectNgtcPhysicsApi();
		const [worker, subscriptions] = [physicsApi.select('worker'), physicsApi.get('subscriptions')];

		const instanceRef = ref || injectNgtRef<TObject>();

		effect((onCleanup) => {
			deps();
			if (!instanceRef.nativeElement) {
				instanceRef.nativeElement = new THREE.Object3D() as TObject;
				return;
			}

			const currentWorker = worker();
			const uuid: string = instanceRef.nativeElement.uuid;
			const {
				chassisBody,
				indexForwardAxis = 2,
				indexRightAxis = 0,
				indexUpAxis = 1,
				wheelInfos,
				wheels,
			} = untracked(fn);

			const chassisBodyUUID = getUUID(chassisBody);
			const wheelUUIDs = wheels.map((ref) => getUUID(ref));

			if (!chassisBodyUUID || !wheelUUIDs.every(isString)) return;

			currentWorker.addRaycastVehicle({
				props: [chassisBodyUUID, wheelUUIDs, wheelInfos, indexForwardAxis, indexRightAxis, indexUpAxis],
				uuid,
			});
			onCleanup(() => {
				currentWorker.removeRaycastVehicle({ uuid });
			});
		});

		const api = (() => ({
			applyEngineForce(value: number, wheelIndex: number) {
				const uuid = getUUID(instanceRef);
				uuid &&
					worker().applyRaycastVehicleEngineForce({
						props: [value, wheelIndex],
						uuid,
					});
			},
			setBrake(brake: number, wheelIndex: number) {
				const uuid = getUUID(instanceRef);
				uuid && worker().setRaycastVehicleBrake({ props: [brake, wheelIndex], uuid });
			},
			setSteeringValue(value: number, wheelIndex: number) {
				const uuid = getUUID(instanceRef);
				uuid &&
					worker().setRaycastVehicleSteeringValue({
						props: [value, wheelIndex],
						uuid,
					});
			},
			sliding: {
				subscribe: createSubscribe(instanceRef, worker(), subscriptions, 'sliding', undefined, 'vehicles'),
			},

			remove: () => {
				const uuid = getUUID(instanceRef);
				uuid && worker().removeRaycastVehicle({ uuid });
			},
		}))();

		return { ref: instanceRef, api };
	});
}
