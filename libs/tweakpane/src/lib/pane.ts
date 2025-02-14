import { afterNextRender, DestroyRef, Directive, effect, inject, input, isSignal, signal } from '@angular/core';
import { injectStore } from 'angular-three';
import { Pane } from 'tweakpane';
import { NgtTweakFolder } from './folder';
import { NgtTweakTitle } from './title';

@Directive({
	selector: 'ngt-tweak-pane',
	hostDirectives: [{ directive: NgtTweakFolder, inputs: ['expanded'], outputs: ['expandedChange'] }],
})
export class NgtTweakPane {
	top = input<string | number>('8px');
	right = input<string | number>('8px');
	left = input<string | number>();
	bottom = input<string | number>();
	width = input<string | number>('256px');

	private title = inject(NgtTweakTitle, { host: true });
	private folder = inject(NgtTweakFolder, { host: true });
	private store = injectStore();
	private pane = signal<Pane | null>(null);

	constructor() {
		this.folder.isSelf = false;

		afterNextRender(() => {
			// the ngt-canvas
			const parentElement = this.store.snapshot.gl.domElement.parentElement?.parentElement;

			const pane = new Pane({
				title: this.title.title(),
				expanded: this.folder.expanded(),
			});

			if (parentElement && pane.element.parentElement) {
				parentElement.appendChild(pane.element.parentElement);
			}

			this.pane.set(pane);
			this.folder.parentFolder.set(pane);
		});

		inject(DestroyRef).onDestroy(() => {
			const pane = this.pane();
			if (!pane) return;

			const parentElement = this.store.snapshot.gl.domElement.parentElement?.parentElement;
			if (!parentElement || !pane.element.parentElement) return;

			pane.element.parentElement.remove();
		});

		effect(() => {
			this.updateStyleEffect('top');
		});

		effect(() => {
			this.updateStyleEffect('right');
		});

		effect(() => {
			this.updateStyleEffect('left');
		});

		effect(() => {
			this.updateStyleEffect('bottom');
		});

		effect(() => {
			this.updateStyleEffect('width');
		});
	}

	private updateStyleEffect(propertyName: Exclude<keyof NgtTweakPane, 'pane' | 'title' | 'expanded'>) {
		const pane = this.pane();
		if (!pane) return;

		const parentElement = pane.element.parentElement;
		if (!parentElement) return;

		const property = this[propertyName];
		if (!isSignal(property)) return;

		const value = property();
		if (!value) return;

		parentElement.style.setProperty(propertyName, typeof value === 'number' ? value + 'px' : value);
		pane.refresh();
	}
}
