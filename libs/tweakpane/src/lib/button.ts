import { computed, DestroyRef, Directive, effect, inject, output } from '@angular/core';
import { TpMouseEvent } from '@tweakpane/core';
import { ButtonApi } from 'tweakpane';
import { TweakpaneBlade } from './blade';
import { TweakpaneFolder } from './folder';
import { TweakpaneLabel } from './label';
import { TweakpaneTitle } from './title';

/**
 * Directive for creating a clickable button in Tweakpane.
 *
 * Buttons are used to trigger actions (like reset, randomize, etc.)
 * and emit click events when pressed.
 *
 * @example
 * ```html
 * <tweakpane-pane>
 *   <tweakpane-button title="Reset" (click)="onReset()" />
 *   <tweakpane-button title="Randomize" label="Action" (click)="onRandomize()" />
 *   <tweakpane-button title="Save" [disabled]="!canSave" (click)="onSave()" />
 * </tweakpane-pane>
 * ```
 */
@Directive({
	selector: 'tweakpane-button',
	hostDirectives: [
		{ directive: TweakpaneTitle, inputs: ['title'] },
		{ directive: TweakpaneLabel, inputs: ['label'] },
		{ directive: TweakpaneBlade, inputs: ['hidden', 'disabled'] },
	],
})
export class TweakpaneButton {
	/**
	 * Event emitted when the button is clicked.
	 * Provides the Tweakpane mouse event with the ButtonApi.
	 */
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
