import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AudioStore } from './audio.store';
import { tracks, zoomIndex, zoomTrack } from './tracks';

@Component({
	selector: 'app-overlay',
	standalone: true,
	template: `
		<div
			[class.cursor-pointer]="audioStore.loaded()"
			class="absolute left-0 top-0 flex h-screen w-screen flex-col items-center justify-center gap-2 font-mono transition"
			[class]="audioStore.clicked() ? ['pointer-events-none', 'opacity-0'] : []"
		>
			@if (audioStore.loaded()) {
				<span>This sandbox needs</span>
				<span>user interaction for audio</span>
				<strong>(loud audio warning!!!!!)</strong>
				<button
					class="cursor-pointer self-center rounded border border-b-4 border-transparent border-b-gray-400 bg-white px-10 py-2"
					(click)="onClick()"
				>
					▶︎
				</button>
			} @else {
				<span>loading</span>
			}
		</div>
		<div
			class="absolute top-2 left-0 flex w-full items-center justify-between px-2 opacity-0"
			[class.opacity-100]="audioStore.clicked()"
		>
			<div class="flex flex-col gap-2 text-black">
				<code>
					Camera currently reacts to:
					<button
						class="rounded border border-b-4 border-transparent border-b-gray-400 bg-white px-4 py-1 text-black"
						(click)="onChangeZoomTrack()"
					>
						{{ zoomTrack() }}
					</button>
				</code>
				<code>
					credits:
					<a class="underline" href="https://pmndrs.github.io/examples/demos/simple-audio-analyser" target="_blank">
						R3F Simple Sound Analyser
					</a>
				</code>
			</div>
			<code class="text-black">Triplet After Triplet · SEGA · Hidenori Shoji</code>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	styles: `
		:host > div:first-child {
			background: linear-gradient(15deg, rgb(82, 81, 88) 0%, rgb(255, 247, 248) 100%);
		}
	`,
})
export class Overlay {
	protected audioStore = inject(AudioStore);
	protected readonly zoomTrack = zoomTrack;

	onClick() {
		if (this.audioStore.loaded()) {
			this.audioStore.start();
		}
	}

	onChangeZoomTrack() {
		zoomIndex.update((current) => {
			let nextRandom = Math.floor(Math.random() * tracks.length);
			while (nextRandom === current) {
				nextRandom = Math.floor(Math.random() * tracks.length);
			}
			return nextRandom;
		});
	}
}
