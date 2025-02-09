import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgtCanvas } from 'angular-three/dom';
import { SceneGraph, bloom, glitch, selectedAction } from './scene';

@Component({
	template: `
		<ngt-canvas [camera]="{ fov: 75, position: [0, 0, 3] }" shadows>
			<app-basic-scene-graph *canvasContent />
		</ngt-canvas>
		<div class="absolute top-0 right-0 flex flex-col">
			<select [value]="selectedAction()" #select (change)="selectedAction.set(select.value)">
				<option>Strut</option>
				<option>Dance</option>
				<option>Idle</option>
			</select>

			<div class="text-white">
				<label for="bloom">Bloom</label>
				<input id="bloom" type="checkbox" #bloomInput [checked]="bloom()" (change)="bloom.set(bloomInput.checked)" />
			</div>

			<div class="text-white">
				<label for="glitch">Glitch</label>
				<input
					id="glitch"
					type="checkbox"
					#glitchInput
					[checked]="glitch()"
					(change)="glitch.set(glitchInput.checked)"
				/>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtCanvas, SceneGraph],
	host: { class: 'basic-soba' },
})
export default class Basic {
	protected selectedAction = selectedAction;
	protected bloom = bloom;
	protected glitch = glitch;
}
