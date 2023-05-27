import { Component, InjectionToken, Input, computed, effect, inject, untracked, type Signal } from '@angular/core';
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
import {
    NgtSignalStore,
    NgtStore,
    injectBeforeRender,
    requestAnimationFrameInInjectionContext,
    type NgtRenderState,
} from 'angular-three';
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

export interface NgtcPhysicsApi {
    bodies: { [uuid: string]: number };
    events: NgtcCannonEvents;
    refs: Refs;
    scaleOverrides: ScaleOverrides;
    subscriptions: Subscriptions;
    worker: Signal<CannonWorkerAPI>;
}

export const NGTC_PHYSICS_API = new InjectionToken<Signal<NgtcPhysicsApi>>('NgtcPhysics API');

@Component({
    selector: 'ngtc-physics',
    standalone: true,
    template: `<ng-content />`,
    providers: [{ provide: NGTC_PHYSICS_API, useFactory: (physics: NgtcPhysics) => physics.api, deps: [NgtcPhysics] }],
})
export class NgtcPhysics extends NgtSignalStore<NgtcPhysicsState> {
    @Input() set isPaused(isPaused: boolean) {
        this.set({ isPaused });
    }

    @Input() set maxSubSteps(maxSubSteps: number) {
        this.set({ maxSubSteps });
    }

    @Input() set shouldInvalidate(shouldInvalidate: boolean) {
        this.set({ shouldInvalidate });
    }

    @Input() set stepSize(stepSize: number) {
        this.set({ stepSize });
    }

    @Input() set size(size: number) {
        this.set({ size });
    }

    @Input() set allowSleep(allowSleep: boolean) {
        this.set({ allowSleep });
    }

    @Input() set axisIndex(axisIndex: 0 | 1 | 2) {
        this.set({ axisIndex });
    }

    @Input() set broadphase(broadphase: Broadphase) {
        this.set({ broadphase });
    }

    @Input() set defaultContactMaterial(defaultContactMaterial: ContactMaterialOptions) {
        this.set({ defaultContactMaterial });
    }

    @Input() set frictionGravity(frictionGravity: Triplet | null) {
        this.set({ frictionGravity });
    }

    @Input() set gravity(gravity: Triplet) {
        this.set({ gravity });
    }

    @Input() set iterations(iterations: number) {
        this.set({ iterations });
    }

    @Input() set quatNormalizeFast(quatNormalizeFast: boolean) {
        this.set({ quatNormalizeFast });
    }

    @Input() set quatNormalizeSkip(quatNormalizeSkip: number) {
        this.set({ quatNormalizeSkip });
    }

    @Input() set solver(solver: Solver) {
        this.set({ solver });
    }

    @Input() set tolerance(tolerance: number) {
        this.set({ tolerance });
    }

    readonly #store = inject(NgtStore);

    readonly #bodies: { [uuid: string]: number } = {};
    readonly #events: NgtcCannonEvents = {};
    readonly #refs: Refs = {};
    readonly #scaleOverrides: ScaleOverrides = {};
    readonly #subscriptions: Subscriptions = {};

    readonly #allowSleep = this.select('allowSleep');
    readonly #defaultContactMaterial = this.select('defaultContactMaterial');
    readonly #frictionGravity = this.select('frictionGravity');
    readonly #quatNormalizeFast = this.select('quatNormalizeFast');
    readonly #quatNormalizeSkip = this.select('quatNormalizeSkip');
    readonly #size = this.select('size');
    readonly #solver = this.select('solver');

    readonly #workerProps = computed(() => ({
        allowSleep: this.#allowSleep(),
        axisIndex: this.get('axisIndex'),
        broadphase: this.get('broadphase'),
        defaultContactMaterial: this.#defaultContactMaterial(),
        frictionGravity: this.#frictionGravity(),
        gravity: this.get('gravity'),
        iterations: this.get('iterations'),
        quatNormalizeFast: this.#quatNormalizeFast(),
        quatNormalizeSkip: this.#quatNormalizeSkip(),
        size: this.#size(),
        solver: this.#solver(),
        tolerance: this.get('tolerance'),
    }));

    readonly worker = computed(() => new CannonWorkerAPI(this.#workerProps()));

    readonly api = computed(() => ({
        bodies: this.#bodies,
        events: this.#events,
        refs: this.#refs,
        scaleOverrides: this.#scaleOverrides,
        subscriptions: this.#subscriptions,
        worker: this.worker,
    }));

    constructor() {
        super({
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
        requestAnimationFrameInInjectionContext(() => {
            this.#connectWorker();
            this.#updateWorkerProp('axisIndex');
            this.#updateWorkerProp('broadphase');
            this.#updateWorkerProp('gravity');
            this.#updateWorkerProp('iterations');
            this.#updateWorkerProp('tolerance');
            injectBeforeRender(this.#onBeforeRender.bind(this, 0));
        });
    }

    #updateWorkerProp(key: keyof NgtcPhysicsState) {
        const compute = this.select(key);
        effect(() => {
            const worker = untracked(this.worker);
            const value = compute();
            // @ts-expect-error
            worker[key] = value;
        });
    }

    #connectWorker() {
        effect((onCleanup) => {
            const worker = this.worker();

            worker.connect();
            worker.init();

            (worker as any).on('collide', this.#collideHandler.bind(this));
            (worker as any).on('collideBegin', this.#collideBeginHandler.bind(this));
            (worker as any).on('collideEnd', this.#collideEndHandler.bind(this));
            (worker as any).on('frame', this.#frameHandler.bind(this));
            (worker as any).on('rayhit', this.#rayhitHandler.bind(this));

            onCleanup(() => {
                worker.terminate();
                (worker as any).removeAllListeners();
            });
        });
    }

    #onBeforeRender(timeSinceLastCalled: number, { delta }: NgtRenderState) {
        const { isPaused, maxSubSteps, stepSize } = this.get();
        const worker = this.worker();
        if (isPaused) return;
        timeSinceLastCalled += delta;
        worker.step({ maxSubSteps, stepSize: stepSize!, timeSinceLastCalled });
        timeSinceLastCalled = 0;
    }

    #collideHandler({ body, contact: { bi, bj, ...contactRest }, target, ...rest }: WorkerCollideEvent['data']) {
        const cb = this.#events[target]?.collide;

        if (cb) {
            cb({
                body: this.#refs[body],
                contact: { bi: this.#refs[bi], bj: this.#refs[bj], ...contactRest },
                target: this.#refs[target],
                ...rest,
            });
        }
    }

    #collideBeginHandler({ bodyA, bodyB }: WorkerCollideBeginEvent['data']) {
        const cbA = this.#events[bodyA]?.collideBegin;
        if (cbA) cbA({ body: this.#refs[bodyB], op: 'event', target: this.#refs[bodyA], type: 'collideBegin' });
        const cbB = this.#events[bodyB]?.collideBegin;
        if (cbB) cbB({ body: this.#refs[bodyA], op: 'event', target: this.#refs[bodyB], type: 'collideBegin' });
    }

    #collideEndHandler({ bodyA, bodyB }: WorkerCollideEndEvent['data']) {
        const cbA = this.#events[bodyA]?.collideEnd;
        if (cbA) cbA({ body: this.#refs[bodyB], op: 'event', target: this.#refs[bodyA], type: 'collideEnd' });
        const cbB = this.#events[bodyB]?.collideEnd;
        if (cbB) cbB({ body: this.#refs[bodyA], op: 'event', target: this.#refs[bodyB], type: 'collideEnd' });
    }

    #frameHandler({ active, bodies: uuids = [], observations, positions, quaternions }: WorkerFrameMessage['data']) {
        const invalidate = this.#store.get('invalidate');
        const shouldInvalidate = this.get('shouldInvalidate');

        for (let i = 0; i < uuids.length; i++) {
            this.#bodies[uuids[i]] = i;
        }

        observations.forEach(([id, value, type]) => {
            const subscription = this.#subscriptions[id] || {};
            const cb = subscription[type];
            // HELP: We clearly know the type of the callback, but typescript can't deal with it
            cb && cb(value as never);
        });

        if (active) {
            for (const ref of Object.values(this.#refs)) {
                if (ref instanceof THREE.InstancedMesh) {
                    for (let i = 0; i < ref.count; i++) {
                        const uuid = `${ref.uuid}/${i}`;
                        const index = this.#bodies[uuid];
                        if (index !== undefined) {
                            ref.setMatrixAt(i, apply(index, positions, quaternions, this.#scaleOverrides[uuid]));
                            ref.instanceMatrix.needsUpdate = true;
                        }
                    }
                } else {
                    const scale = this.#scaleOverrides[ref.uuid] || ref.scale;
                    apply(this.#bodies[ref.uuid], positions, quaternions, scale, ref);
                }
            }
            if (shouldInvalidate) invalidate();
        }
    }

    #rayhitHandler({ body, ray: { uuid, ...rayRest }, ...rest }: WorkerRayhitEvent['data']) {
        const cb = this.#events[uuid]?.rayhit;
        if (cb) cb({ body: body ? this.#refs[body] : null, ray: { uuid, ...rayRest }, ...rest });
    }
}
