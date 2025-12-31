import {
	ChangeDetectionStrategy,
	Component,
	Directive,
	DOCUMENT,
	effect,
	ElementRef,
	inject,
	input,
	model,
	untracked,
} from '@angular/core';
import { beforeRender, injectStore, NgtHTML, pick, provideHTMLDomElement } from 'angular-three';
import { easing } from 'maath';
import { mergeInputs } from 'ngxtension/inject-inputs';
import * as THREE from 'three';

/**
 * Configuration options for the NgtsScrollControls component.
 *
 * These options control the behavior and appearance of scroll-based interactions
 * within a Three.js canvas.
 */
export interface NgtsScrollControlsOptions {
	/**
	 * Precision threshold for detecting scroll changes.
	 * @default 0.00001
	 */
	eps: number;
	/**
	 * Whether to enable horizontal scrolling instead of vertical.
	 * @default false
	 */
	horizontal: boolean;
	/**
	 * Whether to enable infinite/continuous scrolling (experimental).
	 * @default false
	 */
	infinite: boolean;
	/**
	 * Defines the length of the scroll area. Each page is height:100%.
	 * @default 1
	 */
	pages: number;
	/**
	 * A factor that increases scroll bar travel distance.
	 * @default 1
	 */
	distance: number;
	/**
	 * Friction/smoothing duration in seconds.
	 * @default 0.25
	 */
	damping: number;
	/**
	 * Maximum scroll speed in units per second.
	 * Useful for clamping speed when scrolling between distant pages.
	 * If damping is 0.2s and works well for adjacent pages but moves too fast
	 * for distant pages, setting maxSpeed to e.g. 3 will cap the speed.
	 * @default Infinity
	 */
	maxSpeed: number;
	/**
	 * If true, attaches the scroll container before the canvas element.
	 * @default false
	 */
	prepend: boolean;
	/**
	 * Whether scroll controls are enabled.
	 * @default true
	 */
	enabled: boolean;
	/**
	 * Additional CSS styles to apply to the scroll container.
	 * @default {}
	 */
	style: Partial<CSSStyleDeclaration>;
}

const defaultOptions: NgtsScrollControlsOptions = {
	eps: 0.00001,
	horizontal: false,
	infinite: false,
	pages: 1,
	distance: 1,
	damping: 0.25,
	maxSpeed: Infinity,
	prepend: false,
	enabled: true,
	style: {},
};

/**
 * A component that enables scroll-based interactions within a Three.js canvas.
 *
 * NgtsScrollControls creates a scrollable container that can be used to control
 * animations and camera movements based on scroll position. It provides smooth
 * damping, supports both horizontal and vertical scrolling, and offers utility
 * methods to query scroll progress.
 *
 * @example
 * ```html
 * <ngts-scroll-controls [options]="{ pages: 3, damping: 0.1 }">
 *   <ngt-group canvasScrollContent>
 *     <!-- 3D content that moves with scroll -->
 *   </ngt-group>
 * </ngts-scroll-controls>
 * ```
 */
@Component({
	selector: 'ngts-scroll-controls',
	template: `
		<ng-content />
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgtsScrollControls {
	progress = model(0);
	options = input(defaultOptions, { transform: mergeInputs(defaultOptions) });

	private document = inject(DOCUMENT);
	private store = injectStore();

	private _el = this.document.createElement('div');
	private _fill = this.document.createElement('div');
	private _fixed = this.document.createElement('div');

	private style = pick(this.options, 'style');
	private prepend = pick(this.options, 'prepend');
	private enabled = pick(this.options, 'enabled');
	private infinite = pick(this.options, 'infinite');
	private maxSpeed = pick(this.options, 'maxSpeed');

	eps = pick(this.options, 'eps');
	horizontal = pick(this.options, 'horizontal');
	pages = pick(this.options, 'pages');
	distance = pick(this.options, 'distance');
	damping = pick(this.options, 'damping');
	scroll = 0;
	offset = 0;
	delta = 0;

	constructor() {
		effect((onCleanup) => {
			const target = this.store.gl.domElement.parentNode();
			if (!target) return;

			const parent = target as HTMLElement;
			const [pages, distance, horizontal, el, fill, fixed, style, prepend, domElement, events] = [
				this.pages(),
				this.distance(),
				this.horizontal(),
				this.el,
				this.fill,
				this.fixed,
				untracked(this.style),
				untracked(this.prepend),
				this.store.snapshot.gl.domElement,
				this.store.snapshot.events,
			];

			el.style.position = 'absolute';
			el.style.width = '100%';
			el.style.height = '100%';
			el.style[horizontal ? 'overflowX' : 'overflowY'] = 'auto';
			el.style[horizontal ? 'overflowY' : 'overflowX'] = 'hidden';
			el.style.top = '0px';
			el.style.left = '0px';

			for (const key in style) {
				el.style[key] = (style as CSSStyleDeclaration)[key];
			}

			fixed.style.position = 'sticky';
			fixed.style.top = '0px';
			fixed.style.left = '0px';
			fixed.style.width = '100%';
			fixed.style.height = '100%';
			fixed.style.overflow = 'hidden';
			el.appendChild(fixed);

			fill.style.height = horizontal ? '100%' : `${pages * distance * 100}%`;
			fill.style.width = horizontal ? `${pages * distance * 100}%` : '100%';
			fill.style.pointerEvents = 'none';
			el.appendChild(fill);

			if (prepend) parent.prepend(el);
			else parent.appendChild(el);

			// Init scroll one pixel in to allow upward/leftward scroll
			el[horizontal ? 'scrollLeft' : 'scrollTop'] = 1;

			const oldTarget = (events.connected || domElement) as HTMLElement;
			requestAnimationFrame(() => events.connect?.(el));
			const oldCompute = events.compute?.bind(events);

			this.store.snapshot.setEvents({
				compute(event, store) {
					const state = store.snapshot;
					// we are using boundingClientRect because we could not rely on target.offsetTop as canvas could be positioned anywhere in dom
					const { left, top } = parent.getBoundingClientRect();
					const offsetX = event.clientX - left;
					const offsetY = event.clientY - top;
					state.pointer.set((offsetX / state.size.width) * 2 - 1, -(offsetY / state.size.height) * 2 + 1);
					state.raycaster.setFromCamera(state.pointer, state.camera);
				},
			});

			onCleanup(() => {
				parent.removeChild(el);
				this.store.snapshot.setEvents({ compute: oldCompute });
				events.connect?.(oldTarget);
			});
		});

		effect((onCleanup) => {
			const [el, events] = [this.el, this.store.events()];
			if (!events.connected || events.connected !== el) return;

			const [size, infinite, invalidate, horizontal, enabled] = [
				this.store.size(),
				this.infinite(),
				this.store.invalidate(),
				this.horizontal(),
				this.enabled(),
			];

			const containerLength = size[horizontal ? 'width' : 'height'];
			const scrollLength = el[horizontal ? 'scrollWidth' : 'scrollHeight'];
			const scrollThreshold = scrollLength - containerLength;

			let current = 0;
			let disableScroll = true;
			let firstRun = true;

			const onScroll = () => {
				// Prevent first scroll because it is indirectly caused by the one pixel offset
				if (!enabled || firstRun) return;

				invalidate();
				current = el[horizontal ? 'scrollLeft' : 'scrollTop'];
				this.scroll = current / scrollThreshold;

				if (infinite) {
					if (!disableScroll) {
						if (current >= scrollThreshold) {
							const damp = 1 - this.offset;
							el[horizontal ? 'scrollLeft' : 'scrollTop'] = 1;
							this.scroll = this.offset = -damp;
							disableScroll = true;
						} else if (current <= 0) {
							const damp = 1 + this.offset;
							el[horizontal ? 'scrollLeft' : 'scrollTop'] = scrollLength;
							this.scroll = this.offset = damp;
							disableScroll = true;
						}
					}
					if (disableScroll) setTimeout(() => (disableScroll = false), 40);
				}

				this.progress.set(this.scroll);
			};

			el.addEventListener('scroll', onScroll, { passive: true });
			requestAnimationFrame(() => (firstRun = false));

			const onWheel = (e: WheelEvent) => (el[horizontal ? 'scrollLeft' : 'scrollTop'] += e.deltaY / 2);
			if (horizontal) el.addEventListener('wheel', onWheel, { passive: true });

			onCleanup(() => {
				el.removeEventListener('scroll', onScroll);
				if (horizontal) el.removeEventListener('wheel', onWheel);
			});
		});

		let last = 0;
		beforeRender(({ delta }) => {
			last = this.offset;
			easing.damp(this, 'offset', this.scroll, this.damping(), delta, this.maxSpeed(), undefined, this.eps());
			easing.damp(
				this,
				'delta',
				Math.abs(last - this.offset),
				this.damping(),
				delta,
				this.maxSpeed(),
				undefined,
				this.eps(),
			);
			if (this.delta > this.eps()) this.store.invalidate()();
		});
	}

	/**
	 * The main scroll container element.
	 */
	get el() {
		return this._el;
	}

	/**
	 * The fill element that creates the scrollable height/width.
	 */
	get fill() {
		return this._fill;
	}

	/**
	 * The fixed position container for scroll content.
	 */
	get fixed() {
		return this._fixed;
	}

	/**
	 * Calculates a linear progress value (0-1) within a specified scroll range.
	 *
	 * @param from - The starting scroll position (0-1)
	 * @param distance - The length of the active scroll range
	 * @param margin - Optional margin to extend the range on both ends
	 * @returns A value between 0 and 1 representing progress through the range
	 */
	range(from: number, distance: number, margin = 0): number {
		const start = from - margin;
		const end = start + distance + margin * 2;
		return this.offset < start ? 0 : this.offset > end ? 1 : (this.offset - start) / (end - start);
	}

	/**
	 * Calculates a curved (sinusoidal) progress value within a specified scroll range.
	 * Returns 0 at the start, peaks at 1 in the middle, and returns to 0 at the end.
	 *
	 * @param from - The starting scroll position (0-1)
	 * @param distance - The length of the active scroll range
	 * @param margin - Optional margin to extend the range on both ends
	 * @returns A sinusoidal value between 0 and 1
	 */
	curve(from: number, distance: number, margin = 0): number {
		return Math.sin(this.range(from, distance, margin) * Math.PI);
	}

	/**
	 * Determines whether the current scroll position is within a specified range.
	 *
	 * @param from - The starting scroll position (0-1)
	 * @param distance - The length of the active scroll range
	 * @param margin - Optional margin to extend the range on both ends
	 * @returns True if currently within the specified range
	 */
	visible(from: number, distance: number, margin = 0): boolean {
		const start = from - margin;
		const end = start + distance + margin * 2;
		return this.offset >= start && this.offset <= end;
	}
}

/**
 * A directive that automatically positions a group based on scroll progress.
 *
 * Apply this directive to an ngt-group element to have it automatically
 * move in response to scroll position within NgtsScrollControls.
 *
 * @example
 * ```html
 * <ngts-scroll-controls [options]="{ pages: 3 }">
 *   <ngt-group canvasScrollContent>
 *     <!-- Content that moves with scroll -->
 *   </ngt-group>
 * </ngts-scroll-controls>
 * ```
 */
@Directive({ selector: 'ngt-group[canvasScrollContent]' })
export class NgtsCanvasScrollContent {
	private host = inject<ElementRef<THREE.Group>>(ElementRef);
	private scrollControls = inject(NgtsScrollControls);
	private store = injectStore();

	constructor() {
		beforeRender(() => {
			const group = this.host.nativeElement;

			group.position.x = this.scrollControls.horizontal()
				? -this.store.snapshot.viewport.width * (this.scrollControls.pages() - 1) * this.scrollControls.offset
				: 0;
			group.position.y = this.scrollControls.horizontal()
				? 0
				: this.store.snapshot.viewport.height * (this.scrollControls.pages() - 1) * this.scrollControls.offset;
		});
	}
}

/**
 * A directive that automatically transforms an HTML element based on scroll progress.
 *
 * Apply this directive to a div element to have it automatically transform
 * in response to scroll position within NgtsScrollControls. This is useful
 * for creating HTML overlays that scroll in sync with the 3D content.
 *
 * @example
 * ```html
 * <ngts-scroll-controls [options]="{ pages: 3 }">
 *   <div htmlScrollContent>
 *     <h1>Scrolling HTML content</h1>
 *   </div>
 * </ngts-scroll-controls>
 * ```
 */
@Directive({
	selector: 'div[htmlScrollContent]',
	host: { style: 'position: absolute; top: 0; left: 0; will-change: transform;', 'data-html-scroll-content': '' },
	providers: [provideHTMLDomElement([NgtsScrollControls], (scrollControls) => scrollControls.fixed)],
})
export class NgtsHTMLScrollContent extends NgtHTML {
	private scrollControls = inject(NgtsScrollControls);
	private store = injectStore();
	private host = inject<ElementRef<HTMLDivElement>>(ElementRef);

	constructor() {
		super();

		beforeRender(() => {
			if (this.scrollControls.delta > this.scrollControls.eps()) {
				this.host.nativeElement.style.transform = `translate3d(${
					this.scrollControls.horizontal()
						? -this.store.snapshot.size.width *
							(this.scrollControls.pages() - 1) *
							this.scrollControls.offset
						: 0
				}px,${this.scrollControls.horizontal() ? 0 : this.store.snapshot.size.height * (this.scrollControls.pages() - 1) * -this.scrollControls.offset}px,0)`;
			}
		});
	}
}
