import { Directive, Injector, afterNextRender, effect, inject, input, signal, untracked } from '@angular/core';
import {
	CannonWorkerAPI,
	CannonWorkerProps,
	CollideBeginEvent,
	CollideEndEvent,
	CollideEvent,
	RayhitEvent,
	Refs,
	Subscriptions,
	WorkerCollideBeginEvent,
	WorkerCollideEndEvent,
	WorkerCollideEvent,
	WorkerFrameMessage,
	WorkerRayhitEvent,
} from '@pmndrs/cannon-worker-api';
import { injectBeforeRender, injectStore, pick } from 'angular-three';
import { mergeInputs } from 'ngxtension/inject-inputs';
import { InstancedMesh, Matrix4, Object3D, Quaternion, QuaternionTuple, Vector3 } from 'three';

export interface NgtcCannonWorkerEvents {
	collide: WorkerCollideEvent;
	collideBegin: WorkerCollideBeginEvent;
	collideEnd: WorkerCollideEndEvent;
	frame: WorkerFrameMessage;
	rayhit: WorkerRayhitEvent;
}

export type NgtcCannonWorker = CannonWorkerAPI & {
	on: <K extends keyof NgtcCannonWorkerEvents>(event: K, cb: (data: NgtcCannonWorkerEvents[K]['data']) => void) => void;
	removeAllListeners: () => void;
};

const v = new Vector3();
const s = new Vector3(1, 1, 1);
const q = new Quaternion();
const m = new Matrix4();

function apply(
	index: number,
	positions: ArrayLike<number>,
	quaternions: ArrayLike<number>,
	scale = s,
	object?: Object3D,
) {
	if (index !== undefined) {
		m.compose(v.fromArray(positions, index * 3), q.fromArray(quaternions as QuaternionTuple, index * 4), scale);
		if (object) {
			object.matrixAutoUpdate = false;
			object.matrix.copy(m);
		}
		return m;
	}
	return m.identity();
}

function unique() {
	const values: unknown[] = [];
	return (value: unknown) => (values.includes(value) ? false : !!values.push(value));
}

type NgtcCannonEvent = CollideBeginEvent | CollideEndEvent | CollideEvent | RayhitEvent;
type NgtcCallbackByType<T extends { type: string }> = {
	[K in T['type']]?: T extends { type: K } ? (e: T) => void : never;
};

export type NgtcCannonEvents = Record<string, Partial<NgtcCallbackByType<NgtcCannonEvent>>>;

export type ScaleOverrides = Record<string, Vector3>;

export interface NgtcPhysicsOptions extends CannonWorkerProps {
	isPaused?: boolean;
	maxSubSteps?: number;
	shouldInvalidate?: boolean;
	stepSize?: number;
}

const defaultOptions: NgtcPhysicsOptions = {
	allowSleep: false,
	axisIndex: 0,
	broadphase: 'Naive',
	defaultContactMaterial: { contactEquationStiffness: 1e6 },
	frictionGravity: null,
	gravity: [0, -9.81, 0],
	isPaused: false,
	iterations: 5,
	maxSubSteps: 10,
	quatNormalizeFast: false,
	quatNormalizeSkip: 0,
	shouldInvalidate: true,
	size: 1000,
	solver: 'GS',
	stepSize: 1 / 60,
	tolerance: 0.001,
};

type NgtsPhysicsUpdatableOptions = Extract<
	keyof NgtcPhysicsOptions,
	'gravity' | 'iterations' | 'tolerance' | 'broadphase' | 'axisIndex'
>;

@Directive({ selector: 'ngtc-physics' })
export class NgtcPhysics {
	private store = injectStore();

	options = input(defaultOptions, { transform: mergeInputs(defaultOptions) });

	private axisIndex = pick(this.options, 'axisIndex');
	private broadphase = pick(this.options, 'broadphase');
	private gravity = pick(this.options, 'gravity');
	private iterations = pick(this.options, 'iterations');
	private tolerance = pick(this.options, 'tolerance');

	private invalidate = this.store.select('invalidate');
	// @ts-expect-error - worker is not nullable, and we don't want to use ! operator.
	private cannonWorker = signal<CannonWorkerAPI>(null);

	bodies: { [uuid: string]: number } = {};
	events: NgtcCannonEvents = {};
	refs: Refs = {};
	scaleOverrides: ScaleOverrides = {};
	subscriptions: Subscriptions = {};
	worker = this.cannonWorker.asReadonly();

	constructor() {
		const injector = inject(Injector);

		// NOTE: set new cannonworker in afterNextRender
		// - so inputs are resolved
		// - so the worker is instantiated only once
		// - effects are started after worker is instantiated
		afterNextRender(() => {
			this.cannonWorker.set(new CannonWorkerAPI(this.options()));

			effect(
				(onCleanup) => {
					const cleanup = this.connectWorkerEffect();
					onCleanup(() => cleanup?.());
				},
				{ injector },
			);

			effect(
				() => {
					this.updateWorkerStateEffect('axisIndex', this.axisIndex);
					this.updateWorkerStateEffect('broadphase', this.broadphase);
					this.updateWorkerStateEffect('gravity', this.gravity);
					this.updateWorkerStateEffect('iterations', this.iterations);
					this.updateWorkerStateEffect('tolerance', this.tolerance);
				},
				{ injector },
			);
		});

		let timeSinceLastCalled = 0;
		injectBeforeRender(({ delta }) => {
			const [{ isPaused, maxSubSteps, stepSize }, worker] = [this.options(), this.cannonWorker()];
			if (isPaused || !worker || stepSize == null) return;
			timeSinceLastCalled += delta;
			worker.step({ maxSubSteps, stepSize, timeSinceLastCalled });
			timeSinceLastCalled = 0;
		});
	}

	private connectWorkerEffect() {
		const worker = this.cannonWorker() as NgtcCannonWorker;
		if (!worker) return;

		worker.connect();
		worker.init();

		worker.on('collide', this.collideHandler.bind(this));
		worker.on('collideBegin', this.collideBeginHandler.bind(this));
		worker.on('collideEnd', this.collideEndHandler.bind(this));
		worker.on('frame', this.frameHandler.bind(this));
		worker.on('rayhit', this.rayhitHandler.bind(this));

		return () => {
			worker.terminate();
			worker.removeAllListeners();
		};
	}

	private updateWorkerStateEffect<TUpdatableKey extends NgtsPhysicsUpdatableOptions>(
		key: TUpdatableKey,
		option: () => NgtcPhysicsOptions[TUpdatableKey],
	) {
		const worker = this.cannonWorker();
		if (!worker) return;
		Object.assign(worker, { [key]: option() });
	}

	private collideHandler({ body, contact: { bi, bj, ...contactRest }, target, ...rest }: WorkerCollideEvent['data']) {
		const { events, refs } = this;
		const cb = events[target]?.collide;
		if (cb) {
			cb({ body: refs[body], contact: { bi: refs[bi], bj: refs[bj], ...contactRest }, target: refs[target], ...rest });
		}
	}

	private collideBeginHandler({ bodyA, bodyB }: WorkerCollideBeginEvent['data']) {
		const { events, refs } = this;
		const cbA = events[bodyA]?.collideBegin;
		if (cbA) cbA({ body: refs[bodyB], op: 'event', target: refs[bodyA], type: 'collideBegin' });
		const cbB = events[bodyB]?.collideBegin;
		if (cbB) cbB({ body: refs[bodyA], op: 'event', target: refs[bodyB], type: 'collideBegin' });
	}

	private collideEndHandler({ bodyA, bodyB }: WorkerCollideEndEvent['data']) {
		const { events, refs } = this;
		const cbA = events[bodyA]?.collideEnd;
		if (cbA) cbA({ body: refs[bodyB], op: 'event', target: refs[bodyA], type: 'collideEnd' });
		const cbB = events[bodyB]?.collideEnd;
		if (cbB) cbB({ body: refs[bodyA], op: 'event', target: refs[bodyB], type: 'collideEnd' });
	}

	private frameHandler({
		active,
		bodies: uuids = [],
		observations,
		positions,
		quaternions,
	}: WorkerFrameMessage['data']) {
		const [{ shouldInvalidate }, { bodies, subscriptions, refs, scaleOverrides }, invalidate] = [
			untracked(this.options),
			this,
			this.invalidate(),
		];
		for (let i = 0; i < uuids.length; i++) {
			bodies[uuids[i]] = i;
		}
		observations.forEach(([id, value, type]) => {
			const subscription = subscriptions[id] || {};
			const cb = subscription[type];
			// @ts-expect-error - We clearly know the type of the callback, but typescript can't deal with it
			cb && cb(value);
		});
		if (!active) return;
		for (const ref of Object.values(refs).filter(unique())) {
			if (ref instanceof InstancedMesh) {
				for (let i = 0; i < ref.count; i++) {
					const uuid = `${ref.uuid}/${i}`;
					const index = bodies[uuid];
					if (index !== undefined) {
						ref.setMatrixAt(i, apply(index, positions, quaternions, scaleOverrides[uuid]));
						ref.instanceMatrix.needsUpdate = true;
					}
				}
			} else {
				const scale = scaleOverrides[ref.uuid] || ref.scale;
				apply(bodies[ref.uuid], positions, quaternions, scale, ref);
			}
		}
		if (shouldInvalidate) invalidate();
	}

	private rayhitHandler({ body, ray: { uuid, ...rayRest }, ...rest }: WorkerRayhitEvent['data']) {
		const { events, refs } = this;
		const cb = events[uuid]?.rayhit;
		if (cb) cb({ body: body ? refs[body] : null, ray: { uuid, ...rayRest }, ...rest });
	}
}
