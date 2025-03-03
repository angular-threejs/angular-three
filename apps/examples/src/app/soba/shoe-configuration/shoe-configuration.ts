import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgtCanvas } from 'angular-three/dom';
import { SceneGraph, state } from './scene';

@Component({
	template: `
		<ngt-canvas shadows [camera]="{ position: [0, 0, 4], fov: 45 }">
			<app-scene-graph *canvasContent />
		</ngt-canvas>
		@let current = state.current();
		<div [class.block]="!!current" [class.hidden]="!current" class="absolute top-4 left-4">
			@if (current) {
				<input type="color" [value]="$any(state.items)[current]()" (input)="onChange($event, current)" />
				<h1 class="text-xl font-bold font-mono">{{ current }}</h1>
			}
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'soba-shoe-configuration' },
	imports: [NgtCanvas, SceneGraph],
})
export default class ShoeConfiguration {
	protected readonly state = state;

	onChange(event: Event, current: string) {
		const target = event.target as HTMLInputElement;
		this.state.update((state) => ({ items: { ...state.items, [current]: target.value } }));
	}
}
