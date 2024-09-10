import { ChangeDetectionStrategy, Component, computed, Directive, model } from '@angular/core';
import { NgtCanvas } from 'angular-three';
import { debug, interpolate, paused, RapierWrapperDefault } from './wrapper-default';

@Directive({
	selector: 'button[toggleButton]',
	standalone: true,
	host: {
		class: 'border rounded px-2 py-1',
		'(click)': 'onClick()',
		'[class]': 'hbClass()',
	},
})
export class ToggleButton {
	value = model.required<boolean>({ alias: 'toggleButton' });

	hbClass = computed(() => {
		return this.value() ? ['text-white', 'bg-red-600', 'border-red-400'] : ['text-black', 'border-black'];
	});

	onClick() {
		this.value.update((prev) => !prev);
	}
}

@Component({
	standalone: true,
	template: `
		<ngt-canvas [sceneGraph]="sceneGraph" [shadows]="true" [dpr]="1" />
		<div class="absolute top-2 right-2 font-mono flex gap-4">
			<button [(toggleButton)]="debug">debug</button>
			<button [(toggleButton)]="interpolate">interpolate</button>
			<button [(toggleButton)]="paused">paused</button>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtCanvas, ToggleButton],
})
export default class RapierWrapper {
	protected sceneGraph = RapierWrapperDefault;

	protected debug = debug;
	protected interpolate = interpolate;
	protected paused = paused;
}
