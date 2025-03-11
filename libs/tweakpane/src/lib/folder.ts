import { computed, DestroyRef, Directive, effect, inject, linkedSignal, model, Signal, untracked } from '@angular/core';
import { TpFoldEvent } from '@tweakpane/core';
import { FolderApi } from 'tweakpane';
import { NgtTweakBlade } from './blade';
import { NgtTweakTitle } from './title';

@Directive({
	selector: 'ngt-tweak-folder',
	hostDirectives: [
		{ directive: NgtTweakTitle, inputs: ['title'] },
		{ directive: NgtTweakBlade, inputs: ['hidden', 'disabled'] },
	],
})
export class NgtTweakFolder {
	expanded = model(false);

	private title = inject(NgtTweakTitle);
	private blade = inject(NgtTweakBlade);
	private parent = inject(NgtTweakFolder, { skipSelf: true, optional: true });
	parentFolder = linkedSignal(() => this.parent?.folder());
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
