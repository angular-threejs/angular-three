import { NgIf } from '@angular/common';
import {
    Component,
    ContentChild,
    DestroyRef,
    Directive,
    EventEmitter,
    Injector,
    Input,
    NgZone,
    Output,
    SkipSelf,
    TemplateRef,
    ViewChild,
    ViewContainerRef,
    effect,
    inject,
    type ElementRef,
    type EmbeddedViewRef,
    type OnInit,
} from '@angular/core';
import * as THREE from 'three';
import { injectBeforeRender } from './di/before-render';
import { injectNgtRef } from './di/ref';
import { SPECIAL_INTERNAL_ADD_COMMENT } from './renderer/utils';
import { NgtSignalStore } from './stores/signal.store';
import { NgtStore } from './stores/store';
import type { NgtEventManager, NgtRenderState, NgtSize, NgtState } from './types';
import { getLocalState, prepare } from './utils/instance';
import { is } from './utils/is';
import { safeDetectChanges } from './utils/safe-detect-changes';
import { queueMicrotaskInInjectionContext } from './utils/timing';
import { updateCamera } from './utils/update';

const privateKeys = [
    'get',
    'set',
    'select',
    'setSize',
    'setDpr',
    'setFrameloop',
    'events',
    'invalidate',
    'advance',
    'size',
    'viewport',
] as const;
type PrivateKeys = (typeof privateKeys)[number];

export interface NgtPortalInputs {
    container: ElementRef<THREE.Object3D> | THREE.Object3D;
    camera: ElementRef<THREE.Camera> | THREE.Camera;
    state: Partial<
        Omit<NgtState, PrivateKeys> & {
            events: Partial<Pick<NgtEventManager<any>, 'enabled' | 'priority' | 'compute' | 'connected'>>;
            size: NgtSize;
        }
    >;
}

@Directive({ selector: '[ngtPortalBeforeRender]', standalone: true })
export class NgtPortalBeforeRender {
    readonly #portalStore = inject(NgtStore);

    @Input() renderPriority = 1;
    @Input({ required: true }) parentScene!: THREE.Scene;
    @Input({ required: true }) parentCamera!: THREE.Camera;

    @Output() beforeRender = new EventEmitter<NgtRenderState>();

    constructor() {
        let oldClear: boolean;
        queueMicrotaskInInjectionContext(() => {
            injectBeforeRender(
                ({ delta, frame }) => {
                    this.beforeRender.emit({ ...this.#portalStore.get(), delta, frame });
                    const { gl, scene, camera } = this.#portalStore.get();
                    oldClear = gl.autoClear;
                    if (this.renderPriority === 1) {
                        // clear scene and render with default
                        gl.autoClear = true;
                        gl.render(this.parentScene, this.parentCamera);
                    }
                    // disable cleaning
                    gl.autoClear = false;
                    gl.clearDepth();
                    gl.render(scene, camera);
                    // restore
                    gl.autoClear = oldClear;
                },
                { priority: this.renderPriority }
            );
        });
    }
}

@Directive({ selector: 'ng-template[ngtPortalContent]', standalone: true })
export class NgtPortalContent {
    constructor(vcr: ViewContainerRef, @SkipSelf() parentVcr: ViewContainerRef) {
        const commentNode = vcr.element.nativeElement;
        if (commentNode[SPECIAL_INTERNAL_ADD_COMMENT]) {
            commentNode[SPECIAL_INTERNAL_ADD_COMMENT](parentVcr.element.nativeElement);
            delete commentNode[SPECIAL_INTERNAL_ADD_COMMENT];
        }
    }
}

@Component({
    selector: 'ngt-portal',
    standalone: true,
    template: `
        <ng-container #portalContentAnchor>
            <ng-container
                *ngIf="autoRender && portalContentRendered"
                ngtPortalBeforeRender
                [renderPriority]="autoRenderPriority"
                [parentScene]="parentScene"
                [parentCamera]="parentCamera"
                (beforeRender)="onBeforeRender($event)"
            />
        </ng-container>
    `,
    imports: [NgIf, NgtPortalBeforeRender],
    providers: [NgtStore],
})
export class NgtPortal extends NgtSignalStore<NgtPortalInputs> implements OnInit {
    @Input() set container(container: NgtPortalInputs['container']) {
        this.set({ container });
    }

    @Input() set portalState(state: NgtPortalInputs['state']) {
        this.set({ state });
    }

    @Input() autoRender = true;
    @Input() autoRenderPriority = 1;

    @Output() beforeRender = new EventEmitter<{ root: NgtRenderState; portal: NgtRenderState }>();

    @ContentChild(NgtPortalContent, { read: TemplateRef, static: true })
    readonly portalContentTemplate!: TemplateRef<unknown>;

    @ViewChild('portalContentAnchor', { read: ViewContainerRef, static: true })
    readonly portalContentAnchor!: ViewContainerRef;

    readonly #parentStore = inject(NgtStore, { skipSelf: true });
    readonly parentScene = this.#parentStore.get('scene');
    readonly parentCamera = this.#parentStore.get('camera');

    readonly #portalStore = inject(NgtStore, { self: true });
    readonly #injector = inject(Injector);
    readonly #zone = inject(NgZone);

    readonly #raycaster = new THREE.Raycaster();
    readonly #pointer = new THREE.Vector2();

    portalContentRendered = false;
    #portalContentView?: EmbeddedViewRef<unknown>;

    constructor() {
        super({ container: injectNgtRef<THREE.Scene>(prepare(new THREE.Scene())) });
        inject(DestroyRef).onDestroy(() => {
            if (this.#portalContentView && !this.#portalContentView.destroyed) {
                this.#portalContentView.destroy();
            }
        });
    }

    ngOnInit() {
        const previousState = this.#parentStore.get();
        const inputsState = this.get();

        if (!inputsState.state && this.autoRender) {
            inputsState.state = { events: { priority: this.autoRenderPriority + 1 } };
        }

        const { events, size, ...restInputsState } = inputsState.state || {};

        const containerState = inputsState.container;
        const container = is.ref(containerState) ? containerState.nativeElement : containerState;

        const localState = getLocalState(container);
        if (!localState.store) {
            localState.store = this.#portalStore;
        }

        this.#portalStore.set({
            ...previousState,
            scene: container as THREE.Scene,
            raycaster: this.#raycaster,
            pointer: this.#pointer,
            previousStore: this.#parentStore,
            events: { ...previousState.events, ...(events || {}) },
            size: { ...previousState.size, ...(size || {}) },
            ...restInputsState,
            get: this.#portalStore.get.bind(this.#portalStore),
            set: this.#portalStore.set.bind(this.#portalStore),
            setEvents: (events) =>
                this.#portalStore.set((state) => ({ ...state, events: { ...state.events, ...events } })),
        });

        const parentState = this.#parentStore.select();
        effect(
            () => {
                const previous = parentState();
                this.#zone.runOutsideAngular(() => {
                    this.#portalStore.set((state) => this.#inject(previous, state));
                });
            },
            { injector: this.#injector, allowSignalWrites: true }
        );

        requestAnimationFrame(() => {
            this.#portalStore.set((injectState) => this.#inject(this.#parentStore.get(), injectState));
        });
        this.#portalContentView = this.portalContentAnchor.createEmbeddedView(this.portalContentTemplate);
        safeDetectChanges(this.#portalContentView);
        this.portalContentRendered = true;
    }

    onBeforeRender(portal: NgtRenderState) {
        this.beforeRender.emit({
            root: { ...this.#parentStore.get(), delta: portal.delta, frame: portal.frame },
            portal,
        });
    }

    #inject(rootState: NgtState, injectState: NgtState) {
        const intersect: Partial<NgtState> = { ...rootState };

        Object.keys(intersect).forEach((key) => {
            if (
                privateKeys.includes(key as PrivateKeys) ||
                rootState[key as keyof NgtState] !== injectState[key as keyof NgtState]
            ) {
                delete intersect[key as keyof NgtState];
            }
        });

        const inputs = this.get();
        const { size, events, ...restInputsState } = inputs.state || {};

        let viewport = undefined;
        if (injectState && size) {
            const camera = injectState.camera;
            viewport = rootState.viewport.getCurrentViewport(camera, new THREE.Vector3(), size);
            if (camera !== rootState.camera) updateCamera(camera, size);
        }

        return {
            ...intersect,
            scene: is.ref(inputs.container) ? inputs.container.nativeElement : inputs.container,
            raycaster: this.#raycaster,
            pointer: this.#pointer,
            previousStore: this.#parentStore,
            events: { ...rootState.events, ...(injectState?.events || {}), ...events },
            size: { ...rootState.size, ...size },
            viewport: { ...rootState.viewport, ...(viewport || {}) },
            ...restInputsState,
        } as NgtState;
    }
}
