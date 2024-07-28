import { DOCUMENT } from '@angular/common';
import { afterNextRender, computed, Directive, ElementRef, inject, input, untracked } from '@angular/core';
import { addAfterEffect, injectStore, omit, pick, resolveRef } from 'angular-three';
import { injectAutoEffect } from 'ngxtension/auto-effect';
import { mergeInputs } from 'ngxtension/inject-inputs';
import Stats from 'stats-gl';

export type NgtsStatsOptions = Partial<Stats> & {
	showPanel?: number;
	domClass: string;
	parent: ElementRef<HTMLElement> | HTMLElement | null | undefined;
};

const defaultOptions: NgtsStatsOptions = {
	domClass: '',
	parent: null,
};

@Directive({
	selector: 'ngt-canvas[stats]',
	standalone: true,
})
export class NgtsStats {
	options = input(defaultOptions, { transform: mergeInputs(defaultOptions), alias: 'stats' });

	constructor() {
		const statsOptions = omit(this.options, ['parent', 'domClass']);
		const parent = pick(this.options, 'parent');
		const domClass = pick(this.options, 'domClass');

		const document = inject(DOCUMENT);
		const autoEffect = injectAutoEffect();
		const store = injectStore();
		const gl = store.select('gl');

		const stats = computed(() => {
			const _gl = gl();
			if (!_gl) return null;

			const stats = new Stats({
				...untracked(statsOptions),
			});
			void stats.init(_gl);
			return stats;
		});

		afterNextRender(() => {
			autoEffect(() => {
				const _stats = stats();
				if (!_stats) return;

				const [_parent, _domClass] = [resolveRef(parent()), domClass()];
				const target = _parent ?? document.body;
				target.appendChild(_stats.dom);
				const classList = _domClass.split(' ').filter(Boolean);
				if (classList.length) _stats.dom.classList.add(...classList);
				const end = addAfterEffect(() => _stats.update());

				return () => {
					if (classList.length) _stats.dom.classList.remove(...classList);
					target.removeChild(_stats.dom);
					end();
				};
			});
		});
	}
}
