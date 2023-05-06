import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    DestroyRef,
    ElementRef,
    EnvironmentInjector,
    EventEmitter,
    Injector,
    Input,
    NgZone,
    Output,
    ViewChild,
    ViewContainerRef,
    createEnvironmentInjector,
    effect,
    inject,
    type ComponentRef,
    type OnChanges,
    type OnInit,
    type SimpleChanges,
    type Type,
} from '@angular/core';
import { NgxResize, provideNgxResizeOptions, type NgxResizeResult } from 'ngx-resize';
import { createPointerEvents } from './dom/events';
import { injectNgtLoader } from './loader';
import { provideNgtRenderer } from './renderer/provider';
import { NgtSignalStore } from './stores/signal.store';
import { NgtStore, rootStateMap } from './stores/store';
import type { NgtAnyRecord, NgtCanvasInputs, NgtDomEvent, NgtDpr, NgtState } from './types';
import { is } from './utils/is';
import { safeDetectChanges } from './utils/safe-detect-changes';

@Component({
    selector: 'ngt-canvas',
    standalone: true,
    template: `
        <div (ngxResize)="onResize($event)" style="height: 100%; width: 100%;">
            <canvas #glCanvas style="display: block;"> </canvas>
        </div>
    `,
    imports: [NgxResize],
    providers: [NgtStore, provideNgxResizeOptions({ emitInZone: false, emitInitialResult: true })],
    host: { style: 'display: block;position: relative;width: 100%;height: 100%;overflow: hidden;' },
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgtCanvas extends NgtSignalStore<NgtCanvasInputs> implements OnInit, OnChanges {
    readonly #envInjector = inject(EnvironmentInjector);
    readonly #injector = inject(Injector);
    readonly #host = inject(ElementRef) as ElementRef<HTMLElement>;
    readonly #zone = inject(NgZone);
    readonly #cdr = inject(ChangeDetectorRef);
    readonly #store = inject(NgtStore);

    readonly #isReady = this.#store.select('ready');

    @Input({ required: true }) sceneGraph!: Type<unknown>;
    @Input() sceneGraphInputs: NgtAnyRecord = {};
    @Input() compoundPrefixes: string[] = [];

    @Input() set linear(linear: boolean) {
        this.set({ linear });
    }

    @Input() set legacy(legacy: boolean) {
        this.set({ legacy });
    }

    @Input() set flat(flat: boolean) {
        this.set({ flat });
    }

    @Input() set orthographic(orthographic: boolean) {
        this.set({ orthographic });
    }

    @Input() set frameloop(frameloop: NgtCanvasInputs['frameloop']) {
        this.set({ frameloop });
    }

    @Input() set dpr(dpr: NgtDpr) {
        this.set({ dpr });
    }

    @Input() set raycaster(raycaster: Partial<THREE.Raycaster>) {
        this.set({ raycaster });
    }

    @Input() set shadows(shadows: boolean | Partial<THREE.WebGLShadowMap>) {
        this.set({ shadows });
    }

    @Input() set camera(camera: NgtCanvasInputs['camera']) {
        this.set({ camera });
    }

    @Input() set scene(scene: NgtCanvasInputs['scene']) {
        this.set({ scene });
    }

    @Input() set gl(gl: NgtCanvasInputs['gl']) {
        this.set({ gl });
    }

    @Input() set eventSource(eventSource: NgtCanvasInputs['eventSource']) {
        this.set({ eventSource });
    }

    @Input() set eventPrefix(eventPrefix: NgtCanvasInputs['eventPrefix']) {
        this.set({ eventPrefix });
    }

    @Input() set lookAt(lookAt: NgtCanvasInputs['lookAt']) {
        this.set({ lookAt });
    }

    @Input() set performance(performance: NgtCanvasInputs['performance']) {
        this.set({ performance });
    }

    @Output() created = new EventEmitter<NgtState>();
    @Output() pointerMissed = new EventEmitter<MouseEvent>();

    @ViewChild('glCanvas', { static: true }) glCanvas!: ElementRef<HTMLCanvasElement>;
    @ViewChild('glCanvas', { static: true, read: ViewContainerRef }) glAnchor!: ViewContainerRef;

    #glRef?: ComponentRef<unknown>;
    #glEnvInjector?: EnvironmentInjector;

    constructor() {
        super({
            shadows: false,
            linear: false,
            flat: false,
            legacy: false,
            orthographic: false,
            frameloop: 'always',
            dpr: [1, 2],
            events: createPointerEvents,
        });

        inject(DestroyRef).onDestroy(() => {
            if (this.#glRef) this.#glRef.destroy();
            if (this.#glEnvInjector) this.#glEnvInjector.destroy();
            injectNgtLoader.destroy();
            this.#store.destroy(this.glCanvas.nativeElement);
        });
    }

    get hbPointerEvents() {
        return this.select('eventSource')() !== this.#host.nativeElement ? 'none' : 'auto';
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['sceneGraphInputs'] && !changes['sceneGraphInputs'].firstChange && this.#glRef) {
            this.#setSceneGraphInputs();
        }
    }

    ngOnInit(): void {
        if (!this.get('eventSource')) {
            // set default event source to the host element
            this.set({ eventSource: this.#host.nativeElement });
        }

        if (this.pointerMissed.observed) {
            this.#store.set({
                onPointerMissed: (event: MouseEvent) => {
                    this.pointerMissed.emit(event);
                },
            });
        }

        // setup NgtStore
        this.#store.init();

        // set rootStateMap
        rootStateMap.set(this.glCanvas.nativeElement, this.#store);

        // subscribe to store to listen for ready state
        effect(
            () => {
                this.#zone.runOutsideAngular(() => {
                    if (this.#isReady()) this.#storeReady();
                });
            },
            { injector: this.#injector, allowSignalWrites: true }
        );
    }

    #resizeRef?: ReturnType<typeof effect>;
    // NOTE: this is invoked outside of Angular Zone
    onResize({ width, height, top, left }: NgxResizeResult) {
        // destroy previous effect
        if (this.#resizeRef) {
            this.#resizeRef.destroy();
        }

        if (width > 0 && height > 0) {
            if (!this.#store.isInit) this.#store.init();
            const inputs = this.select();
            this.#resizeRef = this.#zone.run(() =>
                effect(
                    () => {
                        const canvasInputs = inputs();
                        this.#zone.runOutsideAngular(() => {
                            this.#store.configure(
                                { ...canvasInputs, size: { width, height, top, left } },
                                this.glCanvas.nativeElement
                            );
                        });
                    },
                    { injector: this.#injector, manualCleanup: true, allowSignalWrites: true }
                )
            );
        }
    }

    // NOTE: This is invoked outside of Angular Zone
    #storeReady() {
        // canvas is ready, let's activate the loop
        this.#store.set((state) => ({ internal: { ...state.internal, active: true } }));

        const inputs = this.get();
        const state = this.#store.get();

        // connect to event source
        state.events.connect?.(is.ref(inputs.eventSource) ? inputs.eventSource.nativeElement : inputs.eventSource);

        // setup compute function for events
        if (inputs.eventPrefix) {
            state.setEvents({
                compute: (event, store) => {
                    const innerState = store.get();
                    const x = event[(inputs.eventPrefix + 'X') as keyof NgtDomEvent] as number;
                    const y = event[(inputs.eventPrefix + 'Y') as keyof NgtDomEvent] as number;
                    innerState.pointer.set((x / innerState.size.width) * 2 - 1, -(y / innerState.size.height) * 2 + 1);
                    innerState.raycaster.setFromCamera(innerState.pointer, innerState.camera);
                },
            });
        }

        // emit created event if observed
        if (this.created.observed) {
            // but go back into zone to run it
            this.#zone.run(() => {
                this.created.emit(this.#store.get());
            });
        }

        // render
        if (this.#glRef) this.#glRef.destroy();

        requestAnimationFrame(() => {
            this.#glEnvInjector = createEnvironmentInjector(
                [
                    provideNgtRenderer({
                        store: this.#store,
                        changeDetectorRef: this.#cdr,
                        compoundPrefixes: this.compoundPrefixes,
                    }),
                ],
                this.#envInjector
            );

            this.#glRef = this.glAnchor.createComponent(this.sceneGraph, {
                environmentInjector: this.#glEnvInjector,
            });
            this.#setSceneGraphInputs();
            this.#overrideChangeDetectorRef();
            safeDetectChanges(this.#cdr);
        });
    }

    #overrideChangeDetectorRef() {
        const originalDetectChanges = this.#cdr.detectChanges.bind(this.#cdr);
        this.#cdr.detectChanges = () => {
            originalDetectChanges();
            safeDetectChanges(this.#glRef?.changeDetectorRef);
        };
    }

    #setSceneGraphInputs() {
        this.#zone.run(() => {
            if (this.#glRef) {
                for (const [key, value] of Object.entries(this.sceneGraphInputs)) {
                    this.#glRef.setInput(key, value);
                }
                safeDetectChanges(this.#glRef.changeDetectorRef);
            }
        });
    }
}
