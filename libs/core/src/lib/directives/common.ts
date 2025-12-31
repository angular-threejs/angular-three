import {
	DestroyRef,
	Directive,
	effect,
	EmbeddedViewRef,
	inject,
	Injector,
	Signal,
	TemplateRef,
	ViewContainerRef,
} from '@angular/core';
import { is } from '../utils/is';

/**
 * Abstract base class for Angular Three structural directives.
 *
 * This class provides common functionality for structural directives like `NgtArgs` and `NgtParent`,
 * including view management, value injection, and change detection.
 *
 * Subclasses must implement:
 * - `validate()`: Returns true if the directive has a valid value to inject
 * - `linkedValue`: A signal containing the current value
 * - `shouldSkipRender`: A signal indicating whether rendering should be skipped
 *
 * @typeParam TValue - The type of value this directive manages
 */
@Directive()
export abstract class NgtCommonDirective<TValue> {
	private vcr = inject(ViewContainerRef);
	private template = inject(TemplateRef);
	protected injector = inject(Injector);

	protected injected = false;
	protected injectedValue: TValue | null = null;
	private view?: EmbeddedViewRef<unknown>;

	protected get commentNode() {
		return this.vcr.element.nativeElement;
	}

	abstract validate(): boolean;
	protected abstract linkedValue: Signal<TValue | null>;
	protected abstract shouldSkipRender: Signal<boolean>;

	protected constructor() {
		effect(() => {
			if (this.shouldSkipRender()) return;

			const value = this.linkedValue();

			if (is.equ(value, this.injectedValue)) {
				// we have the same value as before, no need to update
				return;
			}

			this.injected = false;
			this.injectedValue = value;
			this.createView();
		});

		inject(DestroyRef).onDestroy(() => {
			this.view?.destroy();
		});
	}

	get value() {
		if (this.validate()) {
			this.injected = true;
			return this.injectedValue;
		}
		return null;
	}

	protected beforeCreateView() {
		/* noop */
	}

	private createView() {
		if (this.view && !this.view.destroyed) this.view.destroy();

		this.beforeCreateView();

		this.view = this.vcr.createEmbeddedView(this.template);
		this.view.detectChanges();
	}
}
