import { DOCUMENT } from '@angular/common';
import { Directive, Input, computed, effect, inject } from '@angular/core';
import { NgtRef, addAfterEffect, addEffect, injectNgtStore, is, signalStore } from 'angular-three';
import Stats from 'stats-gl';

export type NgtsStatsGLState = {
	parent?: NgtRef<HTMLElement>;
	containerClass?: string;
	config?: ConstructorParameters<typeof Stats>[0];
};

@Directive({ selector: 'ngts-stats-gl', standalone: true })
export class NgtsStatsGL {
	private inputs = signalStore<NgtsStatsGLState>();

	@Input({ alias: 'parent' }) set _parent(parent: NgtRef<HTMLElement>) {
		this.inputs.set({ parent });
	}

	@Input({ alias: 'containerClass' }) set _containerClass(containerClass: string) {
		this.inputs.set({ containerClass });
	}

	@Input({ alias: 'config' }) set _config(config: NgtsStatsGLState['config']) {
		this.inputs.set({ config });
	}

	private document = inject(DOCUMENT);
	private store = injectNgtStore();
	private gl = this.store.select('gl');

	private config = this.inputs.select('config');
	private parent = this.inputs.select('parent');
	private containerClass = this.inputs.select('containerClass');

	private stats = computed(() => {
		const [config, gl] = [this.config() || {}, this.gl()];
		const stats = new Stats(config);
		stats.init(gl.domElement);
		return stats;
	});

	constructor() {
		effect((onCleanup) => {
			const [parent, stats, containerClass] = [this.parent(), this.stats(), this.containerClass()];
			const node = parent ? (is.ref(parent) ? parent.nativeElement : parent) : this.document.body;
			node.appendChild(stats.container);
			if (containerClass) stats.container.classList.add(...containerClass.split(' ').filter(Boolean));

			const begin = addEffect(() => stats.begin());
			const end = addAfterEffect(() => stats.end());
			onCleanup(() => {
				node.removeChild(stats.container);
				begin();
				end();
			});
		});
	}
}
