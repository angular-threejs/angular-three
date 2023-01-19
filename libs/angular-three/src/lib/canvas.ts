import {
    ChangeDetectorRef,
    Component,
    ComponentRef,
    createEnvironmentInjector,
    ElementRef,
    EnvironmentInjector,
    EventEmitter,
    HostBinding,
    inject,
    Input,
    OnDestroy,
    OnInit,
    Output,
    Type,
    ViewChild,
    ViewContainerRef,
} from '@angular/core';
import { injectNgxResize, NgxResizeResult, provideNgxResizeOptions } from 'ngx-resize';
import { filter } from 'rxjs';
import { provideNgtRenderer } from './renderer/provider';
import { NgtRxStore } from './stores/rx-store';
import { NgtStore, rootStateMap } from './stores/store';
import type { NgtCanvasInputs, NgtDomEvent, NgtDpr, NgtState } from './types';
import { is } from './utils/is';
import { createPointerEvents } from './web/events';
import { injectNgtLoader } from './loader';

@Component({
    selector: 'ngt-canvas-container',
    standalone: true,
    template: '<ng-content />',
    styles: [
        `
            :host {
                display: block;
                width: 100%;
                height: 100%;
            }
        `,
    ],
    providers: [provideNgxResizeOptions({ emitInZone: false })],
})
export class NgtCanvasContainer {
    @Output() canvasResize = injectNgxResize();
}

@Component({
    selector: 'ngt-canvas',
    standalone: true,
    template: `
        <ngt-canvas-container (canvasResize)="onResize($event)">
            <canvas #glCanvas style="display: block;"></canvas>
            <ng-container #glAnchor />
        </ngt-canvas-container>
    `,
    imports: [NgtCanvasContainer],
    providers: [NgtStore],
    styles: [
        `
            :host {
                display: block;
                position: relative;
                width: 100%;
                height: 100%;
                overflow: hidden;
            }
        `,
    ],
})
export class NgtCanvas extends NgtRxStore<NgtCanvasInputs> implements OnInit, OnDestroy {
    private readonly cdr = inject(ChangeDetectorRef);
    private readonly envInjector = inject(EnvironmentInjector);
    private readonly host = inject(ElementRef) as ElementRef<HTMLElement>;
    private readonly store = inject(NgtStore);

    override initialize() {
        super.initialize();
        this.set({
            shadows: false,
            linear: false,
            flat: false,
            legacy: false,
            orthographic: false,
            frameloop: 'always',
            dpr: [1, 2],
            events: createPointerEvents,
        });
    }

    @HostBinding('class.ngt-canvas') readonly hostClass = true;
    @HostBinding('style.pointerEvents') get pointerEvents() {
        return this.get('eventSource') !== this.host.nativeElement ? 'none' : 'auto';
    }

    @Input() scene!: Type<any>;
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
        this.set({
            shadows: typeof shadows === 'object' ? (shadows as Partial<THREE.WebGLShadowMap>) : shadows,
        });
    }

    @Input() set camera(camera: NgtCanvasInputs['camera']) {
        this.set({ camera });
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
    @ViewChild('glAnchor', { static: true, read: ViewContainerRef }) glAnchor!: ViewContainerRef;

    private glRef?: ComponentRef<unknown>;
    private glEnvInjector?: EnvironmentInjector;

    ngOnInit() {
        if (!this.get('eventSource')) {
            // set default event source to the host element
            this.eventSource = this.host.nativeElement;
        }

        if (this.pointerMissed.observed) {
            this.store.set({
                onPointerMissed: (event: MouseEvent) => {
                    this.pointerMissed.emit(event);
                    this.cdr.detectChanges();
                },
            });
        }

        // setup NgtStore
        this.store.init();

        // set rootStateMap
        rootStateMap.set(this.glCanvas.nativeElement, this.store);

        // subscribe to store to listen for ready state
        this.hold(this.store.select('ready').pipe(filter((ready) => ready)), () => {
            this.storeReady();
        });
    }

    onResize({ width, height }: NgxResizeResult) {
        if (width > 0 && height > 0) {
            if (!this.store.isInit) this.store.init();
            this.store.configure(this.get(), this.glCanvas.nativeElement);
        }
    }

    private storeReady() {
        // canvas is ready, let's activate the loop
        this.store.set((state) => ({ internal: { ...state.internal, active: true } }));

        const inputs = this.get();
        const state = this.store.get();

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
            this.created.emit(this.store.get());
            this.cdr.detectChanges();
        }

        // render
        if (this.glRef) {
            this.glRef.destroy();
        }

        requestAnimationFrame(() => {
            this.glEnvInjector = createEnvironmentInjector(
                [
                    provideNgtRenderer({
                        store: this.store,
                        changeDetectorRef: this.cdr,
                        compoundPrefixes: this.compoundPrefixes,
                    }),
                ],
                this.envInjector
            );
            this.glRef = this.glAnchor.createComponent(this.scene, { environmentInjector: this.glEnvInjector });
            this.glRef.changeDetectorRef.detach();

            // here, we override the detectChanges to also call detectChanges on the ComponentRef
            this.overrideDetectChanges();
            this.cdr.detectChanges();
        });
    }

    override ngOnDestroy() {
        if (this.glRef) {
            this.glRef.destroy();
        }
        if (this.glEnvInjector) {
            this.glEnvInjector.destroy();
        }
        injectNgtLoader.destroy();
        super.ngOnDestroy();
    }

    private overrideDetectChanges() {
        const originalDetectChanges = this.cdr.detectChanges.bind(this.cdr);
        this.cdr.detectChanges = () => {
            originalDetectChanges();
            this.glRef?.changeDetectorRef.detectChanges();
        };
    }
}
