import { computed, DestroyRef, Directive, inject, input } from '@angular/core';
import { TheatreProject } from './project';

/**
 * Directive that creates and manages a Theatre.js sheet within a project.
 *
 * A sheet is a container for sheet objects and their animations. Multiple sheets
 * can exist within a project, allowing you to organize animations into logical groups.
 *
 * The directive automatically handles reference counting and cleanup when the
 * directive is destroyed.
 *
 * @example
 * ```html
 * <theatre-project>
 *   <ng-container sheet="mainScene">
 *     <!-- sheet objects here -->
 *   </ng-container>
 * </theatre-project>
 * ```
 *
 * @example
 * ```html
 * <!-- Using with template reference -->
 * <ng-container sheet="mySheet" #sheetRef="sheet">
 *   {{ sheetRef.sheet().sequence.position }}
 * </ng-container>
 * ```
 */
@Directive({ selector: '[sheet]', exportAs: 'sheet' })
export class TheatreSheet {
	/**
	 * The name of the sheet within the project.
	 * This name must be unique within the parent project.
	 *
	 * @default 'default-theatre-sheet'
	 */
	name = input('default-theatre-sheet', {
		transform: (value: string) => {
			if (value === '') return 'default-theatre-sheet';
			return value;
		},
		alias: 'sheet',
	});

	private project = inject(TheatreProject);

	/**
	 * Computed signal containing the Theatre.js sheet instance.
	 * Returns an existing sheet if one with the same name already exists,
	 * otherwise creates a new sheet.
	 */
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
