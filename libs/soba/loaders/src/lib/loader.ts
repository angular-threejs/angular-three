import {
	ChangeDetectionStrategy,
	Component,
	ElementRef,
	effect,
	input,
	signal,
	untracked,
	viewChild,
} from '@angular/core';
import { pick } from 'angular-three';
import { mergeInputs } from 'ngxtension/inject-inputs';
import { progress } from './progress';

const defaultDataInterpolation = (p: number) => `Loading ${p.toFixed(2)}%`;

/**
 * Configuration options for the NgtsLoader component.
 */
export interface NgtsLoaderOptions {
	/**
	 * CSS class to apply to the outer container element.
	 * @default ''
	 */
	containerClass?: string;
	/**
	 * CSS class to apply to the inner wrapper element.
	 * @default ''
	 */
	innerClass?: string;
	/**
	 * CSS class to apply to the progress bar element.
	 * @default ''
	 */
	barClass?: string;
	/**
	 * CSS class to apply to the data/percentage text element.
	 * @default ''
	 */
	dataClass?: string;
	/**
	 * Function to format the progress percentage display text.
	 * @param value - Current progress value (0-100)
	 * @returns Formatted string to display
	 * @default (p) => `Loading ${p.toFixed(2)}%`
	 */
	dataInterpolation: (value: number) => string;
	/**
	 * Function to determine initial visibility state.
	 * @param value - Current active loading state
	 * @returns Whether the loader should be shown initially
	 * @default (value) => value
	 */
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

/**
 * A loading indicator component that displays asset loading progress.
 *
 * This component automatically tracks Three.js asset loading progress using the
 * DefaultLoadingManager and displays an animated progress bar with percentage.
 *
 * The loader fades in when loading starts and fades out when complete.
 * CSS classes can be customized via options for styling flexibility.
 *
 * @example
 * ```html
 * <!-- Basic usage -->
 * <ngts-loader />
 *
 * <!-- With custom options -->
 * <ngts-loader [options]="{
 *   containerClass: 'my-loader',
 *   dataInterpolation: (p) => `${Math.round(p)}% loaded`
 * }" />
 * ```
 */
@Component({
	selector: 'ngts-loader',
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
	private progressState = progress();

	protected active = this.progressState.active;
	protected progress = this.progressState.progress;

	/**
	 * Configuration options for the loader appearance and behavior.
	 */
	options = input(defaultOptions, { transform: mergeInputs(defaultOptions) });

	protected containerClass = pick(this.options, 'containerClass');
	protected innerClass = pick(this.options, 'innerClass');
	protected barClass = pick(this.options, 'barClass');
	protected dataClass = pick(this.options, 'dataClass');
	private initialState = pick(this.options, 'initialState');
	private dataInterpolation = pick(this.options, 'dataInterpolation');

	private progressSpanRef = viewChild<ElementRef<HTMLSpanElement>>('progressSpanRef');

	protected shown = signal(this.initialState()(this.active()));

	constructor() {
		effect((onCleanup) => {
			const [active, lastShown] = [this.active(), untracked(this.shown)];
			if (lastShown !== active) {
				const timeoutId = setTimeout(() => {
					this.shown.set(active);
				}, 300);
				onCleanup(() => clearTimeout(timeoutId));
			}
		});

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
