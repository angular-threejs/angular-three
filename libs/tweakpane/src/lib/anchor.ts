import { Component, ComponentRef, Directive, inject, signal, ViewContainerRef } from '@angular/core';
import { TweakpaneFolder } from './folder';

/**
 * Directive that provides an anchor point for the `tweaks()` function to dynamically create Tweakpane controls.
 *
 * Add this directive to your `ngt-canvas` element to enable the `tweaks()` API:
 *
 * ```html
 * <ngt-canvas tweakpaneAnchor>
 *   <ng-template #sceneGraph>
 *     <!-- your scene -->
 *   </ng-template>
 * </ngt-canvas>
 * ```
 *
 * Then use `tweaks()` in any component within the canvas:
 *
 * ```typescript
 * const controls = tweaks('Physics', {
 *   gravity: { value: 9.8, min: 0, max: 20 },
 *   debug: this.debugMode, // two-way binding with existing signal
 * });
 * ```
 */
@Directive({ selector: '[tweakpaneAnchor]' })
export class TweakpaneAnchor {
	/**
	 * The ViewContainerRef where dynamic components will be created.
	 * Injected from the host element.
	 */
	vcr = inject(ViewContainerRef);

	/**
	 * Reference to the pane's TweakpaneFolder, set by TweakpanePane when it initializes.
	 * This is used as the parent folder for dynamically created folders.
	 */
	paneFolder = signal<TweakpaneFolder | null>(null);

	/**
	 * Registry of folder ComponentRefs by folder name.
	 * Used to reuse existing folders when multiple `tweaks()` calls use the same folder name.
	 */
	folders: Record<string, ComponentRef<TweakpaneAnchorHost>> = {};
}

/**
 * A minimal host component used for dynamically creating Tweakpane controls.
 * This component serves as a host for directives like TweakpaneFolder, TweakpaneNumber, etc.
 * when using the `tweaks()` function.
 *
 * @internal
 */
@Component({
	selector: 'tweakpane-anchor-host',
	template: '',
})
export class TweakpaneAnchorHost {}
