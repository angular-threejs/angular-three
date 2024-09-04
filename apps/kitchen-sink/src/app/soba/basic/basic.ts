import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgtCanvas } from 'angular-three';
import { Experience, bloom, glitch, selectedAction } from './experience';

@Component({
	standalone: true,
	template: `
		<ngt-canvas [sceneGraph]="scene" [camera]="{ fov: 75, position: [0, 0, 3] }" [shadows]="true" />
		<div class="absolute top-0 right-0 flex flex-col">
			<select [value]="selectedAction()" (change)="selectedAction.set($any($event.target).value)">
				<option>Strut</option>
				<option>Dance</option>
				<option>Idle</option>
			</select>

			<div class="text-white">
				<label for="bloom">Bloom</label>
				<input id="bloom" type="checkbox" [checked]="bloom()" (change)="bloom.set($any($event.target).checked)" />
			</div>

			<div class="text-white">
				<label for="glitch">Glitch</label>
				<input id="glitch" type="checkbox" [checked]="glitch()" (change)="glitch.set($any($event.target).checked)" />
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtCanvas],
	host: { class: 'basic-soba' },
})
export default class Basic {
	protected scene = Experience;
	protected selectedAction = selectedAction;
	protected bloom = bloom;
	protected glitch = glitch;
}
