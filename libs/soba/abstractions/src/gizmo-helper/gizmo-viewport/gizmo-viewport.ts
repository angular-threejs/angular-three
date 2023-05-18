import { NgIf } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, EventEmitter, inject, Input, Output } from '@angular/core';
import { extend, NgtSignalStore, NgtThreeEvent } from 'angular-three';
import { AmbientLight, Group, PointLight } from 'three';
import { NGTS_GIZMO_HELPER_API } from '../gizmo-helper';
import { NgtsGizmoViewportAxis, NgtsGizmoViewportAxisHead } from './gizmo-viewport-axis';

extend({ Group, AmbientLight, PointLight });

@Component({
    selector: 'ngts-gizmo-viewport',
    standalone: true,
    template: `
        <ngt-group ngtCompound [scale]="40">
            <ngts-gizmo-viewport-axis
                [color]="viewportAxisColors()[0]"
                [rotation]="[0, 0, 0]"
                [scale]="viewportAxisScale()"
            ></ngts-gizmo-viewport-axis>
            <ngts-gizmo-viewport-axis
                [color]="viewportAxisColors()[1]"
                [rotation]="[0, 0, Math.PI / 2]"
                [scale]="viewportAxisScale()"
            ></ngts-gizmo-viewport-axis>
            <ngts-gizmo-viewport-axis
                [color]="viewportAxisColors()[2]"
                [rotation]="[0, -Math.PI / 2, 0]"
                [scale]="viewportAxisScale()"
            ></ngts-gizmo-viewport-axis>
            <ng-container *ngIf="!viewportHideAxisHeads()">
                <ngts-gizmo-viewport-axis-head
                    [arcStyle]="viewportAxisColors()[0]"
                    [position]="[1, 0, 0]"
                    [label]="viewportLabels()[0]"
                    [font]="viewportFont()"
                    [disabled]="viewportDisabled()"
                    [labelColor]="viewportLabelColor()"
                    [clickEmitter]="clicked"
                    [axisHeadScale]="viewportAxisHeadScale()"
                    (pointerdown)="onPointerDown($event)"
                ></ngts-gizmo-viewport-axis-head>
                <ngts-gizmo-viewport-axis-head
                    [arcStyle]="viewportAxisColors()[1]"
                    [position]="[0, 1, 0]"
                    [label]="viewportLabels()[1]"
                    [font]="viewportFont()"
                    [disabled]="viewportDisabled()"
                    [labelColor]="viewportLabelColor()"
                    [clickEmitter]="clicked"
                    [axisHeadScale]="viewportAxisHeadScale()"
                    (pointerdown)="onPointerDown($event)"
                ></ngts-gizmo-viewport-axis-head>
                <ngts-gizmo-viewport-axis-head
                    [arcStyle]="viewportAxisColors()[2]"
                    [position]="[0, 0, 1]"
                    [label]="viewportLabels()[2]"
                    [font]="viewportFont()"
                    [disabled]="viewportDisabled()"
                    [labelColor]="viewportLabelColor()"
                    [clickEmitter]="clicked"
                    [axisHeadScale]="viewportAxisHeadScale()"
                    (pointerdown)="onPointerDown($event)"
                ></ngts-gizmo-viewport-axis-head>
                <ng-container *ngIf="!viewportHideNegativeAxes()">
                    <ngts-gizmo-viewport-axis-head
                        [arcStyle]="viewportAxisColors()[0]"
                        [position]="[-1, 0, 0]"
                        [font]="viewportFont()"
                        [disabled]="viewportDisabled()"
                        [labelColor]="viewportLabelColor()"
                        [clickEmitter]="clicked"
                        [axisHeadScale]="viewportAxisHeadScale()"
                        (pointerdown)="onPointerDown($event)"
                    ></ngts-gizmo-viewport-axis-head>
                    <ngts-gizmo-viewport-axis-head
                        [arcStyle]="viewportAxisColors()[1]"
                        [position]="[0, -1, 0]"
                        [font]="viewportFont()"
                        [disabled]="viewportDisabled()"
                        [labelColor]="viewportLabelColor()"
                        [clickEmitter]="clicked"
                        [axisHeadScale]="viewportAxisHeadScale()"
                        (pointerdown)="onPointerDown($event)"
                    ></ngts-gizmo-viewport-axis-head>
                    <ngts-gizmo-viewport-axis-head
                        [arcStyle]="viewportAxisColors()[2]"
                        [position]="[0, 0, -1]"
                        [font]="viewportFont()"
                        [disabled]="viewportDisabled()"
                        [labelColor]="viewportLabelColor()"
                        [clickEmitter]="clicked"
                        [axisHeadScale]="viewportAxisHeadScale()"
                        (pointerdown)="onPointerDown($event)"
                    ></ngts-gizmo-viewport-axis-head>
                </ng-container>
            </ng-container>
            <ngt-ambient-light intensity="0.5"></ngt-ambient-light>
            <ngt-point-light position="10" intensity="0.5"></ngt-point-light>
        </ngt-group>
    `,
    imports: [NgtsGizmoViewportAxis, NgtsGizmoViewportAxisHead, NgIf],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsGizmoViewport extends NgtSignalStore<{
    axisColors: [string, string, string];
    axisScale: [number, number, number];
    labels: [string, string, string];
    axisHeadScale: number;
    labelColor: string;
    hideNegativeAxes: boolean;
    hideAxisHeads: boolean;
    disabled: boolean;
    font: string;
}> {
    readonly #gizmoHelperApi = inject(NGTS_GIZMO_HELPER_API);

    readonly Math = Math;

    @Input() set axisColors(axisColors: [string, string, string]) {
        this.set({ axisColors });
    }

    @Input() set axisScale(axisScale: [number, number, number]) {
        this.set({ axisScale });
    }

    @Input() set labels(labels: [string, string, string]) {
        this.set({ labels });
    }

    @Input() set axisHeadScale(axisHeadScale: number) {
        this.set({ axisHeadScale });
    }

    @Input() set labelColor(labelColor: string) {
        this.set({ labelColor });
    }

    @Input() set hideNegativeAxes(hideNegativeAxes: boolean) {
        this.set({ hideNegativeAxes });
    }

    @Input() set hideAxisHeads(hideAxisHeads: boolean) {
        this.set({ hideAxisHeads });
    }

    @Input() set disabled(disabled: boolean) {
        this.set({ disabled });
    }

    @Input() set font(font: string) {
        this.set({ font });
    }

    @Output() clicked = new EventEmitter<NgtThreeEvent<MouseEvent>>();

    readonly viewportAxisColors = this.select('axisColors');
    readonly viewportAxisScale = this.select('axisScale');
    readonly viewportLabels = this.select('labels');
    readonly viewportAxisHeadScale = this.select('axisHeadScale');
    readonly viewportLabelColor = this.select('labelColor');
    readonly viewportHideNegativeAxes = this.select('hideNegativeAxes');
    readonly viewportHideAxisHeads = this.select('hideAxisHeads');
    readonly viewportDisabled = this.select('disabled');
    readonly viewportFont = this.select('font');

    constructor() {
        super({
            font: '18px Inter var, Arial, sans-serif',
            axisColors: ['#ff2060', '#20df80', '#2080ff'],
            axisHeadScale: 1,
            labels: ['X', 'Y', 'Z'],
            labelColor: '#000',
        });
    }

    onPointerDown(event: NgtThreeEvent<PointerEvent>) {
        if (!this.get('disabled')) {
            event.stopPropagation();
            this.#gizmoHelperApi()(event.object.position);
        }
    }
}
