import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgtCanvas } from 'angular-three/dom';
import { SceneGraph, invert, logo } from './scene';

@Component({
	template: `
		<ngt-canvas shadows [gl]="{ stencil: true }">
			<app-inverted-stencil-buffer-scene-graph *canvasContent />
		</ngt-canvas>
		<div
			class="absolute top-2 right-2 p-4 flex flex-col gap-4 items-center rounded border border-black border-dotted font-mono"
		>
			<label class="flex gap-2 items-center">
				<input type="checkbox" [value]="invert()" (change)="onInvertChange($event)" />
				invert
			</label>
			<select [value]="logo()" (change)="onLogoChange($event)">
				<option value="angular">Angular</option>
				<option value="nx">Nx</option>
				<option value="nx-cloud">Nx Cloud</option>
			</select>
		</div>
	`,
	host: { class: 'inverted-stencil-buffer-soba' },
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtCanvas, SceneGraph],
})
export default class InvertedStencilBuffer {
	protected invert = invert;
	protected logo = logo;

	onInvertChange(event: Event) {
		const target = event.target as HTMLInputElement;
		this.invert.set(target.checked);
	}

	onLogoChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		this.logo.set(target.value as 'angular' | 'nx' | 'nx-cloud');
	}
}
