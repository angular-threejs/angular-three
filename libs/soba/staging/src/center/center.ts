import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, effect, EventEmitter, Input, Output } from '@angular/core';
import { extend, injectNgtRef, NgtSignalStore, type NgtGroup } from 'angular-three';
import { Box3, Group, Sphere, Vector3 } from 'three';

export type NgtsCenterState = {
    top?: boolean;
    right?: boolean;
    bottom?: boolean;
    left?: boolean;
    front?: boolean;
    back?: boolean;
    /** Disable all axes */
    disable?: boolean;
    /** Disable x-axis centering */
    disableX?: boolean;
    /** Disable y-axis centering */
    disableY?: boolean;
    /** Disable z-axis centering */
    disableZ?: boolean;
    /** See https://threejs.org/docs/index.html?q=box3#api/en/math/Box3.setFromObject */
    precise: boolean;
};

extend({ Group });

declare global {
    interface HTMLElementTagNameMap {
        'ngts-center': NgtsCenterState & NgtGroup;
    }
}

@Component({
    selector: 'ngts-center',
    standalone: true,
    template: `
        <ngt-group ngtCompound [ref]="centerRef">
            <ngt-group [ref]="outerRef">
                <ngt-group [ref]="innerRef">
                    <ng-content />
                </ngt-group>
            </ngt-group>
        </ngt-group>
    `,
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsCenter extends NgtSignalStore<NgtsCenterState> {
    @Input() centerRef = injectNgtRef<Group>();

    readonly outerRef = injectNgtRef<Group>();
    readonly innerRef = injectNgtRef<Group>();

    @Input() set top(top: boolean) {
        this.set({ top });
    }

    @Input() set right(right: boolean) {
        this.set({ right });
    }

    @Input() set bottom(bottom: boolean) {
        this.set({ bottom });
    }

    @Input() set left(left: boolean) {
        this.set({ left });
    }

    @Input() set front(front: boolean) {
        this.set({ front });
    }

    @Input() set back(back: boolean) {
        this.set({ back });
    }

    @Input() set disableX(disableX: boolean) {
        this.set({ disableX });
    }

    @Input() set disableY(disableY: boolean) {
        this.set({ disableY });
    }

    @Input() set disableZ(disableZ: boolean) {
        this.set({ disableZ });
    }

    @Input() set disable(disable: boolean) {
        this.set({ disable });
    }

    @Input() set precise(precise: boolean) {
        this.set({ precise });
    }

    @Output() centered = new EventEmitter<{
        /** The next parent above <Center> */
        parent: THREE.Object3D;
        /** The outmost container group of the <Center> component */
        container: THREE.Object3D;
        width: number;
        height: number;
        depth: number;
        boundingBox: THREE.Box3;
        boundingSphere: THREE.Sphere;
        center: THREE.Vector3;
        verticalAlignment: number;
        horizontalAlignment: number;
        depthAlignment: number;
    }>();

    constructor() {
        super({ precise: true });
        this.#setPosition();
    }

    #setPosition() {
        const trigger = computed(() => {
            const center = this.centerRef.nativeElement;
            const outer = this.outerRef.nativeElement;
            const inner = this.innerRef.nativeElement;
            const innerChildren = this.innerRef.children();
            return { center, outer, inner, innerChildren: innerChildren() };
        });

        effect(() => {
            const { center: centerGroup, outer, inner } = trigger();
            if (!outer || !inner) return;
            const { precise, top, left, front, disable, disableX, disableY, disableZ, back, bottom, right } =
                this.get();
            outer.matrixWorld.identity();
            const box3 = new Box3().setFromObject(inner, precise);
            const center = new Vector3();
            const sphere = new Sphere();
            const width = box3.max.x - box3.min.x;
            const height = box3.max.y - box3.min.y;
            const depth = box3.max.z - box3.min.z;

            box3.getCenter(center);
            box3.getBoundingSphere(sphere);

            const vAlign = top ? height / 2 : bottom ? -height / 2 : 0;
            const hAlign = left ? -width / 2 : right ? width / 2 : 0;
            const dAlign = front ? depth / 2 : back ? -depth / 2 : 0;

            outer.position.set(
                disable || disableX ? 0 : -center.x + hAlign,
                disable || disableY ? 0 : -center.y + vAlign,
                disable || disableZ ? 0 : -center.z + dAlign
            );

            if (this.centered.observed) {
                this.centered.emit({
                    parent: centerGroup.parent!,
                    container: centerGroup,
                    width,
                    height,
                    depth,
                    boundingBox: box3,
                    boundingSphere: sphere,
                    center: center,
                    verticalAlignment: vAlign,
                    horizontalAlignment: hAlign,
                    depthAlignment: dAlign,
                });
            }
        });
    }
}
