import { DOCUMENT } from '@angular/common';
import { computed, Directive, effect, ElementRef, inject, Input } from '@angular/core';
import { addAfterEffect, addEffect, is, NgtAnyRecord, NgtSignalStore } from 'angular-three';
import * as Stats from 'stats.js';

export interface NgtsStatsState {
    showPanel: number;
    right: boolean;
    parent?: HTMLElement;
    classes?: string;
}

@Directive({
    selector: 'ngts-stats',
    standalone: true,
})
export class NgtsStats extends NgtSignalStore<NgtsStatsState> {
    @Input() set showPanel(showPanel: number) {
        this.set({ showPanel });
    }

    @Input() set parent(parent: HTMLElement | ElementRef<HTMLElement>) {
        this.set({ parent: is.ref(parent) ? parent.nativeElement : parent });
    }

    @Input() set classes(classes: string) {
        this.set({ classes });
    }

    @Input() set right(right: boolean) {
        this.set({ right });
    }

    constructor() {
        super({ showPanel: 0, right: false });

        const document = inject(DOCUMENT);
        const stats: Stats = (Stats as NgtAnyRecord)['default']
            ? new (Stats as NgtAnyRecord)['default']()
            : new Stats();

        const showPanel = this.select('showPanel');
        const right = this.select('right');
        const parent = this.select('parent');
        const classes = this.select('classes');
        const trigger = computed(() => ({
            showPanel: showPanel(),
            right: right(),
            parent: parent(),
            classes: classes(),
        }));

        effect((onCleanup) => {
            const { showPanel, right, parent, classes } = trigger();

            const node = parent ?? document.body;
            stats.showPanel(showPanel);
            node.appendChild(stats.dom);
            if (classes) {
                stats.dom.classList.add(...classes.split(' ').filter((cls: string) => cls));
            }
            if (right) {
                stats.dom.style.right = '0px';
                stats.dom.style.left = 'inherit';
            } else {
                stats.dom.style.left = '0px';
                stats.dom.style.right = 'inherit';
            }
            const begin = addEffect(() => stats.begin());
            const end = addAfterEffect(() => stats.end());
            onCleanup(() => {
                node.removeChild(stats.dom);
                begin();
                end();
            });
        });
    }
}
