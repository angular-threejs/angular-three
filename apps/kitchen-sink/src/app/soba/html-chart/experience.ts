import {
	afterNextRender,
	ChangeDetectionStrategy,
	Component,
	CUSTOM_ELEMENTS_SCHEMA,
	effect,
	ElementRef,
	inject,
	Injector,
	signal,
	viewChild,
} from '@angular/core';
import { NgtArgs, NgtHTML } from 'angular-three';
import { NgtsOrbitControls } from 'angular-three-soba/controls';
import { NgtsHTML, NgtsHTMLContent } from 'angular-three-soba/misc';

declare const Chart: any;

@Component({
	selector: 'app-chart-container',
	standalone: true,
	template: `
		<canvas #chartContainer></canvas>
	`,
	host: {
		class: 'block w-[320px]',
	},
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartContainer extends NgtHTML {
	private chartContainer = viewChild.required<ElementRef<HTMLCanvasElement>>('chartContainer');
	private data = Array.from({ length: 6 }, () => Math.random() * 100);

	constructor() {
		super();
		// NOTE: I'm doing this dirty because I am lazy.
		const injector = inject(Injector);
		afterNextRender(() => {
			effect(
				(onCleanup) => {
					const chartReady = Experience.chartReady();
					if (!chartReady) return;

					const chart = new Chart(this.chartContainer().nativeElement, {
						type: 'bar',
						data: {
							labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
							datasets: [{ label: '# of Votes', data: this.data, borderWidth: 1 }],
						},
						options: { scales: { y: { beginAtZero: true } } },
					});

					const id = setInterval(() => {
						// randomize the data
						this.data.forEach((_, index) => {
							this.data[index] = Math.random() * 100;
						});
						chart.update();
					}, 1000);
					onCleanup(() => clearInterval(id));
				},
				{ injector },
			);
		});
	}
}

@Component({
	standalone: true,
	template: `
		<ngt-color attach="background" *args="['#f78b3d']" />

		<ngt-ambient-light />
		<ngt-directional-light [intensity]="2 * Math.PI" [position]="3" />

		<ngt-mesh>
			<ngt-box-geometry *args="[8.5, 4, 0.5]" />
			<ngt-mesh-toon-material color="#fbb03b" />

			<ngts-html [options]="{ occlude: true, transform: true, position: [0, 0, 0.3] }">
				<div [ngtsHTMLContent]="{ distanceFactor: 0 }">
					<app-chart-container />
				</div>
			</ngts-html>
		</ngt-mesh>

		<ngts-orbit-controls [options]="{ autoRotate: true }" />
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtArgs, NgtsOrbitControls, NgtsHTML, NgtsHTMLContent, ChartContainer],
})
export class Experience {
	protected Math = Math;

	static chartReady = signal(false);
}
