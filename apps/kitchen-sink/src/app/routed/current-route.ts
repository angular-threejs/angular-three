import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NgtVector3 } from 'angular-three';
import { NgtsText } from 'angular-three-soba/abstractions';

@Component({
	selector: 'app-current-route',
	template: `
		<ngts-text
			[text]="text()"
			[options]="{ fontSize: 14, color: 'black', letterSpacing: -0.025, position: position() }"
		/>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtsText],
})
export class CurrentRoute {
	position = input<NgtVector3>([0, 0, 0]);
	text = input.required<string>();
}
