import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, effect, Input } from '@angular/core';
import { extend, injectNgtRef, NgtSignalStore, type NgtBeforeRenderEvent, type NgtLOD } from 'angular-three';
import { LOD } from 'three';

extend({ LOD });

export interface NgtsDetailedState {
    distances: number[];
}

declare global {
    interface HTMLElementTagNameMap {
        'ngts-detailed': NgtsDetailedState & NgtLOD;
    }
}

@Component({
    selector: 'ngts-detailed',
    standalone: true,
    template: `
        <ngt-lOD ngtCompound [ref]="lodRef" (beforeRender)="onLODBeforeRender($event)">
            <ng-content />
        </ngt-lOD>
    `,
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsDetailed extends NgtSignalStore<NgtsDetailedState> {
    @Input() lodRef = injectNgtRef<LOD>();

    @Input({ required: true }) set distances(distances: number[]) {
        this.set({ distances });
    }

    constructor() {
        super();
        this.#updateChildren();
    }

    onLODBeforeRender({ object, state }: NgtBeforeRenderEvent<THREE.LOD>) {
        object.update(state.camera);
    }

    #updateChildren() {
        const trigger = computed(() => {
            const children = this.lodRef.children();
            const distances = this.select('distances');
            return { children: children(), distances: distances() };
        });
        effect(() => {
            const { children, distances } = trigger();
            const lod = this.lodRef.untracked;
            if (lod) {
                lod.levels.length = 0;
                children.forEach((child, index) => {
                    lod.addLevel(child, distances[index]);
                });
            }
        });
    }
}
