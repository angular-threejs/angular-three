import { DOCUMENT } from '@angular/common';
import {
	afterNextRender,
	ChangeDetectionStrategy,
	Component,
	DestroyRef,
	effect,
	inject,
	Injector,
} from '@angular/core';
import { NgtCanvas } from 'angular-three';
import { Experience } from './experience';

declare const Chart: any;

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
	protected sceneGraph = Experience;

	constructor() {
		const injector = inject(Injector);
		const document = inject(DOCUMENT);
		let script: HTMLScriptElement | undefined = undefined;

		afterNextRender(() => {
			script = document.createElement('script');
			script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.3.0/dist/chart.umd.min.js';
			document.head.appendChild(script);

			const effectRef = effect(
				(onCleanup) => {
					const id = setInterval(() => {
						if (!!Chart) {
							Experience.chartReady.set(true);
							effectRef.destroy();
						}
					}, 500);
					onCleanup(() => clearInterval(id));
				},
				{ injector },
			);
		});

		inject(DestroyRef).onDestroy(() => {
			script?.remove();
		});
	}
}
