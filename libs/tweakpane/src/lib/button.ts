import { computed, DestroyRef, Directive, effect, inject, output } from '@angular/core';
import { TpMouseEvent } from '@tweakpane/core';
import { ButtonApi } from 'tweakpane';
import { TweakpaneBlade } from './blade';
import { TweakpaneFolder } from './folder';
import { TweakpaneLabel } from './label';
import { TweakpaneTitle } from './title';

@Directive({
	selector: 'tweakpane-button',
	hostDirectives: [
		{ directive: TweakpaneTitle, inputs: ['title'] },
		{ directive: TweakpaneLabel, inputs: ['label'] },
		{ directive: TweakpaneBlade, inputs: ['hidden', 'disabled'] },
	],
})
export class TweakpaneButton {
	click = output<TpMouseEvent<ButtonApi>>();

	private title = inject(TweakpaneTitle);
	private label = inject(TweakpaneLabel);
	private blade = inject(TweakpaneBlade);
	private parent = inject(TweakpaneFolder);

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

		this.label.sync(this.buttonApi);
		this.title.sync(this.buttonApi);
		this.blade.sync(this.buttonApi);

		inject(DestroyRef).onDestroy(() => {
			this.buttonApi()?.dispose();
		});
	}
}
