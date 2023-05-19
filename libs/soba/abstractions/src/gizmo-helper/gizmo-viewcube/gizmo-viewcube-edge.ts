import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, Input, signal } from '@angular/core';
import { extend, NgtArgs, NgtSignalStore, NgtThreeEvent } from 'angular-three';
import { BoxGeometry, Mesh, MeshBasicMaterial, Vector3 } from 'three';
import { NGTS_GIZMO_HELPER_API } from '../gizmo-helper';
import { colors } from './constants';
import { NgtsGizmoViewcubeInputs } from './gizmo-viewcube-inputs';

extend({ Mesh, BoxGeometry, MeshBasicMaterial });

@Component({
    selector: 'ngts-gizmo-viewcube-edge-cube',
    standalone: true,
    template: `
        <ngt-mesh
            [scale]="1.01"
            [position]="edgePosition()"
            (pointermove)="onPointerMove($event)"
            (pointerout)="onPointerOut($event)"
            (click)="onClick($event)"
        >
            <ngt-box-geometry *args="edgeDimensions()" />
            <ngt-mesh-basic-material
                [color]="hover() ? viewcubeInputs.viewcubeHoverColor() : 'white'"
                [transparent]="true"
                [opacity]="0.6"
                [visible]="hover()"
            />
        </ngt-mesh>
    `,
    imports: [NgtArgs],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsGizmoViewcubeEdgeCube extends NgtSignalStore<{
    position: THREE.Vector3;
    dimensions: [number, number, number];
}> {
    readonly #gizmoHelperApi = inject(NGTS_GIZMO_HELPER_API);

    protected readonly viewcubeInputs = inject(NgtsGizmoViewcubeInputs);

    hover = signal(false);

    @Input({ required: true }) set dimensions(dimensions: [number, number, number]) {
        this.set({ dimensions });
    }

    @Input({ required: true }) set position(position: Vector3) {
        this.set({ position });
    }

    readonly edgePosition = this.select('position');
    readonly edgeDimensions = this.select('dimensions');

    constructor() {
        super();
        this.viewcubeInputs.patch({ hoverColor: colors.hover });
    }

    onPointerMove(event: NgtThreeEvent<PointerEvent>) {
        event.stopPropagation();
        this.hover.set(true);
    }

    onPointerOut(event: NgtThreeEvent<PointerEvent>) {
        event.stopPropagation();
        this.hover.set(false);
    }

    onClick(event: NgtThreeEvent<MouseEvent>) {
        if (this.viewcubeInputs.get('clickEmitter')?.observed) {
            this.viewcubeInputs.get('clickEmitter').emit(event);
        } else {
            event.stopPropagation();
            this.#gizmoHelperApi()(this.get('position'));
        }
    }
}
