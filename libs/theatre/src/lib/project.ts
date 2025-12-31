import { ChangeDetectionStrategy, Component, computed, effect, input } from '@angular/core';
import { getProject, type IProjectConfig, type ISheet } from '@theatre/core';

/**
 * Component that creates and manages a Theatre.js project.
 *
 * A Theatre.js project is the top-level container for all animation data.
 * It contains sheets, which in turn contain sheet objects that hold animatable properties.
 *
 * @example
 * ```html
 * <theatre-project name="my-animation" [config]="{ state: savedState }">
 *   <ng-container sheet="scene1">
 *     <!-- sheet objects here -->
 *   </ng-container>
 * </theatre-project>
 * ```
 */
@Component({
	selector: 'theatre-project',
	template: `
		<ng-content />
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TheatreProject {
	/**
	 * The name of the Theatre.js project.
	 * This name is used to identify the project and must be unique.
	 *
	 * @default 'default-theatre-project'
	 */
	name = input('default-theatre-project');

	/**
	 * Configuration options for the Theatre.js project.
	 * Can include saved state data for restoring animations.
	 *
	 * @default {}
	 */
	config = input<IProjectConfig>({});

	/**
	 * Computed signal containing the Theatre.js project instance.
	 */
	project = computed(() => getProject(this.name(), this.config()));

	/**
	 * Internal registry of sheets created within this project.
	 * Tracks sheet instances and their reference counts for cleanup.
	 */
	sheets: Record<string, [sheet: ISheet, count: number]> = {};

	constructor() {
		effect(() => {
			const project = this.project();
			project.ready.then();
		});
	}
}
