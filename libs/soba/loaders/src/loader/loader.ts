import { NgIf } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    ElementRef,
    Input,
    ViewChild,
    computed,
    effect,
    signal,
    untracked,
} from '@angular/core';
import { NgtSignalStore } from 'angular-three';
import { injectNgtsProgress } from '../progress/progress';

const defaultDataInterpolation = (p: number) => `Loading ${p.toFixed(2)}%`;

export interface NgtsLoaderState {
    containerClass?: string;
    innerClass?: string;
    barClass?: string;
    dataClass?: string;
    dataInterpolation: (value: number) => string;
    initialState: (value: boolean) => boolean;
}

@Component({
    selector: 'ngts-loader',
    standalone: true,
    template: `
        <div
            *ngIf="shown()"
            class="ngts-loader-container"
            [class]="container() || ''"
            [style.--ngts-loader-container-opacity]="active() ? 1 : 0"
        >
            <div>
                <div class="ngts-loader-inner" [class]="inner() || ''">
                    <div
                        class="ngts-loader-bar"
                        [class]="bar() || ''"
                        [style.--ngts-loader-bar-scale]="progress() / 100"
                    ></div>
                    <span #progressSpanRef class="ngts-loader-data" [class]="data() || ''"></span>
                </div>
            </div>
        </div>
    `,
    styleUrls: ['./loader.css'],
    imports: [NgIf],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgtsLoader extends NgtSignalStore<NgtsLoaderState> {
    readonly #progress = injectNgtsProgress();

    readonly active = computed(() => this.#progress().active);
    readonly progress = computed(() => this.#progress().progress);

    readonly container = this.select('containerClass');
    readonly inner = this.select('innerClass');
    readonly bar = this.select('barClass');
    readonly data = this.select('dataClass');

    @Input() set containerClass(containerClass: string) {
        this.set({ containerClass });
    }

    @Input() set innerClass(innerClass: string) {
        this.set({ innerClass });
    }

    @Input() set barClass(barClass: string) {
        this.set({ barClass });
    }

    @Input() set dataClass(dataClass: string) {
        this.set({ dataClass });
    }

    @Input() set dataInterpolation(dataInterpolation: (value: number) => string) {
        this.set({ dataInterpolation });
    }

    @Input() set initialState(initialState: (value: boolean) => boolean) {
        this.set({ initialState });
    }

    @ViewChild('progressSpanRef') progressSpanRef?: ElementRef<HTMLSpanElement>;

    readonly shown = signal(this.get('initialState')(this.active()));

    constructor() {
        super({ dataInterpolation: defaultDataInterpolation, initialState: (active: boolean) => active });
        this.#setShown();
        this.#updateProgress();
    }

    #setShown() {
        effect(
            (onCleanup) => {
                const active = this.active();
                const lastShown = untracked(this.shown);
                if (lastShown !== active) {
                    const timeoutId = setTimeout(() => {
                        this.shown.set(active);
                    }, 300);
                    onCleanup(() => clearTimeout(timeoutId));
                }
            },
            { allowSignalWrites: true }
        );
    }

    #updateProgress() {
        let progressRef = 0;
        let rafId: ReturnType<typeof requestAnimationFrame>;

        const dataInterpolation = this.select('dataInterpolation');
        const trigger = computed(() => ({ dataInterpolation: dataInterpolation(), progress: this.progress() }));

        effect((onCleanup) => {
            const { dataInterpolation, progress } = trigger();

            const updateProgress = () => {
                if (!this.progressSpanRef?.nativeElement) return;
                progressRef += (progress - progressRef) / 2;
                if (progressRef > 0.95 * progress || progress === 100) progressRef = progress;
                this.progressSpanRef.nativeElement.innerText = dataInterpolation(progressRef);
                if (progressRef < progress) {
                    rafId = requestAnimationFrame(updateProgress);
                }
            };
            updateProgress();
            onCleanup(() => cancelAnimationFrame(rafId));
        });
    }
}
