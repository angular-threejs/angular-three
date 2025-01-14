import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, signal } from '@angular/core';
import { NgtArgs } from 'angular-three';

@Component({
	selector: 'app-scene',
	template: `
		<ngt-mesh>
			<ngt-box-geometry *args="[2, 2, 2]" />
			<ngt-mesh-basic-material [color]="color()" />
		</ngt-mesh>
	`,
	imports: [NgtArgs],
	changeDetection: ChangeDetectionStrategy.OnPush,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class Scene {
	color = signal('hotpink');
}
