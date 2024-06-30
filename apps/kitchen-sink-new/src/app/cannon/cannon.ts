import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { UiNavigations } from '../shared/ui-navigations';

@Component({
	standalone: true,
	template: `
		<app-ui-navigations [examples]="examples" root="cannon">
			<router-outlet />
		</app-ui-navigations>
	`,
	imports: [RouterOutlet, UiNavigations],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'cannon' },
})
export default class Cannon {
	examples = ['basic', 'kinematic-cube', 'compound', 'chain', 'cube-heap', 'convexpolyhedron', 'monday-morning'];
}
