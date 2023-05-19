import {
    Component,
    computed,
    CUSTOM_ELEMENTS_SCHEMA,
    inject,
    InjectionToken,
    Input,
    OnInit,
    Signal,
} from '@angular/core';
import { BodyProps, BodyShapeType, propsToBody } from '@pmndrs/cannon-worker-api';
import { injectBeforeRender, NgtArgs } from 'angular-three';
import { NGTC_PHYSICS_API } from 'angular-three-cannon';
import { Body, Quaternion as CQuarternion, Vec3, World } from 'cannon-es';
import CannonDebugger from 'cannon-es-debugger';
import * as THREE from 'three';

const q = new THREE.Quaternion();
const s = new THREE.Vector3(1, 1, 1);
const v = new THREE.Vector3();
const m = new THREE.Matrix4();

function getMatrix(o: THREE.Object3D): THREE.Matrix4 {
    if (o instanceof THREE.InstancedMesh) {
        o.getMatrixAt(parseInt(o.uuid.split('/')[1]), m);
        return m;
    }
    return o.matrix;
}

export interface NgtcDebugApi {
    add(id: string, props: BodyProps, type: BodyShapeType): void;
    remove(id: string): void;
}

export const NGTC_DEBUG_API = new InjectionToken<Signal<NgtcDebugApi>>('NgtcDebug API');

@Component({
    selector: 'ngtc-debug',
    standalone: true,
    template: `
        <ngt-primitive *args="[scene]" />
        <ng-content />
    `,
    providers: [{ provide: NGTC_DEBUG_API, useFactory: (debug: NgtcDebug) => debug.api, deps: [NgtcDebug] }],
    imports: [NgtArgs],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtcDebug implements OnInit {
    @Input() color = 'black';
    @Input() scale = 1;
    @Input() impl = CannonDebugger;
    @Input() disabled = false;

    readonly #bodies: Body[] = [];
    readonly #bodyMap: Record<string, Body> = {};
    readonly #scene = new THREE.Scene();

    readonly #physicsApi = inject(NGTC_PHYSICS_API);

    #cannonDebugger!: ReturnType<typeof CannonDebugger>;

    readonly api = computed(() => ({
        add: (uuid: string, props: BodyProps, type: BodyShapeType) => {
            const body = propsToBody({ uuid, props, type });
            this.#bodies.push(body);
            this.#bodyMap[uuid] = body;
        },
        remove: (id: string) => {
            const debugBodyIndex = this.#bodies.indexOf(this.#bodyMap[id]);
            if (debugBodyIndex > -1) this.#bodies.splice(debugBodyIndex, 1);
            delete this.#bodyMap[id];
        },
    }));

    constructor() {
        injectBeforeRender(() => {
            if (!this.#cannonDebugger) return;
            const refs = this.#physicsApi().refs;
            for (const uuid in this.#bodyMap) {
                getMatrix(refs[uuid]).decompose(v, q, s);
                this.#bodyMap[uuid].position.copy(v as unknown as Vec3);
                this.#bodyMap[uuid].quaternion.copy(q as unknown as CQuarternion);
            }

            for (const child of this.#scene.children) {
                child.visible = !this.disabled;
            }

            if (!this.disabled) {
                this.#cannonDebugger.update();
            }
        });
    }

    ngOnInit() {
        this.#cannonDebugger = this.impl(this.#scene, { bodies: this.#bodies } as World, {
            color: this.color,
            scale: this.scale,
        });
    }
}
