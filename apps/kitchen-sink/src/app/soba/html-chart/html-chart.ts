import { DOCUMENT } from '@angular/common';
import { afterNextRender, ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { NgtCanvas } from 'angular-three';
import { Experience } from './experience';

@Component({
	standalone: true,
	template: `
		<ngt-canvas [sceneGraph]="sceneGraph" [camera]="{ position: [0, 0, 10] }" />
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'html-chart-soba' },
	imports: [NgtCanvas],
})
export default class HtmlChart {
	sceneGraph = Experience;

	constructor() {
		const document = inject(DOCUMENT);
		let script: HTMLScriptElement | undefined = undefined;

		afterNextRender(() => {
			script = document.createElement('script');
			script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.3.0/dist/chart.umd.min.js';
			document.head.appendChild(script);
			Experience.chartReady.set(true);
		});

		inject(DestroyRef).onDestroy(() => {
			script?.remove();
		});
	}
}
