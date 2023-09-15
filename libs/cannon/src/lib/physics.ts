import { Component, Injector, Input, NgZone, effect, forwardRef, inject, untracked, type OnInit } from '@angular/core';
import {
	CannonWorkerAPI,
	type Broadphase,
	type CannonWorkerProps,
	type CollideBeginEvent,
	type CollideEndEvent,
	type CollideEvent,
	type ContactMaterialOptions,
	type RayhitEvent,
	type Refs,
	type Solver,
	type Subscriptions,
	type Triplet,
	type WorkerCollideBeginEvent,
	type WorkerCollideEndEvent,
	type WorkerCollideEvent,
	type WorkerFrameMessage,
	type WorkerRayhitEvent,
} from '@pmndrs/cannon-worker-api';
import { injectBeforeRender, injectNgtStore, signalStore } from 'angular-three';
import { createInjectionToken } from 'ngxtension/create-injection-token';
import * as THREE from 'three';

const v = new THREE.Vector3();
const s = new THREE.Vector3(1, 1, 1);
const q = new THREE.Quaternion();
const m = new THREE.Matrix4();

function apply(index: number, positions: Float32Array, quaternions: Float32Array, scale = s, object?: THREE.Object3D) {
	if (index !== undefined) {
		m.compose(v.fromArray(positions, index * 3), q.fromArray(quaternions, index * 4), scale);
		if (object) {
			object.matrixAutoUpdate = false;
			object.matrix.copy(m);
		}
		return m;
	}
	return m.identity();
}

const unique = () => {
	const values: unknown[] = [];
	return (value: unknown) => (values.includes(value) ? false : !!values.push(value));
};

export type NgtcPhysicsState = CannonWorkerProps & {
	isPaused?: boolean;
	maxSubSteps?: number;
	shouldInvalidate?: boolean;
	stepSize?: number;
};

type NgtcCannonEvent = CollideBeginEvent | CollideEndEvent | CollideEvent | RayhitEvent;
type NgtcCallbackByType<T extends { type: string }> = {
	[K in T['type']]?: T extends { type: K } ? (e: T) => void : never;
};

export type NgtcCannonEvents = { [uuid: string]: Partial<NgtcCallbackByType<NgtcCannonEvent>> };

export type ScaleOverrides = { [uuid: string]: THREE.Vector3 };

export type NgtcPhysicsApi = {
	bodies: { [uuid: string]: number };
	events: NgtcCannonEvents;
	refs: Refs;
	scaleOverrides: ScaleOverrides;
	subscriptions: Subscriptions;
	worker: CannonWorkerAPI;
};

export const [injectNgtcPhysicsApi, provideNgtcPhysicsApi] = createInjectionToken(
	(physics: NgtcPhysics) => physics.api,
	{ isRoot: false, deps: [forwardRef(() => NgtcPhysics)] },
);

@Component({
	selector: 'ngtc-physics',
	standalone: true,
	template: `
		<ng-content />
	`,
	providers: [provideNgtcPhysicsApi()],
})
export class NgtcPhysics implements OnInit {
	private inputs = signalStore<NgtcPhysicsState>({
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
	});

	@Input({ alias: 'isPaused' }) set _isPaused(isPaused: boolean) {
		this.inputs.set({ isPaused });
	}

	@Input({ alias: 'maxSubSteps' }) set _maxSubSteps(maxSubSteps: number) {
		this.inputs.set({ maxSubSteps });
	}

	@Input({ alias: 'shouldInvalidate' }) set _shouldInvalidate(shouldInvalidate: boolean) {
		this.inputs.set({ shouldInvalidate });
	}

	@Input({ alias: 'stepSize' }) set _stepSize(stepSize: number) {
		this.inputs.set({ stepSize });
	}

	@Input({ alias: 'size' }) set _size(size: number) {
		this.inputs.set({ size });
	}

	@Input({ alias: 'allowSleep' }) set _allowSleep(allowSleep: boolean) {
		this.inputs.set({ allowSleep });
	}

	@Input({ alias: 'axisIndex' }) set _axisIndex(axisIndex: 0 | 1 | 2) {
		this.inputs.set({ axisIndex });
	}

	@Input({ alias: 'broadphase' }) set _broadphase(broadphase: Broadphase) {
		this.inputs.set({ broadphase });
	}

	@Input({ alias: 'defaultContactMaterial' }) set _defaultContactMaterial(
		defaultContactMaterial: ContactMaterialOptions,
	) {
		this.inputs.set({ defaultContactMaterial });
	}

	@Input({ alias: 'frictionGravity' }) set _frictionGravity(frictionGravity: Triplet | null) {
		this.inputs.set({ frictionGravity });
	}

	@Input({ alias: 'gravity' }) set _gravity(gravity: Triplet) {
		this.inputs.set({ gravity });
	}

	@Input({ alias: 'iterations' }) set _iterations(iterations: number) {
		this.inputs.set({ iterations });
	}

	@Input({ alias: 'quatNormalizeFast' }) set _quatNormalizeFast(quatNormalizeFast: boolean) {
		this.inputs.set({ quatNormalizeFast });
	}

	@Input({ alias: 'quatNormalizeSkip' }) set _quatNormalizeSkip(quatNormalizeSkip: number) {
		this.inputs.set({ quatNormalizeSkip });
	}

	@Input({ alias: 'solver' }) set _solver(solver: Solver) {
		this.inputs.set({ solver });
	}

	@Input({ alias: 'tolerance' }) set _tolerance(tolerance: number) {
		this.inputs.set({ tolerance });
	}

	private zone = inject(NgZone);
	private injector = inject(Injector);

	private store = injectNgtStore();
	private invalidate = this.store.select('invalidate');

	api = signalStore<NgtcPhysicsApi>({
		bodies: {},
		events: {},
		refs: {},
		scaleOverrides: {},
		subscriptions: {},
		worker: null!,
	});

	private worker = this.api.select('worker');

	ngOnInit() {
		this.zone.runOutsideAngular(() => {
			this.api.set({ worker: new CannonWorkerAPI(this.inputs.state()) });
			this.connectWorker();
			this.updateWorkerState('axisIndex');
			this.updateWorkerState('broadphase');
			this.updateWorkerState('gravity');
			this.updateWorkerState('iterations');
			this.updateWorkerState('tolerance');
			this.beforeRender();
		});
	}

	private connectWorker() {
		effect(
			(onCleanup) => {
				const worker = this.worker();
				if (!worker) return;

				worker.connect();
				worker.init();

				(worker as any).on('collide', this.collideHandler.bind(this));
				(worker as any).on('collideBegin', this.collideBeginHandler.bind(this));
				(worker as any).on('collideEnd', this.collideEndHandler.bind(this));
				(worker as any).on('frame', this.frameHandler.bind(this));
				(worker as any).on('rayhit', this.rayhitHandler.bind(this));

				onCleanup(() => {
					worker.terminate();
					(worker as any).removeAllListeners();
				});
			},
			{ injector: this.injector },
		);
	}

	private updateWorkerState(key: keyof NgtcPhysicsState) {
		const compute = this.inputs.select(key);
		effect(
			() => {
				const [worker, value] = [untracked(this.worker), compute()];
				// @ts-expect-error
				worker[key] = value;
			},
			{ injector: this.injector },
		);
	}

	private collideHandler({ body, contact: { bi, bj, ...contactRest }, target, ...rest }: WorkerCollideEvent['data']) {
		const { events, refs } = this.api.get();
		const cb = events[target]?.collide;

		if (cb) {
			cb({
				body: refs[body],
				contact: { bi: refs[bi], bj: refs[bj], ...contactRest },
				target: refs[target],
				...rest,
			});
		}
	}

	private collideBeginHandler({ bodyA, bodyB }: WorkerCollideBeginEvent['data']) {
		const { events, refs } = this.api.get();
		const cbA = events[bodyA]?.collideBegin;
		if (cbA) cbA({ body: refs[bodyB], op: 'event', target: refs[bodyA], type: 'collideBegin' });
		const cbB = events[bodyB]?.collideBegin;
		if (cbB) cbB({ body: refs[bodyA], op: 'event', target: refs[bodyB], type: 'collideBegin' });
	}

	private collideEndHandler({ bodyA, bodyB }: WorkerCollideEndEvent['data']) {
		const { events, refs } = this.api.get();
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
			this.inputs.get(),
			this.api.get(),
			this.invalidate(),
		];

		for (let i = 0; i < uuids.length; i++) {
			bodies[uuids[i]] = i;
		}

		observations.forEach(([id, value, type]) => {
			const subscription = subscriptions[id] || {};
			const cb = subscription[type];
			// HELP: We clearly know the type of the callback, but typescript can't deal with it
			cb && cb(value as never);
		});

		if (!active) return;

		for (const ref of Object.values(refs).filter(unique())) {
			if (ref instanceof THREE.InstancedMesh) {
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
		const { events, refs } = this.api.get();
		const cb = events[uuid]?.rayhit;
		if (cb) cb({ body: body ? refs[body] : null, ray: { uuid, ...rayRest }, ...rest });
	}

	private beforeRender() {
		let timeSinceLastCalled = 0;
		injectBeforeRender(
			({ delta }) => {
				const [{ isPaused, maxSubSteps, stepSize }, worker] = [this.inputs.get(), this.worker()];
				if (isPaused || !worker) return;
				timeSinceLastCalled += delta;
				worker.step({ maxSubSteps, stepSize: stepSize!, timeSinceLastCalled });
				timeSinceLastCalled = 0;
			},
			{ injector: this.injector },
		);
	}
}
