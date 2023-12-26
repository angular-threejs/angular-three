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
import { signalStore } from 'angular-three-old';
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
					<div class="ngts-loader-bar" [class]="bar() || ''" [style.--ngts-loader-bar-scale]="progress() / 100"></div>
					<span #progressSpanRef class="ngts-loader-data" [class]="data() || ''"></span>
				</div>
			</div>
		</div>
	`,
	styleUrls: ['./loader.css'],
	imports: [NgIf],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgtsLoader {
	private inputs = signalStore<NgtsLoaderState>({
		dataInterpolation: defaultDataInterpolation,
		initialState: (active) => active,
	});

	private progressState = injectNgtsProgress();

	active = computed(() => this.progressState().active);
	progress = computed(() => this.progressState().progress);

	container = this.inputs.select('containerClass');
	inner = this.inputs.select('innerClass');
	bar = this.inputs.select('barClass');
	data = this.inputs.select('dataClass');

	@Input({ alias: 'containerClass' }) set _containerClass(containerClass: string) {
		this.inputs.set({ containerClass });
	}

	@Input({ alias: 'innerClass' }) set _innerClass(innerClass: string) {
		this.inputs.set({ innerClass });
	}

	@Input({ alias: 'barClass' }) set _barClass(barClass: string) {
		this.inputs.set({ barClass });
	}

	@Input({ alias: 'dataClass' }) set _dataClass(dataClass: string) {
		this.inputs.set({ dataClass });
	}

	@Input({ alias: 'dataInterpolation' }) set _dataInterpolation(dataInterpolation: (value: number) => string) {
		this.inputs.set({ dataInterpolation });
	}

	@Input({ alias: 'initialState' }) set _initialState(initialState: (value: boolean) => boolean) {
		this.inputs.set({ initialState });
	}

	@ViewChild('progressSpanRef') progressSpanRef?: ElementRef<HTMLSpanElement>;

	shown = signal(this.inputs.get('initialState')(this.active()));

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

		const _dataInterpolation = this.inputs.select('dataInterpolation');

		effect((onCleanup) => {
			const [dataInterpolation, progress] = [_dataInterpolation(), this.progress()];
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
