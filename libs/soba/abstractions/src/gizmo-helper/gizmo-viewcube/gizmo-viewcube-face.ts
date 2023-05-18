import { DOCUMENT } from '@angular/common';
import { ChangeDetectorRef, Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, Input, signal } from '@angular/core';
import { extend, NgtRepeat, NgtSignalStore, NgtStore, NgtThreeEvent } from 'angular-three';
import { BoxGeometry, CanvasTexture, Mesh, MeshLambertMaterial } from 'three';
import { NGTS_GIZMO_HELPER_API } from '../gizmo-helper';
import { colors, defaultFaces } from './constants';
import { NgtsGizmoViewcubeInputs } from './gizmo-viewcube-inputs';

extend({ MeshLambertMaterial, Mesh, BoxGeometry });

@Component({
    selector: 'ngts-gizmo-viewcube-face-material',
    standalone: true,
    template: `
        <ngt-mesh-lambert-material
            [attach]="['material', faceIndex()]"
            [map]="texture()"
            [color]="faceHover() ? viewcubeInputs.viewcubeHoverColor() : viewcubeInputs.viewcubeColor()"
            [opacity]="viewcubeInputs.viewcubeOpacity()"
            [transparent]="true"
        >
            <ngt-value [rawValue]="gl().outputEncoding" attach="map.encoding" />
            <ngt-value [rawValue]="gl().capabilities.getMaxAnisotropy() || 1" attach="map.anisotrophy" />
        </ngt-mesh-lambert-material>
    `,
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsGizmoViewcubeFaceMaterial extends NgtSignalStore<{
    index: number;
    hover: boolean;
}> {
    readonly #document = inject(DOCUMENT);
    readonly #store = inject(NgtStore);
    protected readonly gl = this.#store.select('gl');
    protected readonly viewcubeInputs = inject(NgtsGizmoViewcubeInputs);

    @Input({ required: true }) set index(index: number) {
        this.set({ index });
    }

    @Input({ required: true }) set hover(hover: boolean) {
        this.set({ hover });
    }

    readonly faceIndex = this.select('index');
    readonly faceHover = this.select('hover');

    readonly texture = computed(() => {
        const index = this.faceIndex();
        const color = this.viewcubeInputs.viewcubeColor();
        const font = this.viewcubeInputs.viewcubeFont();
        const faces = this.viewcubeInputs.viewcubeFaces();
        const textColor = this.viewcubeInputs.viewcubeTextColor();
        const strokeColor = this.viewcubeInputs.viewcubeStrokeColor();

        const canvas = this.#document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const context = canvas.getContext('2d')!;
        context.fillStyle = color!;
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.strokeStyle = strokeColor;
        context.strokeRect(0, 0, canvas.width, canvas.height);
        context.font = font!;
        context.textAlign = 'center';
        context.fillStyle = textColor;
        context.fillText(faces[index].toUpperCase(), 64, 76);

        return new CanvasTexture(canvas);
    });

    constructor() {
        super();
        this.viewcubeInputs.patch({
            color: colors.bg,
            font: '20px Inter var, Arial, sans-serif',
            faces: defaultFaces,
            hoverColor: colors.hover,
            textColor: colors.text,
            strokeColor: colors.stroke,
            opacity: 1,
        });
    }
}

@Component({
    selector: 'ngts-gizmo-viewcube-face-cube',
    standalone: true,
    template: `
        <ngt-mesh
            (pointermove)="onPointerMove($any($event))"
            (pointerout)="onPointerOut($any($event))"
            (click)="onClick($any($event))"
        >
            <ngt-box-geometry />
            <ngts-gizmo-viewcube-face-material *ngFor="let i; repeat: 6" [hover]="hover() === i" [index]="i" />
        </ngt-mesh>
    `,
    imports: [NgtsGizmoViewcubeFaceMaterial, NgtRepeat],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsGizmoViewcubeFaceCube {
    readonly #gizmoHelperApi = inject(NGTS_GIZMO_HELPER_API);
    readonly #cdr = inject(ChangeDetectorRef);

    protected readonly viewcubeInputs = inject(NgtsGizmoViewcubeInputs);

    hover = signal(-1);

    onPointerMove(event: NgtThreeEvent<PointerEvent>) {
        event.stopPropagation();
        this.hover.set(Math.floor(event.faceIndex! / 2));
        this.#cdr.detectChanges();
    }

    onPointerOut(event: NgtThreeEvent<PointerEvent>) {
        event.stopPropagation();
        this.hover.set(-1);
        this.#cdr.detectChanges();
    }

    onClick(event: NgtThreeEvent<MouseEvent>) {
        if (this.viewcubeInputs.get('clickEmitter')?.observed) {
            this.viewcubeInputs.get('clickEmitter').emit(event);
        } else {
            event.stopPropagation();
            this.#gizmoHelperApi()(event.face!.normal);
        }
    }
}
