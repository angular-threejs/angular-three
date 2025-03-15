import { ChangeDetectionStrategy, Component, computed, effect, input } from '@angular/core';
import { getProject, type IProjectConfig, type ISheet } from '@theatre/core';

@Component({
	selector: 'theatre-project',
	template: `
		<ng-content />
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TheatreProject {
	name = input('default-theatre-project');
	config = input<IProjectConfig>({});

	project = computed(() => getProject(this.name(), this.config()));
	sheets: Record<string, [sheet: ISheet, count: number]> = {};

	constructor() {
		effect(() => {
			const project = this.project();
			project.ready.then();
		});
	}
}
