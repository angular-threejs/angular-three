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

/**
 * Main Tweakpane container directive that creates the root pane element.
 *
 * This directive creates a floating Tweakpane panel that can be positioned
 * anywhere on the screen. It serves as the root container for all
 * Tweakpane controls (folders, bindings, buttons, etc.).
 *
 * @example
 * ```html
 * <!-- Basic usage with default positioning (top-right) -->
 * <tweakpane-pane title="Settings">
 *   <tweakpane-number label="Speed" [(value)]="speed" />
 *   <tweakpane-checkbox label="Debug" [(value)]="debug" />
 * </tweakpane-pane>
 *
 * <!-- Custom positioning -->
 * <tweakpane-pane title="Controls" left="8px" bottom="8px" [right]="undefined">
 *   <tweakpane-folder title="Physics">
 *     <tweakpane-number label="Gravity" [(value)]="gravity" />
 *   </tweakpane-folder>
 * </tweakpane-pane>
 *
 * <!-- Embedded in a container element -->
 * <div #container></div>
 * <tweakpane-pane [container]="container">
 *   <!-- controls -->
 * </tweakpane-pane>
 * ```
 */
@Directive({
	selector: 'tweakpane-pane',
	hostDirectives: [{ directive: TweakpaneFolder, inputs: ['expanded'], outputs: ['expandedChange'] }],
})
export class TweakpanePane {
	/**
	 * CSS top position of the pane.
	 * @default '8px'
	 */
	top = input<string | number>('8px');

	/**
	 * CSS right position of the pane.
	 * @default '8px'
	 */
	right = input<string | number>('8px');

	/**
	 * CSS left position of the pane.
	 * @default undefined
	 */
	left = input<string | number>();

	/**
	 * CSS bottom position of the pane.
	 * @default undefined
	 */
	bottom = input<string | number>();

	/**
	 * CSS width of the pane.
	 * @default '256px'
	 */
	width = input<string | number>('256px');

	/**
	 * Optional container element to embed the pane into.
	 * If not provided, the pane floats freely in the document.
	 * Can be an HTMLElement or an Angular ElementRef.
	 */
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

	/**
	 * Updates a CSS style property on the pane's parent element.
	 * @param propertyName - The name of the style property to update
	 */
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
