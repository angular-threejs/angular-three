import { Component, CUSTOM_ELEMENTS_SCHEMA, Input } from '@angular/core';
import { extend, injectBeforeRender, injectNgtRef, NgtRenderState, NgtSignalStore, type NgtGroup } from 'angular-three';
import * as THREE from 'three';
import { Group } from 'three';

extend({ Group });

export type NgtsFloatState = {
    enabled: boolean;
    speed: number;
    floatIntensity: number;
    rotationIntensity: number;
    floatingRange: [number?, number?];
};

declare global {
    interface HTMLElementTagNameMap {
        'ngts-float': NgtsFloatState & NgtGroup;
    }
}

@Component({
    selector: 'ngts-float',
    standalone: true,
    template: `
        <ngt-group ngtCompound>
            <ngt-group [ref]="floatRef">
                <ng-content />
            </ngt-group>
        </ngt-group>
    `,
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsFloat extends NgtSignalStore<NgtsFloatState> {
    readonly #offset = Math.random() * 10000;

    @Input() floatRef = injectNgtRef<THREE.Group>();

    @Input() set enabled(enabled: boolean) {
        this.set({ enabled });
    }

    @Input() set speed(speed: number) {
        this.set({ speed });
    }

    @Input() set rotationIntensity(rotationIntensity: number) {
        this.set({ rotationIntensity });
    }

    @Input() set floatIntensity(floatIntensity: number) {
        this.set({ floatIntensity });
    }

    @Input() set floatingRange(floatingRange: [number?, number?]) {
        this.set({ floatingRange });
    }

    constructor() {
        super({ speed: 1, rotationIntensity: 1, floatIntensity: 1, floatingRange: [-0.1, 0.1], enabled: true });
        injectBeforeRender(this.onBeforeRender.bind(this));
    }

    private onBeforeRender({ clock }: NgtRenderState) {
        if (!this.floatRef.untracked) return;
        const { enabled, speed, floatingRange, floatIntensity, rotationIntensity } = this.get();
        if (!enabled || speed === 0) return;

        const t = this.#offset + clock.getElapsedTime();
        this.floatRef.untracked.rotation.x = (Math.cos((t / 4) * speed) / 8) * rotationIntensity;
        this.floatRef.untracked.rotation.y = (Math.sin((t / 4) * speed) / 8) * rotationIntensity;
        this.floatRef.untracked.rotation.z = (Math.sin((t / 4) * speed) / 20) * rotationIntensity;
        let yPosition = Math.sin((t / 4) * speed) / 10;
        yPosition = THREE.MathUtils.mapLinear(yPosition, -0.1, 0.1, floatingRange[0] ?? -0.1, floatingRange[1] ?? 0.1);
        this.floatRef.untracked.position.y = yPosition * floatIntensity;
    }
}
