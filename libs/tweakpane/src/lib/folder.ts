import { computed, DestroyRef, Directive, effect, inject, linkedSignal, model, Signal, untracked } from '@angular/core';
import { TpFoldEvent } from '@tweakpane/core';
import { FolderApi } from 'tweakpane';
import { TweakpaneBlade } from './blade';
import { TweakpaneTitle } from './title';

/**
 * Directive for creating collapsible folders within a Tweakpane.
 *
 * Folders are used to organize controls into logical groups. They can be
 * nested within other folders or directly within a pane.
 *
 * @example
 * ```html
 * <tweakpane-pane>
 *   <tweakpane-folder title="Physics" [expanded]="true">
 *     <tweakpane-number label="Gravity" [(value)]="gravity" />
 *     <tweakpane-number label="Friction" [(value)]="friction" />
 *   </tweakpane-folder>
 *
 *   <tweakpane-folder title="Appearance">
 *     <tweakpane-color label="Color" [(value)]="color" />
 *   </tweakpane-folder>
 * </tweakpane-pane>
 * ```
 */
@Directive({
	selector: 'tweakpane-folder',
	hostDirectives: [
		{ directive: TweakpaneTitle, inputs: ['title'] },
		{ directive: TweakpaneBlade, inputs: ['hidden', 'disabled'] },
	],
})
export class TweakpaneFolder {
	/**
	 * Whether the folder is expanded (open) or collapsed.
	 * Supports two-way binding with `[(expanded)]`.
	 * @default false
	 */
	expanded = model(false);

	private title = inject(TweakpaneTitle);
	private blade = inject(TweakpaneBlade);
	private parent = inject(TweakpaneFolder, { skipSelf: true, optional: true });

	/**
	 * Signal containing the parent folder API.
	 * Automatically links to the parent folder in the component hierarchy.
	 */
	parentFolder = linkedSignal(() => this.parent?.folder());

	/**
	 * Computed signal containing the Tweakpane FolderApi for this folder.
	 * Returns null if the parent folder is not yet available.
	 */
	folder: Signal<FolderApi | null> = computed(() => {
		const parent = this.parentFolder();
		if (!parent) return null;

		if (!this.isSelf) return parent;

		return parent.addFolder({
			title: this.title.snapshot,
			expanded: untracked(this.expanded),
			disabled: this.blade.snapshot.disabled,
			hidden: this.blade.snapshot.hidden,
		});
	});

	/**
	 * Internal flag indicating whether this directive creates its own folder
	 * or reuses the parent folder. Set to `false` by `TweakpanePane`.
	 * @internal
	 */
	isSelf = true;

	constructor() {
		this.title.sync(this.folder);
		this.blade.sync(this.folder);

		effect((onCleanup) => {
			const folder = this.folder();
			if (!folder) return;

			const cb = (ev: TpFoldEvent<FolderApi>) => {
				this.expanded.set(ev.expanded);
			};

			folder.on('fold', cb);
			onCleanup(() => {
				folder.off('fold', cb);
			});
		});

		inject(DestroyRef).onDestroy(() => {
			this.folder()?.dispose();
		});
	}
}
