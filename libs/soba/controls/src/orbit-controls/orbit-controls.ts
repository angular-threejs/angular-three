import {
    Component,
    computed,
    CUSTOM_ELEMENTS_SCHEMA,
    effect,
    EventEmitter,
    inject,
    Injector,
    Input,
    NgZone,
    OnInit,
    Output,
} from '@angular/core';
import { injectBeforeRender, injectNgtRef, NgtArgs, NgtSignalStore, NgtStore, NgtVector3 } from 'angular-three';
import { OrbitControls } from 'three-stdlib';

export type NgtsOrbitControlsState = {
    camera?: THREE.Camera;
    domElement?: HTMLElement;
    target?: NgtVector3;
    makeDefault: boolean;
    regress: boolean;
    enableDamping: boolean;
};

declare global {
    interface HTMLElementTagNameMap {
        'ngts-orbit-controls': OrbitControls & NgtsOrbitControlsState;
    }
}

@Component({
    selector: 'ngts-orbit-controls',
    standalone: true,
    template: ` <ngt-primitive *args="args()" ngtCompound [enableDamping]="damping()" /> `,
    imports: [NgtArgs],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsOrbitControls extends NgtSignalStore<NgtsOrbitControlsState> implements OnInit {
    @Input() controlsRef = injectNgtRef<OrbitControls>();

    @Input() set camera(camera: THREE.Camera) {
        this.set({ camera });
    }

    @Input() set domElement(domElement: HTMLElement) {
        this.set({ domElement });
    }

    @Input() set makeDefault(makeDefault: boolean) {
        this.set({ makeDefault });
    }

    @Input() set regress(regress: boolean) {
        this.set({ regress });
    }

    @Input() set target(target: THREE.Vector3 | Parameters<THREE.Vector3['set']>) {
        this.set({ target });
    }

    @Input() set enableDamping(enableDamping: boolean) {
        this.set({ enableDamping });
    }

    @Output() change = new EventEmitter<THREE.Event>();
    @Output() start = new EventEmitter<THREE.Event>();
    @Output() end = new EventEmitter<THREE.Event>();

    readonly #store = inject(NgtStore);
    readonly #injector = inject(Injector);
    readonly #zone = inject(NgZone);

    readonly args = computed(() => [this.controlsRef.nativeElement]);
    readonly damping = this.select('enableDamping');

    constructor() {
        super({ enableDamping: true, regress: false, makeDefault: false });
        injectBeforeRender(
            () => {
                const controls = this.controlsRef.untracked;
                if (controls && controls.enabled) {
                    controls.update();
                }
            },
            { priority: -1 }
        );
    }

    ngOnInit() {
        this.#zone.runOutsideAngular(() => {
            this.#setControls();
            this.#connectElement();
            this.#makeControlsDefault();
            this.#setEvents();
        });
    }

    #setControls() {
        const trigger = computed(() => {
            const camera = this.select('camera');
            const defaultCamera = this.#store.select('camera');
            return { camera: camera(), defaultCamera: defaultCamera() };
        });

        effect(
            () => {
                const { camera, defaultCamera } = trigger();
                const controlsCamera = camera || defaultCamera;
                const controls = this.controlsRef.nativeElement;
                if (!controls || controls.object !== controlsCamera) {
                    this.controlsRef.nativeElement = new OrbitControls(controlsCamera);
                }
            },
            { injector: this.#injector, allowSignalWrites: true }
        );
    }

    #connectElement() {
        const trigger = computed(() => {
            const glDomElement = this.#store.select('gl', 'domElement');
            const domElement = this.select('domElement');
            const regress = this.select('regress');

            const eventsSource = this.#store.get('events', 'connected');
            const invalidate = this.#store.select('invalidate');

            return {
                controls: this.controlsRef.nativeElement,
                domElement: domElement() || eventsSource || glDomElement(),
                regress: regress(),
                invalidate: invalidate(),
            };
        });

        effect(
            (onCleanup) => {
                const { domElement, controls } = trigger();
                if (!controls) return;
                controls.connect(domElement);
                onCleanup(() => void controls.dispose());
            },
            { injector: this.#injector }
        );
    }

    #makeControlsDefault() {
        const trigger = computed(() => {
            const makeDefault = this.select('makeDefault');
            return { controls: this.controlsRef.nativeElement, makeDefault: makeDefault() };
        });
        effect(
            (onCleanup) => {
                const { controls, makeDefault } = trigger();
                if (!controls) return;
                if (makeDefault) {
                    const oldControls = this.#store.get('controls');
                    this.#store.set({ controls });
                    onCleanup(() => void this.#store.set({ controls: oldControls }));
                }
            },
            { injector: this.#injector, allowSignalWrites: true }
        );
    }

    #setEvents() {
        const trigger = computed(() => {
            const invalidate = this.#store.select('invalidate');
            const performance = this.#store.get('performance');
            return { invalidate: invalidate(), performance, controls: this.controlsRef.nativeElement };
        });
        effect(
            (onCleanup) => {
                const { controls, invalidate, performance } = trigger();
                if (!controls) return;
                const regress = this.get('regress');
                const changeCallback: (e: THREE.Event) => void = (e) => {
                    invalidate();
                    if (regress) performance.regress();
                    if (this.change.observed) this.change.emit(e);
                };

                const startCallback = this.start.observed ? this.start.emit.bind(this.start) : null;
                const endCallback = this.end.observed ? this.end.emit.bind(this.end) : null;

                controls.addEventListener('change', changeCallback);
                if (startCallback) controls.addEventListener('start', startCallback);
                if (endCallback) controls.addEventListener('end', endCallback);

                onCleanup(() => {
                    controls.removeEventListener('change', changeCallback);
                    if (startCallback) controls.removeEventListener('start', startCallback);
                    if (endCallback) controls.removeEventListener('end', endCallback);
                });
            },
            { injector: this.#injector }
        );
    }
}
