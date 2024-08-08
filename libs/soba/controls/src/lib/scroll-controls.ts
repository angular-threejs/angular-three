import { DOCUMENT } from '@angular/common';
import {
	afterNextRender,
	ChangeDetectionStrategy,
	Component,
	Directive,
	ElementRef,
	inject,
	input,
	model,
	untracked,
} from '@angular/core';
import { injectBeforeRender, injectStore, NgtHTML, pick, provideHTMLDomElement } from 'angular-three';
import { easing } from 'maath';
import { injectAutoEffect } from 'ngxtension/auto-effect';
import { mergeInputs } from 'ngxtension/inject-inputs';
import { Group } from 'three';

export interface NgtsScrollControlsOptions {
	/** Precision, default 0.00001 */
	eps: number;
	/** Horizontal scroll, default false (vertical) */
	horizontal: boolean;
	/** Infinite scroll, default false (experimental!) */
	infinite: boolean;
	/** Defines the lenght of the scroll area, each page is height:100%, default 1 */
	pages: number;
	/** A factor that increases scroll bar travel,default: 1 */
	distance: number;
	/** Friction in seconds, default: 0.25 (1/4 second) */
	damping: number;
	/** maxSpeed optionally allows you to clamp the maximum speed. If damping is 0.2s and looks OK
	 *  going between, say, page 1 and 2, but not for pages far apart as it'll move very rapid,
	 *  then a maxSpeed of e.g. 3 which will clamp the speed to 3 units per second, it may now
	 *  take much longer than damping to reach the target if it is far away. Default: Infinity */
	maxSpeed: number;
	/** If true attaches the scroll container before the canvas */
	prepend: boolean;
	enabled: boolean;
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

@Component({
	selector: 'ngts-scroll-controls',
	standalone: true,
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
	private gl = this.store.select('gl');
	private events = this.store.select('events');
	private invalidate = this.store.select('invalidate');
	private size = this.store.select('size');

	private domElement = pick(this.gl, 'domElement');
	private target = pick(this.domElement, 'parentNode');

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
		const autoEffect = injectAutoEffect();

		afterNextRender(() => {
			autoEffect(() => {
				const target = this.target();
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
					untracked(this.domElement),
					untracked(this.events),
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

				return () => {
					parent.removeChild(el);
					this.store.snapshot.setEvents({ compute: oldCompute });
					events.connect?.(oldTarget);
				};
			});

			autoEffect(() => {
				const [el, events, size, infinite, invalidate, horizontal, enabled] = [
					this.el,
					this.events(),
					this.size(),
					this.infinite(),
					this.invalidate(),
					this.horizontal(),
					this.enabled(),
				];

				if (events.connected !== el) return;

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

					untracked(() => {
						this.progress.set(this.scroll);
					});
				};

				el.addEventListener('scroll', onScroll, { passive: true });
				requestAnimationFrame(() => (firstRun = false));

				const onWheel = (e: WheelEvent) => (el[horizontal ? 'scrollLeft' : 'scrollTop'] += e.deltaY / 2);
				if (horizontal) el.addEventListener('wheel', onWheel, { passive: true });

				return () => {
					el.removeEventListener('scroll', onScroll);
					if (horizontal) el.removeEventListener('wheel', onWheel);
				};
			});
		});

		let last = 0;
		injectBeforeRender(({ delta }) => {
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
			if (this.delta > this.eps()) this.invalidate()();
		});
	}

	get el() {
		return this._el;
	}

	get fill() {
		return this._fill;
	}

	get fixed() {
		return this._fixed;
	}

	range(from: number, distance: number, margin = 0): number {
		const start = from - margin;
		const end = start + distance + margin * 2;
		return this.offset < start ? 0 : this.offset > end ? 1 : (this.offset - start) / (end - start);
	}

	curve(from: number, distance: number, margin = 0): number {
		return Math.sin(this.range(from, distance, margin) * Math.PI);
	}

	visible(from: number, distance: number, margin = 0): boolean {
		const start = from - margin;
		const end = start + distance + margin * 2;
		return this.offset >= start && this.offset <= end;
	}
}

@Directive({ selector: 'ngt-group[ngtsScrollCanvas]', standalone: true })
export class NgtsScrollCanvas {
	private host = inject<ElementRef<Group>>(ElementRef);
	private scrollControls = inject(NgtsScrollControls);
	private store = injectStore();
	private viewport = this.store.select('viewport');

	constructor() {
		injectBeforeRender(() => {
			const group = this.host.nativeElement;

			group.position.x = this.scrollControls.horizontal()
				? -this.viewport().width * (this.scrollControls.pages() - 1) * this.scrollControls.offset
				: 0;
			group.position.y = this.scrollControls.horizontal()
				? 0
				: this.viewport().height * (this.scrollControls.pages() - 1) * this.scrollControls.offset;
		});
	}
}

@Directive({
	selector: 'div[ngtsScrollHTML]',
	standalone: true,
	host: { style: 'position: absolute; top: 0; left: 0; will-change: transform;' },
	providers: [provideHTMLDomElement([NgtsScrollControls], (scrollControls) => scrollControls.fixed)],
})
export class NgtsScrollHtml extends NgtHTML {
	private scrollControls = inject(NgtsScrollControls);
	private size = this.store.select('size');

	constructor() {
		super();
		injectBeforeRender(() => {
			if (this.scrollControls.delta > this.scrollControls.eps()) {
				this.host.nativeElement.style.transform = `translate3d(${
					this.scrollControls.horizontal()
						? -this.size().width * (this.scrollControls.pages() - 1) * this.scrollControls.offset
						: 0
				}px,${this.scrollControls.horizontal() ? 0 : this.size().height * (this.scrollControls.pages() - 1) * -this.scrollControls.offset}px,0)`;
			}
		});
	}
}
