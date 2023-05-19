import { ElementRef, Injector, Signal, computed, effect, inject, runInInjectionContext } from '@angular/core';
import type {
    AtomicName,
    AtomicProps,
    BodyProps,
    BodyShapeType,
    BoxProps,
    CannonWorkerAPI,
    CompoundBodyProps,
    ConvexPolyhedronArgs,
    ConvexPolyhedronProps,
    CylinderProps,
    HeightfieldProps,
    ParticleProps,
    PlaneProps,
    PropValue,
    Quad,
    SetOpName,
    SphereArgs,
    SphereProps,
    SubscriptionName,
    SubscriptionTarget,
    Subscriptions,
    TrimeshProps,
    Triplet,
    VectorName,
} from '@pmndrs/cannon-worker-api';
import { NgtAnyRecord, NgtInjectedRef, assertInjectionContext, injectNgtRef } from 'angular-three';
import { NGTC_PHYSICS_API, NgtcCannonEvents } from 'angular-three-cannon';
import { NGTC_DEBUG_API } from 'angular-three-cannon/debug';
import * as THREE from 'three';

export type NgtcAtomicApi<K extends AtomicName> = {
    set: (value: AtomicProps[K]) => void;
    subscribe: (callback: (value: AtomicProps[K]) => void) => () => void;
};

export type NgtcQuaternionApi = {
    copy: ({ w, x, y, z }: THREE.Quaternion) => void;
    set: (x: number, y: number, z: number, w: number) => void;
    subscribe: (callback: (value: Quad) => void) => () => void;
};

export type NgtcVectorApi = {
    copy: ({ x, y, z }: THREE.Vector3 | THREE.Euler) => void;
    set: (x: number, y: number, z: number) => void;
    subscribe: (callback: (value: Triplet) => void) => () => void;
};

export type NgtcWorkerApi = {
    [K in AtomicName]: NgtcAtomicApi<K>;
} & {
    [K in VectorName]: NgtcVectorApi;
} & {
    applyForce: (force: Triplet, worldPoint: Triplet) => void;
    applyImpulse: (impulse: Triplet, worldPoint: Triplet) => void;
    applyLocalForce: (force: Triplet, localPoint: Triplet) => void;
    applyLocalImpulse: (impulse: Triplet, localPoint: Triplet) => void;
    applyTorque: (torque: Triplet) => void;
    quaternion: NgtcQuaternionApi;
    rotation: NgtcVectorApi;
    scaleOverride: (scale: Triplet) => void;
    sleep: () => void;
    wakeUp: () => void;
    remove: () => void;
};

export interface NgtcBodyPublicApi extends NgtcWorkerApi {
    at: (index: number) => NgtcWorkerApi;
}

export interface NgtcBodyReturn<TObject extends THREE.Object3D> {
    ref: NgtInjectedRef<TObject>;
    api: Signal<NgtcBodyPublicApi>;
}

export type NgtcGetByIndex<T extends BodyProps> = (index: number) => T;
export type NgtcArgFn<T> = (args: T) => unknown[];

const temp = new THREE.Object3D();

function capitalize<T extends string>(str: T): Capitalize<T> {
    return (str.charAt(0).toUpperCase() + str.slice(1)) as Capitalize<T>;
}

export function getUUID(ref: ElementRef<THREE.Object3D>, index?: number): string | null {
    const suffix = index === undefined ? '' : `/${index}`;
    if (typeof ref === 'function') return null;
    return ref && ref.nativeElement && `${ref.nativeElement.uuid}${suffix}`;
}

const e = new THREE.Euler();
const q = new THREE.Quaternion();

const quaternionToRotation = (callback: (v: Triplet) => void) => {
    return (v: Quad) => callback(e.setFromQuaternion(q.fromArray(v)).toArray() as Triplet);
};

let incrementingId = 0;

export function subscribe<T extends SubscriptionName>(
    ref: ElementRef<THREE.Object3D>,
    worker: CannonWorkerAPI,
    subscriptions: Subscriptions,
    type: T,
    index?: number,
    target: SubscriptionTarget = 'bodies'
) {
    return (callback: (value: PropValue<T>) => void) => {
        const id = incrementingId++;
        subscriptions[id] = { [type]: callback };
        const uuid = getUUID(ref, index);
        uuid && worker.subscribe({ props: { id, target, type }, uuid });
        return () => {
            delete subscriptions[id];
            worker.unsubscribe({ props: id });
        };
    };
}

function prepare(object: THREE.Object3D, { position = [0, 0, 0], rotation = [0, 0, 0], userData = {} }: BodyProps) {
    object.userData = userData;
    object.position.set(...position);
    object.rotation.set(...rotation);
    object.updateMatrix();
}

function setupCollision(
    events: NgtcCannonEvents,
    { onCollide, onCollideBegin, onCollideEnd }: Partial<BodyProps>,
    uuid: string
) {
    events[uuid] = {
        collide: onCollide,
        collideBegin: onCollideBegin,
        collideEnd: onCollideEnd,
    };
}

function makeTriplet(v: THREE.Vector3 | Triplet): Triplet {
    return v instanceof THREE.Vector3 ? [v.x, v.y, v.z] : v;
}

export interface NgtcBodyOptions<TObject extends THREE.Object3D> {
    ref?: NgtInjectedRef<TObject>;
    deps?: () => NgtAnyRecord;
    injector?: Injector;
}

export function injectPlane<TObject extends THREE.Object3D>(
    fn: NgtcGetByIndex<PlaneProps>,
    opts?: NgtcBodyOptions<TObject>
) {
    return injectBody('Plane', fn, () => [], opts);
}

export function injectBox<TObject extends THREE.Object3D>(
    fn: NgtcGetByIndex<BoxProps>,
    opts?: NgtcBodyOptions<TObject>
) {
    const defaultBoxArgs: Triplet = [1, 1, 1];
    return injectBody('Box', fn, (args = defaultBoxArgs): Triplet => args, opts);
}

export function injectCylinder<TObject extends THREE.Object3D>(
    fn: NgtcGetByIndex<CylinderProps>,
    opts?: NgtcBodyOptions<TObject>
) {
    return injectBody('Cylinder', fn, (args = [] as []) => args, opts);
}

export function injectHeightfield<TObject extends THREE.Object3D>(
    fn: NgtcGetByIndex<HeightfieldProps>,
    opts?: NgtcBodyOptions<TObject>
) {
    return injectBody('Heightfield', fn, (args) => args, opts);
}

export function injectParticle<TObject extends THREE.Object3D>(
    fn: NgtcGetByIndex<ParticleProps>,
    opts?: NgtcBodyOptions<TObject>
) {
    return injectBody('Particle', fn, () => [], opts);
}
export function injectSphere<TObject extends THREE.Object3D>(
    fn: NgtcGetByIndex<SphereProps>,
    opts?: NgtcBodyOptions<TObject>
) {
    return injectBody(
        'Sphere',
        fn,
        (args: SphereArgs = [1]): SphereArgs => {
            if (!Array.isArray(args)) throw new Error('useSphere args must be an array');
            return [args[0]];
        },
        opts
    );
}
export function injectTrimesh<TObject extends THREE.Object3D>(
    fn: NgtcGetByIndex<TrimeshProps>,
    opts?: NgtcBodyOptions<TObject>
) {
    return injectBody('Trimesh', fn, (args) => args, opts);
}

export function injectConvexPolyhedron<TObject extends THREE.Object3D>(
    fn: NgtcGetByIndex<ConvexPolyhedronProps>,
    opts?: NgtcBodyOptions<TObject>
) {
    return injectBody(
        'ConvexPolyhedron',
        fn,
        ([vertices, faces, normals, axes, boundingSphereRadius] = []): ConvexPolyhedronArgs<Triplet> => [
            vertices && vertices.map(makeTriplet),
            faces,
            normals && normals.map(makeTriplet),
            axes && axes.map(makeTriplet),
            boundingSphereRadius,
        ],
        opts
    );
}
export function injectCompoundBody<TObject extends THREE.Object3D>(
    fn: NgtcGetByIndex<CompoundBodyProps>,
    opts?: NgtcBodyOptions<TObject>
) {
    return injectBody('Compound', fn, (args) => args as unknown[], opts);
}

function injectBody<TBodyProps extends BodyProps, TObject extends THREE.Object3D>(
    type: BodyShapeType,
    getPropsFn: NgtcGetByIndex<TBodyProps>,
    argsFn: NgtcArgFn<TBodyProps['args']>,
    { ref, injector, deps = () => ({}) }: NgtcBodyOptions<TObject> = {}
): NgtcBodyReturn<TObject> {
    injector = assertInjectionContext(injectBody, injector);
    return runInInjectionContext(injector, () => {
        let bodyRef = injectNgtRef<TObject>();

        if (ref) bodyRef = ref;

        const physicsApi = inject(NGTC_PHYSICS_API);
        const debugApi = inject(NGTC_DEBUG_API, { optional: true });

        const { refs, worker, subscriptions, scaleOverrides, events } = physicsApi();
        const { add: debugAdd, remove: debugRemove } = debugApi?.() || {};

        effect(
            (onCleanup) => {
                // register deps
                deps();

                if (!bodyRef.untracked) {
                    bodyRef.nativeElement = new THREE.Object3D() as TObject;
                }

                const object = bodyRef.untracked;
                const currentWorker = worker;

                const objectCount =
                    object instanceof THREE.InstancedMesh
                        ? (object.instanceMatrix.setUsage(THREE.DynamicDrawUsage), object.count)
                        : 1;

                const uuid =
                    object instanceof THREE.InstancedMesh
                        ? new Array(objectCount).fill(0).map((_, i) => `${object.uuid}/${i}`)
                        : [object.uuid];

                const props: (TBodyProps & { args: unknown })[] =
                    object instanceof THREE.InstancedMesh
                        ? uuid.map((id, i) => {
                              const props = getPropsFn(i);
                              prepare(temp, props);
                              object.setMatrixAt(i, temp.matrix);
                              object.instanceMatrix.needsUpdate = true;
                              refs[id] = object;
                              debugAdd?.(id, props, type);
                              setupCollision(events, props, id);
                              return { ...props, args: argsFn(props.args) };
                          })
                        : uuid.map((id, i) => {
                              const props = getPropsFn(i);
                              prepare(object, props);
                              refs[id] = object;
                              debugAdd?.(id, props, type);
                              setupCollision(events, props, id);
                              return { ...props, args: argsFn(props.args) };
                          });

                // Register on mount, unregister on unmount
                currentWorker.addBodies({
                    props: props.map(({ onCollide, onCollideBegin, onCollideEnd, ...serializableProps }) => {
                        return { onCollide: Boolean(onCollide), ...serializableProps };
                    }),
                    type,
                    uuid,
                });

                onCleanup(() => {
                    uuid.forEach((id) => {
                        delete refs[id];
                        debugRemove?.(id);
                        delete events[id];
                    });
                    currentWorker.removeBodies({ uuid });
                });
            },
            { allowSignalWrites: true }
        );

        const api = computed(() => {
            const makeAtomic = <T extends AtomicName>(type: T, index?: number) => {
                const op: SetOpName<T> = `set${capitalize(type)}`;

                return {
                    set: (value: PropValue<T>) => {
                        const uuid = getUUID(bodyRef, index);
                        uuid &&
                            worker[op]({
                                props: value,
                                uuid,
                            } as never);
                    },
                    subscribe: subscribe(bodyRef, worker, subscriptions, type, index),
                };
            };

            const makeQuaternion = (index?: number) => {
                const type = 'quaternion';
                return {
                    copy: ({ w, x, y, z }: THREE.Quaternion) => {
                        const uuid = getUUID(bodyRef, index);
                        uuid && worker.setQuaternion({ props: [x, y, z, w], uuid });
                    },
                    set: (x: number, y: number, z: number, w: number) => {
                        const uuid = getUUID(bodyRef, index);
                        uuid && worker.setQuaternion({ props: [x, y, z, w], uuid });
                    },
                    subscribe: subscribe(bodyRef, worker, subscriptions, type, index),
                };
            };

            const makeRotation = (index?: number) => {
                return {
                    copy: ({ x, y, z }: THREE.Vector3 | THREE.Euler) => {
                        const uuid = getUUID(bodyRef, index);
                        uuid && worker.setRotation({ props: [x, y, z], uuid });
                    },
                    set: (x: number, y: number, z: number) => {
                        const uuid = getUUID(bodyRef, index);
                        uuid && worker.setRotation({ props: [x, y, z], uuid });
                    },
                    subscribe: (callback: (value: Triplet) => void) => {
                        const id = incrementingId++;
                        const target = 'bodies';
                        const type = 'quaternion';
                        const uuid = getUUID(bodyRef, index);

                        subscriptions[id] = { [type]: quaternionToRotation(callback) };
                        uuid && worker.subscribe({ props: { id, target, type }, uuid });
                        return () => {
                            delete subscriptions[id];
                            worker.unsubscribe({ props: id });
                        };
                    },
                };
            };

            const makeVec = (type: VectorName, index?: number) => {
                const op: SetOpName<VectorName> = `set${capitalize(type)}`;
                return {
                    copy: ({ x, y, z }: THREE.Vector3 | THREE.Euler) => {
                        const uuid = getUUID(bodyRef, index);
                        uuid && worker[op]({ props: [x, y, z], uuid });
                    },
                    set: (x: number, y: number, z: number) => {
                        const uuid = getUUID(bodyRef, index);
                        uuid && worker[op]({ props: [x, y, z], uuid });
                    },
                    subscribe: subscribe(bodyRef, worker, subscriptions, type, index),
                };
            };

            const makeRemove = (index?: number) => {
                const uuid = getUUID(bodyRef, index);
                return () => {
                    if (uuid) worker.removeBodies({ uuid: [uuid] });
                };
            };

            function makeApi(index?: number): NgtcWorkerApi {
                return {
                    allowSleep: makeAtomic('allowSleep', index),
                    angularDamping: makeAtomic('angularDamping', index),
                    angularFactor: makeVec('angularFactor', index),
                    angularVelocity: makeVec('angularVelocity', index),
                    applyForce(force: Triplet, worldPoint: Triplet) {
                        const uuid = getUUID(bodyRef, index);
                        uuid && worker.applyForce({ props: [force, worldPoint], uuid });
                    },
                    applyImpulse(impulse: Triplet, worldPoint: Triplet) {
                        const uuid = getUUID(bodyRef, index);
                        uuid && worker.applyImpulse({ props: [impulse, worldPoint], uuid });
                    },
                    applyLocalForce(force: Triplet, localPoint: Triplet) {
                        const uuid = getUUID(bodyRef, index);
                        uuid && worker.applyLocalForce({ props: [force, localPoint], uuid });
                    },
                    applyLocalImpulse(impulse: Triplet, localPoint: Triplet) {
                        const uuid = getUUID(bodyRef, index);
                        uuid && worker.applyLocalImpulse({ props: [impulse, localPoint], uuid });
                    },
                    applyTorque(torque: Triplet) {
                        const uuid = getUUID(bodyRef, index);
                        uuid && worker.applyTorque({ props: [torque], uuid });
                    },
                    collisionFilterGroup: makeAtomic('collisionFilterGroup', index),
                    collisionFilterMask: makeAtomic('collisionFilterMask', index),
                    collisionResponse: makeAtomic('collisionResponse', index),
                    fixedRotation: makeAtomic('fixedRotation', index),
                    isTrigger: makeAtomic('isTrigger', index),
                    linearDamping: makeAtomic('linearDamping', index),
                    linearFactor: makeVec('linearFactor', index),
                    mass: makeAtomic('mass', index),
                    material: makeAtomic('material', index),
                    position: makeVec('position', index),
                    quaternion: makeQuaternion(index),
                    rotation: makeRotation(index),
                    scaleOverride(scale) {
                        const uuid = getUUID(bodyRef, index);
                        if (uuid) scaleOverrides[uuid] = new THREE.Vector3(...scale);
                    },
                    sleep() {
                        const uuid = getUUID(bodyRef, index);
                        uuid && worker.sleep({ uuid });
                    },
                    sleepSpeedLimit: makeAtomic('sleepSpeedLimit', index),
                    sleepTimeLimit: makeAtomic('sleepTimeLimit', index),
                    userData: makeAtomic('userData', index),
                    velocity: makeVec('velocity', index),
                    remove: makeRemove(index),
                    wakeUp() {
                        const uuid = getUUID(bodyRef, index);
                        uuid && worker.wakeUp({ uuid });
                    },
                };
            }

            const cache: { [index: number]: NgtcWorkerApi } = {};
            return {
                ...makeApi(undefined),
                at: (index: number) => cache[index] || (cache[index] = makeApi(index)),
            };
        });

        return { ref: bodyRef, api };
    });
}
