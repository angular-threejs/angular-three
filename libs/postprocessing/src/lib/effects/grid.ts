import { CUSTOM_ELEMENTS_SCHEMA, ChangeDetectionStrategy, Component, computed, effect, input } from '@angular/core';
import { NgtArgs, omit, pick } from 'angular-three';
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
	private effectOptions = omit(this.options, ['size']);
	private size = pick(this.options, 'size');

	protected effect = computed(() => new GridEffect(this.effectOptions()));

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
