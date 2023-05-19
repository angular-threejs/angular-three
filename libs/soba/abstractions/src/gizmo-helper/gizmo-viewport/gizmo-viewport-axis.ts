import { DOCUMENT } from '@angular/common';
import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, EventEmitter, inject, Input, signal } from '@angular/core';
import { extend, NgtArgs, NgtSignalStore, NgtStore, NgtThreeEvent } from 'angular-three';
import { BoxGeometry, CanvasTexture, Group, Mesh, MeshBasicMaterial, Sprite, SpriteMaterial } from 'three';

extend({ Group, Mesh, BoxGeometry, MeshBasicMaterial, Sprite, SpriteMaterial });

@Component({
    selector: 'ngts-gizmo-viewport-axis',
    standalone: true,
    template: `
        <ngt-group [rotation]="axisRotation()">
            <ngt-mesh [position]="[0.4, 0, 0]">
                <ngt-box-geometry *args="axisScale()" />
                <ngt-mesh-basic-material [color]="axisColor()" [toneMapped]="false" />
            </ngt-mesh>
        </ngt-group>
    `,
    imports: [NgtArgs],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsGizmoViewportAxis extends NgtSignalStore<{
    color: string;
    rotation: [number, number, number];
    scale: [number, number, number];
}> {
    @Input({ required: true }) set color(color: string) {
        this.set({ color });
    }

    @Input({ required: true }) set rotation(rotation: [number, number, number]) {
        this.set({ rotation });
    }

    @Input() set scale(scale: [number, number, number]) {
        this.set({ scale });
    }

    readonly axisRotation = this.select('rotation');
    readonly axisColor = this.select('color');
    readonly axisScale = this.select('scale');

    constructor() {
        super({ scale: [0.8, 0.05, 0.05] });
    }
}

@Component({
    selector: 'ngts-gizmo-viewport-axis-head',
    standalone: true,
    template: `
        <ngt-sprite
            ngtCompound
            [scale]="scale()"
            (pointerover)="onPointerOver($event)"
            (pointerout)="onPointerOut($event)"
        >
            <ngt-sprite-material
                [map]="texture()"
                [opacity]="axisLabel() ? 1 : 0.75"
                [alphaTest]="0.3"
                [toneMapped]="false"
            >
                <ngt-value [rawValue]="gl().outputEncoding" attach="map.encoding" />
                <ngt-value [rawValue]="gl().capabilities.getMaxAnisotropy() || 1" attach="map.anisotropy" />
            </ngt-sprite-material>
        </ngt-sprite>
    `,
    imports: [NgtArgs],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsGizmoViewportAxisHead extends NgtSignalStore<{
    arcStyle: string;
    label: string;
    labelColor: string;
    axisHeadScale: number;
    disabled: boolean;
    font: string;
    clickEmitter: EventEmitter<NgtThreeEvent<MouseEvent>>;
}> {
    readonly #document = inject(DOCUMENT);
    readonly #store = inject(NgtStore);
    readonly gl = this.#store.select('gl');

    @Input() set arcStyle(arcStyle: string) {
        this.set({ arcStyle });
    }

    @Input() set label(label: string) {
        this.set({ label });
    }

    @Input() set labelColor(labelColor: string) {
        this.set({ labelColor });
    }

    @Input() set axisHeadScale(axisHeadScale: number) {
        this.set({ axisHeadScale });
    }

    @Input() set disabled(disabled: boolean) {
        this.set({ disabled });
    }

    @Input() set font(font: string) {
        this.set({ font });
    }

    @Input() set clickEmitter(clickEmitter: EventEmitter<NgtThreeEvent<MouseEvent>>) {
        this.set({ clickEmitter });
    }

    active = signal(false);

    readonly #arcStyle = this.select('arcStyle');
    readonly #labelColor = this.select('labelColor');
    readonly #font = this.select('font');
    readonly #axisHeadScale = this.select('axisHeadScale');

    readonly axisLabel = this.select('label');

    readonly texture = computed(() => {
        const arcStyle = this.#arcStyle();
        const labelColor = this.#labelColor();
        const font = this.#font();
        const label = this.axisLabel();

        const canvas = this.#document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;

        const context = canvas.getContext('2d')!;
        context.beginPath();
        context.arc(32, 32, 16, 0, 2 * Math.PI);
        context.closePath();
        context.fillStyle = arcStyle;
        context.fill();

        if (label) {
            context.font = font;
            context.textAlign = 'center';
            context.fillStyle = labelColor;
            context.fillText(label, 32, 41);
        }
        return new CanvasTexture(canvas);
    });

    readonly scale = computed(() => {
        const active = this.active();
        const axisHeadScale = this.#axisHeadScale();
        const label = this.axisLabel();
        return (label ? 1 : 0.75) * (active ? 1.2 : 1) * axisHeadScale;
    });

    constructor() {
        super({ axisHeadScale: 1 });
    }

    onPointerOver(event: NgtThreeEvent<PointerEvent>) {
        if (!this.get('disabled')) {
            event.stopPropagation();
            this.active.set(true);
        }
    }

    onPointerOut(event: NgtThreeEvent<PointerEvent>) {
        if (!this.get('disabled')) {
            if (this.get('clickEmitter')?.observed) {
                this.get('clickEmitter').emit(event);
            } else {
                event.stopPropagation();
                this.active.set(false);
            }
        }
    }
}
