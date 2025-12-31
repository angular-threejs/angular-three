import { computed, Directive, DOCUMENT, effect, ElementRef, inject, input, untracked } from '@angular/core';
import { addAfterEffect, injectStore, omit, pick, resolveRef } from 'angular-three';
import { mergeInputs } from 'ngxtension/inject-inputs';
import Stats from 'stats-gl';

/**
 * Configuration options for the NgtsStats directive.
 *
 * Extends all properties from the stats-gl Stats class with additional
 * Angular-specific options for DOM placement and styling.
 */
export type NgtsStatsOptions = Partial<Stats> & {
	/**
	 * The panel index to display by default.
	 * - 0: FPS (Frames per Second)
	 * - 1: MS (Milliseconds per frame)
	 * - 2: MB (Memory usage)
	 */
	showPanel?: number;
	/**
	 * CSS class(es) to apply to the stats DOM element.
	 * Multiple classes can be separated by spaces.
	 * @default ''
	 */
	domClass: string;
	/**
	 * The parent element to attach the stats panel to.
	 * If not provided, the stats panel will be appended to document.body.
	 * @default null
	 */
	parent: ElementRef<HTMLElement> | HTMLElement | null | undefined;
};

const defaultOptions: NgtsStatsOptions = {
	domClass: '',
	parent: null,
};

/**
 * A directive that displays performance statistics (FPS, MS, MB) for the Three.js renderer.
 *
 * This directive uses stats-gl to show real-time performance metrics for your 3D scene.
 * It automatically attaches to the canvas and updates every frame.
 *
 * @example
 * Basic usage:
 * ```html
 * <ngt-canvas [stats]="true" />
 * ```
 *
 * @example
 * With custom options:
 * ```html
 * <ngt-canvas [stats]="{ domClass: 'my-stats', showPanel: 0 }" />
 * ```
 *
 * @example
 * Attached to a custom parent element:
 * ```html
 * <div #statsContainer></div>
 * <ngt-canvas [stats]="{ parent: statsContainer }" />
 * ```
 */
@Directive({ selector: 'ngt-canvas[stats]' })
export class NgtsStats {
	/**
	 * Configuration options for the stats panel.
	 * Accepts a partial NgtsStatsOptions object that will be merged with defaults.
	 */
	options = input(defaultOptions, { transform: mergeInputs(defaultOptions), alias: 'stats' });

	constructor() {
		const statsOptions = omit(this.options, ['parent', 'domClass']);
		const parent = pick(this.options, 'parent');
		const domClass = pick(this.options, 'domClass');

		const document = inject(DOCUMENT);
		const store = injectStore();

		const stats = computed(() => {
			const gl = store.gl();
			if (!gl) return null;

			const stats = new Stats({ ...untracked(statsOptions) });
			void stats.init(gl);
			return stats;
		});

		effect((onCleanup) => {
			const _stats = stats();
			if (!_stats) return;

			const [_parent, _domClass] = [resolveRef(parent()), domClass()];
			const target = _parent ?? document.body;
			target.appendChild(_stats.dom);
			const classList = _domClass.split(' ').filter(Boolean);
			if (classList.length) _stats.dom.classList.add(...classList);
			const end = addAfterEffect(() => _stats.update());

			onCleanup(() => {
				if (classList.length) _stats.dom.classList.remove(...classList);
				target.removeChild(_stats.dom);
				end();
			});
		});
	}
}
