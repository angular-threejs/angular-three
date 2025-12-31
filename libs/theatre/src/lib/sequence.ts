import { computed, Directive, effect, inject, input, model, untracked } from '@angular/core';
import { type ISequence, onChange, val } from '@theatre/core';
import { omit, pick } from 'angular-three';
import { mergeInputs } from 'ngxtension/inject-inputs';
import { TheatreProject } from './project';
import { TheatreSheet } from './sheet';

/**
 * Options for attaching audio to a Theatre.js sequence.
 *
 * When audio is attached, the sequence playback will be synchronized
 * with the audio playback.
 */
export interface AttachAudioOptions {
	/**
	 * Either a URL to the audio file (eg "http://localhost:3000/audio.mp3") or an instance of AudioBuffer
	 */
	source: string | AudioBuffer;
	/**
	 * An optional AudioContext. If not provided, one will be created.
	 */
	audioContext?: AudioContext;
	/**
	 * An AudioNode to feed the audio into. Will use audioContext.destination if not provided.
	 */
	destinationNode?: AudioNode;
}

/**
 * Configuration options for the TheatreSequence directive.
 *
 * Extends Theatre.js sequence play options with additional Angular-specific options
 * for automatic playback control.
 */
export type TheatreSequenceOptions = Parameters<ISequence['play']>[0] & {
	/**
	 * Whether to automatically start playback when the sequence is initialized.
	 * @default false
	 */
	autoplay: boolean;
	/**
	 * Whether to automatically pause playback when the directive is destroyed.
	 * @default false
	 */
	autopause: boolean;
	/**
	 * Delay in milliseconds before autoplay starts.
	 * @default 0
	 */
	delay: number;
	/**
	 * When to reset the sequence position to 0.
	 * - 'init': Reset when the directive is initialized
	 * - 'destroy': Reset when the directive is destroyed
	 * - 'always': Reset on both init and destroy
	 */
	autoreset?: 'init' | 'destroy' | 'always';
};

const defaultOptions: TheatreSequenceOptions = {
	rate: 1,
	autoplay: false,
	autopause: false,
	delay: 0,
};

/**
 * Directive that provides control over a Theatre.js sequence.
 *
 * A sequence controls the playback of animations within a sheet. This directive
 * provides methods to play, pause, and reset the sequence, as well as reactive
 * signals for the current position, playing state, and length.
 *
 * Must be used on an element that also has the `sheet` directive.
 *
 * @example
 * ```html
 * <ng-container sheet="scene" [sequence]="{ autoplay: true, rate: 1 }" #seq="sequence">
 *   <p>Position: {{ seq.position() }}</p>
 *   <button (click)="seq.play()">Play</button>
 *   <button (click)="seq.pause()">Pause</button>
 * </ng-container>
 * ```
 *
 * @example
 * ```html
 * <!-- With audio synchronization -->
 * <ng-container
 *   sheet="scene"
 *   [sequence]="{ autoplay: true }"
 *   [sequenceAudio]="{ source: '/audio/soundtrack.mp3' }"
 * />
 * ```
 */
@Directive({ selector: '[sheet][sequence]', exportAs: 'sequence' })
export class TheatreSequence {
	/**
	 * Sequence configuration options.
	 * Merged with default options using ngxtension's mergeInputs.
	 *
	 * @default { rate: 1, autoplay: false, autopause: false, delay: 0 }
	 */
	options = input(defaultOptions, { alias: 'sequence', transform: mergeInputs(defaultOptions) });

	/**
	 * Audio options for synchronizing playback with an audio file.
	 * When provided, the sequence will be synchronized with the audio.
	 */
	audioOptions = input<AttachAudioOptions | undefined>(undefined, { alias: 'sequenceAudio' });

	/**
	 * Two-way bindable signal for the current playback position in seconds.
	 *
	 * @default 0
	 */
	position = model<number>(0);

	/**
	 * Two-way bindable signal indicating whether the sequence is currently playing.
	 *
	 * @default false
	 */
	playing = model<boolean>(false);

	/**
	 * Two-way bindable signal for the total length of the sequence in seconds.
	 *
	 * @default 0
	 */
	length = model<number>(0);

	private playOptions = omit(this.options, ['autoplay', 'autopause', 'delay', 'autoreset']);
	private autoplay = pick(this.options, 'autoplay');
	private autopause = pick(this.options, 'autopause');
	private autoreset = pick(this.options, 'autoreset');
	private delay = pick(this.options, 'delay');

	private project = inject(TheatreProject);
	private sheet = inject(TheatreSheet, { host: true });

	/**
	 * Computed signal containing the Theatre.js sequence instance.
	 */
	sequence = computed(() => this.sheet.sheet().sequence);

	constructor() {
		effect((onCleanup) => {
			const autoplay = untracked(this.autoplay);
			if (!autoplay) return;

			const delay = untracked(this.delay);
			const id = setTimeout(() => {
				untracked(() => this.play());
			}, delay);

			onCleanup(() => {
				clearTimeout(id);
			});
		});

		effect((onCleanup) => {
			const autopause = untracked(this.autopause);
			onCleanup(() => {
				if (autopause) {
					this.pause();
				}
			});
		});

		effect((onCleanup) => {
			const autoreset = untracked(this.autoreset);
			if (autoreset === 'init' || autoreset === 'always') {
				untracked(() => this.reset());
			}

			onCleanup(() => {
				if (autoreset === 'destroy' || autoreset === 'always') {
					untracked(() => this.reset());
				}
			});
		});

		effect(() => {
			const [audioOptions, sequence] = [this.audioOptions(), untracked(this.sequence)];
			if (audioOptions) sequence.attachAudio(audioOptions);
		});

		effect(() => {
			const [playOptions, sequence] = [this.playOptions(), untracked(this.sequence)];
			const isPlaying = val(sequence.pointer.playing);
			if (isPlaying) {
				this.pause();
				this.play(playOptions);
			}
		});

		effect((onCleanup) => {
			const sequence = this.sequence();

			const cleanups: Array<() => void> = [];

			cleanups.push(
				onChange(sequence.pointer.position, (value) => this.position.set(value)),
				onChange(sequence.pointer.playing, (value) => this.playing.set(value)),
				onChange(sequence.pointer.length, (value) => this.length.set(value)),
			);

			onCleanup(() => {
				cleanups.forEach((cleanup) => cleanup());
			});
		});
	}

	/**
	 * Pauses the sequence playback at the current position.
	 */
	pause() {
		const sequence = this.sequence();
		sequence.pause();
	}

	/**
	 * Starts or resumes sequence playback.
	 *
	 * Waits for the project to be ready before starting playback.
	 * Options are merged with the configured play options.
	 *
	 * @param options - Optional play options that override the configured options
	 */
	play(options: Parameters<ISequence['play']>[0] = {}) {
		const sequence = this.sequence();
		const project = this.project.project();

		project.ready.then(() => {
			sequence.play({ ...this.playOptions(), ...options });
		});
	}

	/**
	 * Resets the sequence position to 0.
	 *
	 * If the sequence was playing before reset, it will continue playing
	 * from the beginning.
	 */
	reset() {
		const sequence = this.sequence();
		const isPlaying = val(sequence.pointer.playing);
		sequence.position = 0;
		if (isPlaying) this.play();
	}
}
