import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, inject, viewChild } from '@angular/core';
import { SCROLL } from './camera-scroll';

@Component({
	selector: 'app-overlay',
	templateUrl: './overlay.html',
	changeDetection: ChangeDetectionStrategy.OnPush,
	styleUrl: './overlay.css',
})
export class Overlay {
	private captionRef = viewChild.required<ElementRef<HTMLSpanElement>>('caption');

	private document = inject(DOCUMENT);
	private scroll = inject(SCROLL);

	onScroll(event: Event) {
		const window = this.document.defaultView;
		if (!window) return;

		const target = event.target as HTMLDivElement;
		this.scroll.value = target.scrollTop / (target.scrollHeight - window.innerHeight);
		this.captionRef().nativeElement.innerText = this.scroll.value.toFixed(2);
	}
}
