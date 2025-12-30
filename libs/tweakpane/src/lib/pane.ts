import {
	afterNextRender,
	DestroyRef,
	Directive,
	DOCUMENT,
	effect,
	ElementRef,
	inject,
	input,
	isSignal,
	signal,
} from '@angular/core';
import { ClassName } from '@tweakpane/core';
import { Pane } from 'tweakpane';
import { PaneConfig } from 'tweakpane/dist/types/pane/pane-config';
import { TweakpaneAnchor } from './anchor';
import { TweakpaneFolder } from './folder';
import { TweakpaneTitle } from './title';

@Directive({
	selector: 'tweakpane-pane',
	hostDirectives: [{ directive: TweakpaneFolder, inputs: ['expanded'], outputs: ['expandedChange'] }],
})
export class TweakpanePane {
	top = input<string | number>('8px');
	right = input<string | number>('8px');
	left = input<string | number>();
	bottom = input<string | number>();
	width = input<string | number>('256px');
	container = input<HTMLElement | ElementRef<HTMLElement | undefined> | undefined>();

	private document = inject(DOCUMENT);
	private title = inject(TweakpaneTitle, { host: true });
	private folder = inject(TweakpaneFolder, { host: true });
	private tweakpaneAnchor = inject(TweakpaneAnchor, { optional: true });
	private pane = signal<Pane | null>(null);
	private paneContainer?: HTMLDivElement;

	constructor() {
		this.folder.isSelf = false;

		afterNextRender(() => {
			const container = this.container();
			const paneOptions: PaneConfig = {
				title: this.title.title(),
				expanded: this.folder.expanded(),
			};

			if (container) {
				const containerElement = 'nativeElement' in container ? container.nativeElement : container;
				if (containerElement) {
					this.paneContainer = this.document.createElement('div');
					this.paneContainer.classList.add(ClassName('dfw')());
					containerElement.appendChild(this.paneContainer);
					paneOptions.container = this.paneContainer;
				}
			}

			const pane = new Pane(paneOptions);

			this.pane.set(pane);
			this.folder.parentFolder.set(pane);

			// Set the pane's folder for tweaks() to use
			if (this.tweakpaneAnchor) {
				this.tweakpaneAnchor.paneFolder.set(this.folder);
			}
		});

		inject(DestroyRef).onDestroy(() => {
			const pane = this.pane();
			if (!pane) return;

			if (this.paneContainer) {
				this.paneContainer.remove();
			}

			pane.element.remove();
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

	private updateStyleEffect(propertyName: Exclude<keyof TweakpanePane, 'pane' | 'title' | 'expanded' | 'container'>) {
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
