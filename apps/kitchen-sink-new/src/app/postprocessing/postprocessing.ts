import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { UiNavigations } from '../shared/ui-navigations';

@Component({
	standalone: true,
	template: `
		<app-ui-navigations [examples]="examples" root="postprocessing">
			<router-outlet />
		</app-ui-navigations>
	`,
	imports: [RouterOutlet, UiNavigations],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'postprocessing' },
})
export default class Postprocessing {
	examples = ['basic'];
}
