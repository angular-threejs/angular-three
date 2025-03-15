import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, input } from '@angular/core';
import { TheatreProject } from './project';

@Component({
	selector: 'theatre-sheet',
	template: `
		<ng-content />
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TheatreSheet {
	name = input('default-theatre-sheet');

	private project = inject(TheatreProject);

	sheet = computed(() => {
		const name = this.name();
		const existing = this.project.sheets[name] || [];

		if (existing[0]) {
			existing[1]++;
			return existing[0];
		}

		const sheet = this.project.project().sheet(name);
		this.project.sheets[name] = [sheet, 1];
		return sheet;
	});

	constructor() {
		inject(DestroyRef).onDestroy(() => {
			const existing = this.project.sheets[this.name()];
			if (!existing) return;

			if (existing[1] >= 1) {
				existing[1]--;
			}

			if (existing[1] === 0) {
				delete this.project.sheets[this.name()];
			}
		});
	}
}
