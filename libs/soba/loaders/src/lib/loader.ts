import {
	ChangeDetectionStrategy,
	Component,
	ElementRef,
	computed,
	effect,
	input,
	signal,
	untracked,
	viewChild,
} from '@angular/core';
import { pick } from 'angular-three';
import { mergeInputs } from 'ngxtension/inject-inputs';
import { injectProgress } from './progress';

const defaultDataInterpolation = (p: number) => `Loading ${p.toFixed(2)}%`;

export interface NgtsLoaderOptions {
	containerClass?: string;
	innerClass?: string;
	barClass?: string;
	dataClass?: string;
	dataInterpolation: (value: number) => string;
	initialState: (value: boolean) => boolean;
}

const defaultOptions: NgtsLoaderOptions = {
	containerClass: '',
	innerClass: '',
	barClass: '',
	dataClass: '',
	dataInterpolation: defaultDataInterpolation,
	initialState: (value) => value,
};

@Component({
	selector: 'ngts-loader',
	standalone: true,
	template: `
		@if (shown()) {
			<div
				class="ngts-loader-container"
				[class]="containerClass() || ''"
				[style.--ngts-loader-container-opacity]="active() ? 1 : 0"
			>
				<div>
					<div class="ngts-loader-inner" [class]="innerClass() || ''">
						<div
							class="ngts-loader-bar"
							[class]="barClass() || ''"
							[style.--ngts-loader-bar-scale]="progress() / 100"
						></div>
						<span #progressSpanRef class="ngts-loader-data" [class]="dataClass() || ''"></span>
					</div>
				</div>
			</div>
		}
	`,
	styleUrls: ['./loader.css'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgtsLoader {
	private progressState = injectProgress();

	active = computed(() => this.progressState().active);
	progress = computed(() => this.progressState().progress);

	options = input(defaultOptions, { transform: mergeInputs(defaultOptions) });

	containerClass = pick(this.options, 'containerClass');
	innerClass = pick(this.options, 'innerClass');
	barClass = pick(this.options, 'barClass');
	dataClass = pick(this.options, 'dataClass');
	initialState = pick(this.options, 'initialState');
	dataInterpolation = pick(this.options, 'dataInterpolation');

	progressSpanRef = viewChild<ElementRef<HTMLSpanElement>>('progressSpanRef');

	shown = signal(this.initialState()(this.active()));

	constructor() {
		this.setShown();
		this.updateProgress();
	}

	private setShown() {
		effect((onCleanup) => {
			const [active, lastShown] = [this.active(), untracked(this.shown)];
			if (lastShown !== active) {
				const timeoutId = setTimeout(() => {
					this.shown.set(active);
				}, 300);
				onCleanup(() => clearTimeout(timeoutId));
			}
		});
	}

	private updateProgress() {
		let progressRef = 0;
		let rafId: ReturnType<typeof requestAnimationFrame>;

		effect((onCleanup) => {
			const [dataInterpolation, progress] = [this.dataInterpolation(), this.progress()];
			const updateProgress = () => {
				const progressSpan = this.progressSpanRef()?.nativeElement;
				if (!progressSpan) return;
				progressRef += (progress - progressRef) / 2;
				if (progressRef > 0.95 * progress || progress === 100) progressRef = progress;
				progressSpan.innerText = dataInterpolation(progressRef);
				if (progressRef < progress) {
					rafId = requestAnimationFrame(updateProgress);
				}
			};
			updateProgress();
			onCleanup(() => cancelAnimationFrame(rafId));
		});
	}
}
