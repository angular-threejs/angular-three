import { Injector, Signal, computed, effect, inject, runInInjectionContext, untracked } from '@angular/core';
import { WheelInfoOptions } from '@pmndrs/cannon-worker-api';
import { NgtAnyRecord, NgtInjectedRef, assertInjectionContext, injectNgtRef } from 'angular-three';
import { NGTC_PHYSICS_API } from 'angular-three-cannon';
import * as THREE from 'three';
import { getUUID, subscribe } from './body';

function isString(v: unknown): v is string {
    return typeof v === 'string';
}

export interface NgtcRaycastVehicleProps {
    chassisBody: NgtInjectedRef<THREE.Object3D>;
    wheelInfos: WheelInfoOptions[];
    wheels: Array<NgtInjectedRef<THREE.Object3D>>;
    indexForwardAxis?: number;
    indexRightAxis?: number;
    indexUpAxis?: number;
}

export interface NgtcRaycastVehiclePublicApi {
    applyEngineForce: (value: number, wheelIndex: number) => void;
    setBrake: (brake: number, wheelIndex: number) => void;
    setSteeringValue: (value: number, wheelIndex: number) => void;
    sliding: { subscribe: (callback: (sliding: boolean) => void) => void };
    remove: () => void;
}

export interface NgtcRaycastVehicleReturn<TObject extends THREE.Object3D = THREE.Object3D> {
    ref: NgtInjectedRef<TObject>;
    api: Signal<NgtcRaycastVehiclePublicApi>;
}

export function injectRaycastVehicle<TObject extends THREE.Object3D = THREE.Object3D>(
    fn: () => NgtcRaycastVehicleProps,
    {
        ref,
        injector,
        deps = () => ({}),
    }: { ref?: NgtInjectedRef<TObject>; injector?: Injector; deps?: () => NgtAnyRecord } = {}
): NgtcRaycastVehicleReturn<TObject> {
    injector = assertInjectionContext(injectRaycastVehicle, injector);
    return runInInjectionContext(injector, () => {
        const physicsApi = inject(NGTC_PHYSICS_API);
        const { worker, subscriptions } = physicsApi();

        let instanceRef = injectNgtRef<TObject>();
        if (ref) instanceRef = ref;

        effect(
            (onCleanup) => {
                deps();
                if (!instanceRef.untracked) {
                    instanceRef.nativeElement = new THREE.Object3D() as TObject;
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
            },
            { allowSignalWrites: true }
        );

        const api = computed<NgtcRaycastVehiclePublicApi>(() => {
            deps();
            return {
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
                    subscribe: subscribe(instanceRef, worker(), subscriptions, 'sliding', undefined, 'vehicles'),
                },

                remove: () => {
                    const uuid = getUUID(instanceRef);
                    uuid && worker().removeRaycastVehicle({ uuid });
                },
            };
        });

        return { ref: instanceRef, api };
    });
}
