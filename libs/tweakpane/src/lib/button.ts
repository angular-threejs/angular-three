import { computed, DestroyRef, Directive, effect, inject, output } from '@angular/core';
import { TpMouseEvent } from '@tweakpane/core';
import { ButtonApi } from 'tweakpane';
import { NgtTweakBlade } from './blade';
import { NgtTweakFolder } from './folder';
import { NgtTweakLabel } from './label';
import { NgtTweakTitle } from './title';

@Directive({
	selector: 'ngt-tweak-button',
	hostDirectives: [
		{ directive: NgtTweakTitle, inputs: ['title'] },
		{ directive: NgtTweakLabel, inputs: ['label'] },
		{ directive: NgtTweakBlade, inputs: ['hidden', 'disabled'] },
	],
})
export class NgtTweakButton {
	click = output<TpMouseEvent<ButtonApi>>();

	private title = inject(NgtTweakTitle);
	private label = inject(NgtTweakLabel);
	private blade = inject(NgtTweakBlade);
	private parent = inject(NgtTweakFolder);

	private buttonApi = computed(() => {
		const parent = this.parent.folder();
		if (!parent) return null;

		return parent.addButton({
			title: this.title.snapshot,
			hidden: this.blade.snapshot.hidden,
			disabled: this.blade.snapshot.disabled,
			label: this.label.snapshot.label,
		});
	});

	constructor() {
		effect((onCleanup) => {
			const buttonApi = this.buttonApi();
			if (!buttonApi) return;

			const boundEmit = this.click.emit.bind(this.click);
			buttonApi.on('click', boundEmit);

			onCleanup(() => {
				buttonApi.off('click', boundEmit);
			});
		});

		this.label.startChangeEffect(this.buttonApi);
		this.title.startChangeEffect(this.buttonApi);
		this.blade.startChangeEffect(this.buttonApi);

		inject(DestroyRef).onDestroy(() => {
			this.buttonApi()?.dispose();
		});
	}
}
