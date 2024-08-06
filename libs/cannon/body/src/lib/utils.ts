import {
	AtomicName,
	BodyProps,
	BoxProps,
	CannonWorkerAPI,
	CompoundBodyProps,
	ConvexPolyhedronArgs,
	CylinderArgs,
	HeightfieldArgs,
	ParticleProps,
	PlaneProps,
	PropValue,
	Quad,
	SetOpName,
	SphereArgs,
	SubscriptionName,
	SubscriptionTarget,
	Subscriptions,
	TrimeshArgs,
	Triplet,
	VectorName,
} from '@pmndrs/cannon-worker-api';
import { NgtcCannonEvents, NgtcPhysicsApi } from 'angular-three-cannon';
import { Euler, Object3D, Quaternion, Vector3 } from 'three';
import { NgtcWorkerApi } from './types';

function capitalize<T extends string>(str: T): Capitalize<T> {
	return (str.charAt(0).toUpperCase() + str.slice(1)) as Capitalize<T>;
}

function getUUID(body: Object3D, index?: number) {
	const suffix = index === undefined ? '' : `/${index}`;
	if (typeof body === 'function') return null;
	return body && body && `${body.uuid}${suffix}`;
}

const e = new Euler();
const q = new Quaternion();

function quaternionToRotation(callback: (v: Triplet) => void) {
	return (v: Quad) => callback(e.setFromQuaternion(q.fromArray(v)).toArray() as Triplet);
}

let incrementingId = 0;
export function createSubscribe<T extends SubscriptionName>(
	body: Object3D,
	worker: CannonWorkerAPI,
	subscriptions: Subscriptions,
	type: T,
	index?: number,
	target: SubscriptionTarget = 'bodies',
) {
	return (callback: (value: PropValue<T>) => void) => {
		const id = incrementingId++;
		subscriptions[id] = { [type]: callback };
		const uuid = getUUID(body, index);
		uuid && worker.subscribe({ props: { id, target, type }, uuid });
		return () => {
			delete subscriptions[id];
			worker.unsubscribe({ props: id });
		};
	};
}

function makeTriplet(v: Vector3 | Triplet): Triplet {
	return v instanceof Vector3 ? [v.x, v.y, v.z] : v;
}

export function prepare(object: Object3D, { position = [0, 0, 0], rotation = [0, 0, 0], userData = {} }: BodyProps) {
	object.userData = userData;
	object.position.set(...position);
	object.rotation.set(...rotation);
	object.updateMatrix();
}

export function setupCollision(
	events: NgtcCannonEvents,
	{ onCollide, onCollideBegin, onCollideEnd }: Partial<BodyProps>,
	uuid: string,
) {
	events[uuid] = { collide: onCollide, collideBegin: onCollideBegin, collideEnd: onCollideEnd };
}

export function makeBodyApi(
	body: Object3D,
	worker: CannonWorkerAPI,
	{ subscriptions, scaleOverrides }: Pick<NgtcPhysicsApi, 'subscriptions' | 'scaleOverrides'>,
) {
	const makeAtomic = <T extends AtomicName>(type: T, index?: number) => {
		const op: SetOpName<T> = `set${capitalize(type)}`;

		return {
			set: (value: PropValue<T>) => {
				const uuid = getUUID(body, index);
				uuid && worker[op]({ props: value, uuid } as never);
			},
			subscribe: createSubscribe(body, worker, subscriptions, type, index),
		};
	};

	const makeQuaternion = (index?: number) => {
		const type = 'quaternion';
		return {
			copy: ({ w, x, y, z }: Quaternion) => {
				const uuid = getUUID(body, index);
				uuid && worker.setQuaternion({ props: [x, y, z, w], uuid });
			},
			set: (x: number, y: number, z: number, w: number) => {
				const uuid = getUUID(body, index);
				uuid && worker.setQuaternion({ props: [x, y, z, w], uuid });
			},
			subscribe: createSubscribe(body, worker, subscriptions, type, index),
		};
	};

	const makeRotation = (index?: number) => {
		return {
			copy: ({ x, y, z }: Vector3 | Euler) => {
				const uuid = getUUID(body, index);
				uuid && worker.setRotation({ props: [x, y, z], uuid });
			},
			set: (x: number, y: number, z: number) => {
				const uuid = getUUID(body, index);
				uuid && worker.setRotation({ props: [x, y, z], uuid });
			},
			subscribe: (callback: (value: Triplet) => void) => {
				const id = incrementingId++;
				const target = 'bodies';
				const type = 'quaternion';
				const uuid = getUUID(body, index);
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
			copy: ({ x, y, z }: Vector3 | Euler) => {
				const uuid = getUUID(body, index);
				uuid && worker[op]({ props: [x, y, z], uuid });
			},
			set: (x: number, y: number, z: number) => {
				const uuid = getUUID(body, index);
				uuid && worker[op]({ props: [x, y, z], uuid });
			},
			subscribe: createSubscribe(body, worker, subscriptions, type, index),
		};
	};

	const makeRemove = (index?: number) => {
		const uuid = getUUID(body, index);
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
				const uuid = getUUID(body, index);
				uuid && worker.applyForce({ props: [force, worldPoint], uuid });
			},
			applyImpulse(impulse: Triplet, worldPoint: Triplet) {
				const uuid = getUUID(body, index);
				uuid && worker.applyImpulse({ props: [impulse, worldPoint], uuid });
			},
			applyLocalForce(force: Triplet, localPoint: Triplet) {
				const uuid = getUUID(body, index);
				uuid && worker.applyLocalForce({ props: [force, localPoint], uuid });
			},
			applyLocalImpulse(impulse: Triplet, localPoint: Triplet) {
				const uuid = getUUID(body, index);
				uuid && worker.applyLocalImpulse({ props: [impulse, localPoint], uuid });
			},
			applyTorque(torque: Triplet) {
				const uuid = getUUID(body, index);
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
				const uuid = getUUID(body, index);
				if (uuid) scaleOverrides[uuid] = new Vector3(...scale);
			},
			sleep() {
				const uuid = getUUID(body, index);
				uuid && worker.sleep({ uuid });
			},
			sleepSpeedLimit: makeAtomic('sleepSpeedLimit', index),
			sleepTimeLimit: makeAtomic('sleepTimeLimit', index),
			userData: makeAtomic('userData', index),
			velocity: makeVec('velocity', index),
			remove: makeRemove(index),
			wakeUp() {
				const uuid = getUUID(body, index);
				uuid && worker.wakeUp({ uuid });
			},
		};
	}
	const cache: Record<number, NgtcWorkerApi> = {};
	return { ...makeApi(), at: (index: number) => cache[index] || (cache[index] = makeApi(index)) };
}

export const defaultTransformArgs = {
	Plane: (_: PlaneProps['args']) => [],
	Box: (args: BoxProps['args'] = [1, 1, 1]) => args,
	Trimesh: (args: TrimeshArgs) => args,
	Cylinder: (_: CylinderArgs = []) => [],
	Heightfield: (args: HeightfieldArgs) => args,
	ConvexPolyhedron: ([vertices, faces, normals, axes, boundingSphereRadius]: ConvexPolyhedronArgs = []) => [
		vertices && vertices.map(makeTriplet),
		faces,
		normals && normals.map(makeTriplet),
		axes && axes.map(makeTriplet),
		boundingSphereRadius,
	],
	Particle: (_: ParticleProps['args']) => [],
	Sphere: (args: SphereArgs = [1]) => {
		if (!Array.isArray(args)) throw new Error('Sphere body args must be an array');
		return [args[0]];
	},
	Compound: (args: CompoundBodyProps['args']) => args,
};
