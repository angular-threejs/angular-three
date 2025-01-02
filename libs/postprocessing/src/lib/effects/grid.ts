import { CUSTOM_ELEMENTS_SCHEMA, ChangeDetectionStrategy, Component, computed, effect, input } from '@angular/core';
import { NgtArgs, pick } from 'angular-three';
import { GridEffect } from 'postprocessing';

type GridOptions = NonNullable<ConstructorParameters<typeof GridEffect>[0]> &
	Partial<{ size: { width: number; height: number } }>;

@Component({
	selector: 'ngtp-grid',
	template: `
		<ngt-primitive *args="[effect()]" />
	`,
	imports: [NgtArgs],
	changeDetection: ChangeDetectionStrategy.OnPush,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtpGrid {
	options = input({} as GridOptions);
	private size = pick(this.options, 'size');

	effect = computed(() => {
		const { size: _, ...options } = this.options();
		return new GridEffect(options);
	});

	constructor() {
		effect(() => {
			const [size, effect] = [this.size(), this.effect()];
			if (size) {
				effect.setSize(size.width, size.height);
			}
		});

		effect((onCleanup) => {
			const effect = this.effect();
			onCleanup(() => effect.dispose());
		});
	}
}
