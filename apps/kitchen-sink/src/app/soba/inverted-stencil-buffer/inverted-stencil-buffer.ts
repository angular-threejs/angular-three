import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgtCanvas } from 'angular-three';
import { Experience, invert, logo } from './experience';

@Component({
	standalone: true,
	template: `
		<ngt-canvas [sceneGraph]="scene" [shadows]="true" [gl]="{ stencil: true }" />
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

		<a
			class="absolute top-2 left-2 font-mono underline"
			href="https://pmndrs.github.io/examples/demos/inverted-stencil-buffer"
			target="_blank"
		>
			credit: R3F Inverted Stencil Buffer
		</a>
	`,
	host: { class: 'inverted-stencil-buffer-soba' },
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtCanvas],
})
export default class InvertedStencilBuffer {
	protected scene = Experience;
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
