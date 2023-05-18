import { Directive, Input, type EventEmitter } from '@angular/core';
import { NgtSignalStore, type NgtThreeEvent } from 'angular-three';

export interface NgtsGizmoViewCubeInputsState {
    opacity: number;
    hoverColor: string;
    textColor: string;
    strokeColor: string;
    faces: string[];
    font?: string;
    color?: string;
    clickEmitter: EventEmitter<NgtThreeEvent<MouseEvent>>;
}

@Directive()
export abstract class NgtsGizmoViewcubeInputs extends NgtSignalStore<NgtsGizmoViewCubeInputsState> {
    @Input() set opacity(opacity: number) {
        this.set({ opacity });
    }

    @Input() set hoverColor(hoverColor: string) {
        this.set({ hoverColor });
    }

    @Input() set textColor(textColor: string) {
        this.set({ textColor });
    }

    @Input() set strokeColor(strokeColor: string) {
        this.set({ strokeColor });
    }

    @Input() set faces(faces: string[]) {
        this.set({ faces });
    }

    @Input() set font(font: string) {
        this.set({ font });
    }

    @Input() set color(color: string) {
        this.set({ color });
    }

    @Input() set clickEmitter(clickEmitter: EventEmitter<NgtThreeEvent<MouseEvent>>) {
        this.set({ clickEmitter });
    }

    readonly viewcubeHoverColor = this.select('hoverColor');
    readonly viewcubeOpacity = this.select('opacity');
    readonly viewcubeTextColor = this.select('textColor');
    readonly viewcubeStrokeColor = this.select('strokeColor');
    readonly viewcubeFaces = this.select('faces');
    readonly viewcubeFont = this.select('font');
    readonly viewcubeColor = this.select('color');
}
