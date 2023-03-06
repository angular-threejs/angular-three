import { NgIf } from '@angular/common';
import {
    Component,
    ContentChild,
    Directive,
    ElementRef,
    EmbeddedViewRef,
    EventEmitter,
    inject,
    Input,
    OnDestroy,
    OnInit,
    Output,
    SkipSelf,
    TemplateRef,
    ViewChild,
    ViewContainerRef,
} from '@angular/core';
import * as THREE from 'three';
import { injectNgtRef } from './di/ref';
import { NgtRxStore } from './stores/rx-store';
import { NgtStore } from './stores/store';
import { NgtEventManager, NgtRenderState, NgtSize, NgtState } from './types';
import { getLocalState, prepare } from './utils/instance';
import { is } from './utils/is';
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
    'addInteraction',
    'removeInteraction',
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

@Directive({
    selector: 'ngt-portal-before-render',
    standalone: true,
})
export class NgtPortalBeforeRender implements OnInit, OnDestroy {
    private readonly portalStore = inject(NgtStore);

    @Input() renderPriority = 1;
    @Input() parentScene!: THREE.Scene;
    @Input() parentCamera!: THREE.Camera;

    @Output() beforeRender = new EventEmitter<NgtRenderState>();

    private subscription?: () => void;

    ngOnInit() {
        let oldClear: boolean;
        this.subscription = this.portalStore.get('internal').subscribe(
            ({ delta, frame }) => {
                this.beforeRender.emit({ ...this.portalStore.get(), delta, frame });
                const { gl, scene, camera } = this.portalStore.get();
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
            this.renderPriority,
            this.portalStore
        );
    }

    ngOnDestroy() {
        this.subscription?.();
    }
}

@Directive({ selector: 'ng-template[ngtPortalContent]', standalone: true })
export class NgtPortalContent {
    constructor(vcr: ViewContainerRef, @SkipSelf() parentVcr: ViewContainerRef) {
        const commentNode = vcr.element.nativeElement;
        if (commentNode['__ngt_renderer_add_comment__']) {
            commentNode['__ngt_renderer_add_comment__'](parentVcr.element.nativeElement);
            delete commentNode['__ngt_renderer_add_comment__'];
        }
    }
}

@Component({
    selector: 'ngt-portal',
    standalone: true,
    template: `
        <ng-container #portalContentAnchor>
            <ngt-portal-before-render
                *ngIf="autoRender && portalContentRendered"
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
export class NgtPortal extends NgtRxStore<NgtPortalInputs> implements OnInit, OnDestroy {
    @Input() set container(container: NgtPortalInputs['container']) {
        this.set({ container });
    }

    @Input() set state(state: NgtPortalInputs['state']) {
        this.set({ state });
    }

    @Input() autoRender = true;
    @Input() autoRenderPriority = 1;

    @Output() beforeRender = new EventEmitter<{ root: NgtRenderState; portal: NgtRenderState }>();

    @ContentChild(NgtPortalContent, { read: TemplateRef, static: true })
    readonly portalContentTemplate!: TemplateRef<unknown>;

    @ViewChild('portalContentAnchor', { read: ViewContainerRef, static: true })
    readonly portalContentAnchor!: ViewContainerRef;

    private readonly parentStore = inject(NgtStore, { skipSelf: true });
    readonly parentScene = this.parentStore.get('scene');
    readonly parentCamera = this.parentStore.get('camera');

    private readonly portalStore = inject(NgtStore, { self: true });

    private readonly raycaster = new THREE.Raycaster();
    private readonly pointer = new THREE.Vector2();

    portalContentRendered = false;
    private portalContentView?: EmbeddedViewRef<unknown>;

    override initialize() {
        super.initialize();
        this.set({ container: injectNgtRef<THREE.Scene>(prepare(new THREE.Scene())) });
    }

    ngOnInit() {
        const previousState = this.parentStore.get();
        const inputsState = this.get();

        if (!inputsState.state && this.autoRender) {
            inputsState.state = { events: { priority: this.autoRenderPriority + 1 } };
        }

        const { events, size, ...restInputsState } = inputsState.state || {};

        const containerState = inputsState.container;
        const container = is.ref(containerState) ? containerState.nativeElement : containerState;

        const localState = getLocalState(container);
        if (!localState.store) {
            localState.store = this.portalStore;
        }

        this.portalStore.set({
            ...previousState,
            scene: container as THREE.Scene,
            raycaster: this.raycaster,
            pointer: this.pointer,
            previousStore: this.parentStore,
            events: { ...previousState.events, ...(events || {}) },
            size: { ...previousState.size, ...(size || {}) },
            ...restInputsState,
            get: this.portalStore.get.bind(this.portalStore),
            set: this.portalStore.set.bind(this.portalStore),
            select: this.portalStore.select.bind(this.portalStore),
            setEvents: (events) =>
                this.portalStore.set((state) => ({ ...state, events: { ...state.events, ...events } })),
        });

        this.hold(this.parentStore.select(), (previous) =>
            this.portalStore.set((state) => this.inject(previous, state))
        );

        requestAnimationFrame(() => {
            this.portalStore.set((injectState) => this.inject(this.parentStore.get(), injectState));
        });
        this.portalContentView = this.portalContentAnchor.createEmbeddedView(this.portalContentTemplate);
        this.portalContentView.detectChanges();
        this.portalContentRendered = true;
    }

    onBeforeRender(portal: NgtRenderState) {
        this.beforeRender.emit({
            root: { ...this.parentStore.get(), delta: portal.delta, frame: portal.frame },
            portal,
        });
    }

    override ngOnDestroy() {
        if (this.portalContentView && !this.portalContentView.destroyed) {
            this.portalContentView.destroy();
        }
        super.ngOnDestroy();
    }

    private inject(rootState: NgtState, injectState: NgtState) {
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
            raycaster: this.raycaster,
            pointer: this.pointer,
            previousStore: this.parentStore,
            events: { ...rootState.events, ...(injectState?.events || {}), ...events },
            size: { ...rootState.size, ...size },
            viewport: { ...rootState.viewport, ...(viewport || {}) },
            ...restInputsState,
        } as NgtState;
    }
}
