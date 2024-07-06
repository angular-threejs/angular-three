import {
	AtomicName,
	AtomicProps,
	BodyProps,
	BoxProps,
	CompoundBodyProps,
	ConvexPolyhedronProps,
	CylinderProps,
	HeightfieldProps,
	ParticleProps,
	PlaneProps,
	Quad,
	SphereProps,
	TrimeshProps,
	Triplet,
	VectorName,
} from '@pmndrs/cannon-worker-api';
import { Euler, Quaternion, Vector3 } from 'three';

export interface NgtcAtomicApi<K extends AtomicName> {
	set: (value: AtomicProps[K]) => void;
	subscribe: (callback: (value: AtomicProps[K]) => void) => () => void;
}

export interface NgtcQuaternionApi {
	copy: ({ w, x, y, z }: Quaternion) => void;
	set: (x: number, y: number, z: number, w: number) => void;
	subscribe: (callback: (value: Quad) => void) => () => void;
}

export interface NgtcVectorApi {
	copy: ({ x, y, z }: Vector3 | Euler) => void;
	set: (x: number, y: number, z: number) => void;
	subscribe: (callback: (value: Triplet) => void) => () => void;
}

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

export interface NgtcBodyPropsMap {
	Plane: PlaneProps;
	Box: BoxProps;
	Particle: ParticleProps;
	Cylinder: CylinderProps;
	Sphere: SphereProps;
	Trimesh: TrimeshProps;
	Heightfield: HeightfieldProps;
	ConvexPolyhedron: ConvexPolyhedronProps;
	Compound: CompoundBodyProps;
}

export type NgtcGetByIndex<T extends BodyProps> = (index: number) => T;
export type NgtcArgFn<T extends BodyProps> = (args: NonNullable<T['args']>) => typeof args;
