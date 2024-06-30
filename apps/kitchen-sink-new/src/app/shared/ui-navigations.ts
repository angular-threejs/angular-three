import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
	selector: 'app-ui-navigations',
	standalone: true,
	template: `
		<div class="h-svh">
			<ng-content />
		</div>

		<ul class=" absolute left-12 bottom-12 grid grid-cols-6 gap-4">
			@for (example of examples(); track example) {
				<li class="h-6 w-6">
					<a
						routerLinkActive
						#rla="routerLinkActive"
						class="inline-block h-full w-full rounded-full"
						[class]="rla.isActive ? 'bg-red-500' : 'bg-white'"
						[routerLinkActiveOptions]="{ exact: true }"
						[routerLink]="['/', root(), example]"
						[title]="'Navigate to ' + example"
					></a>
				</li>
			}
		</ul>
	`,
	imports: [RouterLink, RouterLinkActive],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiNavigations {
	examples = input.required<string[]>();
	root = input.required<string>();
}
