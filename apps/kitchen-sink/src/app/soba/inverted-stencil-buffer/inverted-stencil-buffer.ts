import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgtCanvas } from 'angular-three';
import { Experience, invert } from './experience';

@Component({
	standalone: true,
	template: `
		<ngt-canvas [sceneGraph]="scene" [shadows]="true" [gl]="{ stencil: true }" />
		<label class="absolute top-2 right-2 font-mono flex gap-2 items-center">
			<input type="checkbox" [value]="invert()" (change)="onChange($event)" />
			invert
		</label>
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

	onChange(event: Event) {
		const target = event.target as HTMLInputElement;
		this.invert.set(target.checked);
	}
}
