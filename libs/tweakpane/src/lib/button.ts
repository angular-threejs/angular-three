import { DestroyRef, Directive, effect, inject, input, output, signal, untracked } from '@angular/core';
import { TpMouseEvent } from '@tweakpane/core';
import { ButtonApi } from 'tweakpane';
import { NgtTweakBlade } from './blade';
import { NgtTweakFolder } from './folder';
import { NgtTweakTitle } from './title';

@Directive({
	selector: 'ngt-tweak-button',
	hostDirectives: [
		{ directive: NgtTweakTitle, inputs: ['title'] },
		{ directive: NgtTweakBlade, inputs: ['hidden', 'disabled'] },
	],
})
export class NgtTweakButton {
	label = input('');
	click = output<TpMouseEvent<ButtonApi>>();

	private title = inject(NgtTweakTitle);
	private blade = inject(NgtTweakBlade);
	private parent = inject(NgtTweakFolder);

	button = signal<ButtonApi | null>(null);

	constructor() {
		effect((onCleanup) => {
			const parent = this.parent.folder();
			if (!parent) return;

			const button = parent.addButton({
				title: this.title.snapshot,
				hidden: this.blade.snapshot.hidden,
				disabled: this.blade.snapshot.disabled,
				label: untracked(this.label),
			});

			const boundEmit = this.click.emit.bind(this.click);
			button.on('click', boundEmit);
			this.button.set(button);

			onCleanup(() => {
				button.off('click', boundEmit);
			});
		});

		effect(() => {
			const button = this.button();
			if (!button) return;

			button.label = this.label();
		});

		this.title.startChangeEffect(this.button);
		this.blade.startChangeEffect(this.button);

		inject(DestroyRef).onDestroy(() => {
			this.button()?.dispose();
		});
	}
}
