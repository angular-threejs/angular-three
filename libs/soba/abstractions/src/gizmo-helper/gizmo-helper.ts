import { NgTemplateOutlet } from '@angular/common';
import {
    Component,
    computed,
    ContentChild,
    CUSTOM_ELEMENTS_SCHEMA,
    Directive,
    effect,
    EventEmitter,
    inject,
    InjectionToken,
    Input,
    Output,
    Signal,
    TemplateRef,
} from '@angular/core';
import { extend, injectNgtRef, NgtPortal, NgtPortalContent, NgtSignalStore, NgtStore } from 'angular-three';
import { NgtsOrthographicCamera } from 'angular-three-soba/cameras';
import { Group, Matrix4, Object3D, OrthographicCamera, Quaternion, Vector3 } from 'three';
import { OrbitControls } from 'three-stdlib';

type ControlsProto = { update(): void; target: THREE.Vector3 };

const isOrbitControls = (controls: ControlsProto): controls is OrbitControls =>
    'minPolarAngle' in (controls as OrbitControls);

export type NgtsGizmoHelperApi = (direction: Vector3) => void;
export const NGTS_GIZMO_HELPER_API = new InjectionToken<Signal<NgtsGizmoHelperApi>>('NgtsGizmoHelper API');

extend({ Group });

export interface NgtsGizmoHelperState {
    alignment:
        | 'top-left'
        | 'top-right'
        | 'bottom-right'
        | 'bottom-left'
        | 'bottom-center'
        | 'center-right'
        | 'center-left'
        | 'center-center'
        | 'top-center';
    margin: [number, number];
    renderPriority: number;
    autoClear: boolean;
}

@Directive({ selector: 'ng-template[ngtsGizmoHelperContent]', standalone: true })
export class NgtsGizmoHelperContent {}

@Component({
    selector: 'ngts-gizmo-helper',
    standalone: true,
    template: `
        <ngt-portal [renderPriority]="priority()">
            <ng-template ngtPortalContent>
                <ngts-orthographic-camera
                    [cameraRef]="virtualCameraRef"
                    [makeDefault]="true"
                    [position]="[0, 0, 200]"
                />
                <ngt-group [ref]="gizmoRef" [position]="position()" (beforeRender)="onBeforeRender($event.state.delta)">
                    <ng-container *ngTemplateOutlet="gizmoHelperContent" />
                </ngt-group>
            </ng-template>
        </ngt-portal>
    `,
    imports: [NgtPortal, NgtPortalContent, NgtsOrthographicCamera, NgTemplateOutlet],
    providers: [
        { provide: NGTS_GIZMO_HELPER_API, useFactory: (gizmo: NgtsGizmoHelper) => gizmo.api, deps: [NgtsGizmoHelper] },
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsGizmoHelper extends NgtSignalStore<NgtsGizmoHelperState> {
    readonly gizmoRef = injectNgtRef<Group>();
    readonly virtualCameraRef = injectNgtRef<OrthographicCamera>();

    @Input() set alignment(
        alignment:
            | 'top-left'
            | 'top-right'
            | 'bottom-right'
            | 'bottom-left'
            | 'bottom-center'
            | 'center-right'
            | 'center-left'
            | 'center-center'
            | 'top-center'
    ) {
        this.set({ alignment });
    }

    @Input() set margin(margin: [number, number]) {
        this.set({ margin });
    }

    @Input() set renderPriority(renderPriority: number) {
        this.set({ renderPriority });
    }

    @Input() set autoClear(autoClear: boolean) {
        this.set({ autoClear });
    }

    @Output() updated = new EventEmitter<void>();

    @ContentChild(NgtsGizmoHelperContent, { static: true, read: TemplateRef })
    gizmoHelperContent!: TemplateRef<unknown>;

    readonly #store = inject(NgtStore);
    readonly #camera = this.#store.select('camera');
    readonly #size = this.#store.select('size');

    readonly #alignment = this.select('alignment');
    readonly #margin = this.select('margin');

    #animating = false;
    #radius = 0;
    #focusPoint = new Vector3(0, 0, 0);
    #q1 = new Quaternion();
    #q2 = new Quaternion();
    #target = new Vector3();
    #targetPosition = new Vector3();
    #dummy = new Object3D();

    #defaultUp = new Vector3(0, 0, 0);
    #turnRate = 2 * Math.PI; // turn rate in angles per sec
    #matrix = new Matrix4();

    readonly priority = this.select('renderPriority');

    readonly position = computed(() => {
        const size = this.#size();
        const alignment = this.#alignment();
        const margin = this.#margin();

        const [marginX, marginY] = margin;
        const x = alignment.endsWith('-center')
            ? 0
            : alignment.endsWith('-left')
            ? -size.width / 2 + marginX
            : size.width / 2 - marginX;
        const y = alignment.startsWith('center-')
            ? 0
            : alignment.startsWith('top-')
            ? size.height / 2 - marginY
            : -size.height / 2 + marginY;

        return [x, y, 0];
    });

    readonly api = computed(() => (direction: THREE.Vector3) => {
        const { controls, camera, invalidate } = this.#store.get();
        const defaultControls = controls as unknown as ControlsProto;

        this.#animating = true;
        if (defaultControls) this.#focusPoint = defaultControls.target;
        this.#radius = camera.position.distanceTo(this.#target);
        // rotate from current camera orientation
        this.#q1.copy(camera.quaternion);
        // to new current camera orientation
        this.#targetPosition.copy(direction).multiplyScalar(this.#radius).add(this.#target);
        this.#dummy.lookAt(this.#targetPosition);
        this.#q2.copy(this.#dummy.quaternion);
        invalidate();
    });

    constructor() {
        super({ alignment: 'bottom-right', margin: [80, 80], renderPriority: 1 });
        this.#updateDefaultUp();
    }

    onBeforeRender(delta: number) {
        if (this.virtualCameraRef.nativeElement && this.gizmoRef.nativeElement) {
            const { controls, camera: mainCamera, invalidate } = this.#store.get();
            const defaultControls = controls as unknown as ControlsProto;
            // Animate step
            if (this.#animating) {
                if (this.#q1.angleTo(this.#q2) < 0.01) {
                    this.#animating = false;
                    // Orbit controls uses UP vector as the orbit axes,
                    // so we need to reset it after the animation is done
                    // moving it around for the controls to work correctly
                    if (isOrbitControls(defaultControls)) {
                        mainCamera.up.copy(this.#defaultUp);
                    }
                } else {
                    const step = delta * this.#turnRate;
                    // animate position by doing a slerp and then scaling the position on the unit sphere
                    this.#q1.rotateTowards(this.#q2, step);
                    // animate orientation
                    mainCamera.position
                        .set(0, 0, 1)
                        .applyQuaternion(this.#q1)
                        .multiplyScalar(this.#radius)
                        .add(this.#focusPoint);
                    mainCamera.up.set(0, 1, 0).applyQuaternion(this.#q1).normalize();
                    mainCamera.quaternion.copy(this.#q1);
                    if (this.updated.observed) this.updated.emit();
                    else if (defaultControls) {
                        defaultControls.update();
                    }
                    invalidate();
                }
            }

            // Sync Gizmo with main camera orientation
            this.#matrix.copy(mainCamera.matrix).invert();
            this.gizmoRef.nativeElement.quaternion.setFromRotationMatrix(this.#matrix);
        }
    }

    #updateDefaultUp() {
        effect(() => {
            const camera = this.#camera();
            if (!camera) return;
            this.#defaultUp.copy(camera.up);
        });
    }
}
