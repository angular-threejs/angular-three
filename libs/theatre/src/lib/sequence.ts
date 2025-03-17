import { computed, Directive, effect, inject, input, model, untracked } from '@angular/core';
import { type ISequence, onChange, val } from '@theatre/core';
import { omit, pick } from 'angular-three';
import { mergeInputs } from 'ngxtension/inject-inputs';
import { TheatreProject } from './project';
import { TheatreSheet } from './sheet';

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

export type TheatreSequenceOptions = Parameters<ISequence['play']>[0] & {
	autoplay: boolean;
	autopause: boolean;
	delay: number;
	autoreset?: 'init' | 'destroy' | 'always';
};

const defaultOptions: TheatreSequenceOptions = {
	rate: 1,
	autoplay: false,
	autopause: false,
	delay: 0,
};

@Directive({ selector: '[sheet][sequence]', exportAs: 'sequence' })
export class TheatreSequence {
	options = input(defaultOptions, { alias: 'sequence', transform: mergeInputs(defaultOptions) });
	audioOptions = input<AttachAudioOptions | undefined>(undefined, { alias: 'sequenceAudio' });

	position = model<number>(0);
	playing = model<boolean>(false);
	length = model<number>(0);

	private playOptions = omit(this.options, ['autoplay', 'autopause', 'delay', 'autoreset']);
	private autoplay = pick(this.options, 'autoplay');
	private autopause = pick(this.options, 'autopause');
	private autoreset = pick(this.options, 'autoreset');
	private delay = pick(this.options, 'delay');

	private project = inject(TheatreProject);
	private sheet = inject(TheatreSheet, { host: true });
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

	pause() {
		const sequence = this.sequence();
		sequence.pause();
	}

	play(options: Parameters<ISequence['play']>[0] = {}) {
		const sequence = this.sequence();
		const project = this.project.project();

		project.ready.then(() => {
			sequence.play({ ...this.playOptions(), ...options });
		});
	}

	reset() {
		const sequence = this.sequence();
		const isPlaying = val(sequence.pointer.playing);
		sequence.position = 0;
		if (isPlaying) this.play();
	}
}
