import {
	booleanAttribute,
	computed,
	DestroyRef,
	Directive,
	effect,
	inject,
	input,
	linkedSignal,
	model,
	TemplateRef,
	untracked,
	ViewContainerRef,
} from '@angular/core';
import { UnknownShorthandCompoundProps } from '@theatre/core';
import { injectStore } from 'angular-three';
import { TheatreSheet } from '../sheet';
import { THEATRE_STUDIO } from '../studio/studio-token';

/**
 * Directive that creates a Theatre.js sheet object for animating properties.
 *
 * A sheet object is a container for animatable properties within a sheet.
 * This directive must be applied to an `ng-template` element and provides
 * a structural context with access to the sheet object and its values.
 *
 * The template context includes:
 * - `sheetObject`: The Theatre.js sheet object instance (read-only signal)
 * - `values`: Current values of all animated properties (read-only signal)
 * - `select()`: Method to select this object in Theatre.js Studio
 * - `deselect()`: Method to deselect this object in Theatre.js Studio
 *
 * @example
 * ```html
 * <ng-template sheetObject="cube" [sheetObjectProps]="{ opacity: 1 }" let-values="values">
 *   <ngt-mesh>
 *     <ngt-mesh-standard-material [opacity]="values().opacity" />
 *   </ngt-mesh>
 * </ng-template>
 * ```
 *
 * @example
 * ```html
 * <!-- With selection support -->
 * <ng-template
 *   sheetObject="cube"
 *   [(sheetObjectSelected)]="isSelected"
 *   let-select="select"
 *   let-deselect="deselect"
 * >
 *   <ngt-mesh (click)="select()" />
 * </ng-template>
 * ```
 */
@Directive({ selector: 'ng-template[sheetObject]', exportAs: 'sheetObject' })
export class TheatreSheetObject {
	/**
	 * Unique key identifying this sheet object within its parent sheet.
	 * This key is used by Theatre.js to track and persist animation data.
	 */
	key = input.required<string>({ alias: 'sheetObject' });

	/**
	 * Initial properties and their default values for this sheet object.
	 * These properties will be animatable in Theatre.js Studio.
	 *
	 * @default {}
	 */
	props = input<UnknownShorthandCompoundProps>({}, { alias: 'sheetObjectProps' });

	/**
	 * Whether to detach (remove) the sheet object when this directive is destroyed.
	 * When true, the animation data for this object will be removed from the sheet.
	 *
	 * @default false
	 */
	detach = input(false, { transform: booleanAttribute, alias: 'sheetObjectDetach' });

	/**
	 * Two-way bindable signal indicating whether this object is selected in Theatre.js Studio.
	 *
	 * @default false
	 */
	selected = model<boolean>(false, { alias: 'sheetObjectSelected' });

	private templateRef = inject(TemplateRef);
	private vcr = inject(ViewContainerRef);
	private sheet = inject(TheatreSheet);
	private studio = inject(THEATRE_STUDIO, { optional: true });
	private store = injectStore();

	private originalSheetObject = computed(() => {
		const sheet = this.sheet.sheet();
		return sheet.object(this.key(), untracked(this.props), { reconfigure: true });
	});

	/**
	 * Signal containing the Theatre.js sheet object instance.
	 * This is a linked signal that updates when the sheet or key changes.
	 */
	sheetObject = linkedSignal(this.originalSheetObject);

	/**
	 * Signal containing the current values of all animated properties.
	 * Updates automatically when Theatre.js values change.
	 */
	values = linkedSignal(() => this.sheetObject().value);

	private detached = false;
	private aggregatedProps: UnknownShorthandCompoundProps = {};

	constructor() {
		effect(() => {
			this.aggregatedProps = { ...this.aggregatedProps, ...this.props() };
		});

		effect((onCleanup) => {
			const sheetObject = this.sheetObject();
			const cleanup = sheetObject.onValuesChange((newValues) => {
				this.values.set(newValues);
				this.store.snapshot.invalidate();
			});
			onCleanup(cleanup);
		});

		effect((onCleanup) => {
			const studio = this.studio?.();
			if (!studio) return;

			const sheetObject = this.sheetObject();
			const cleanup = studio.onSelectionChange((selection) => {
				this.selected.set(selection.includes(sheetObject));
			});
			onCleanup(cleanup);
		});

		effect((onCleanup) => {
			const view = this.vcr.createEmbeddedView(this.templateRef, {
				select: this.select.bind(this),
				deselect: this.deselect.bind(this),
				sheetObject: this.sheetObject.asReadonly(),
				values: this.values.asReadonly(),
			});
			view.detectChanges();
			onCleanup(() => {
				view.destroy();
			});
		});

		inject(DestroyRef).onDestroy(() => {
			if (this.detach()) {
				this.detached = true;
				this.sheet.sheet().detachObject(this.key());
			}
		});
	}

	/**
	 * Updates the sheet object with the current aggregated props.
	 * Detaches the existing object and creates a new one with reconfigured properties.
	 */
	update() {
		if (this.detached) return;

		const [sheet, key] = [untracked(this.sheet.sheet), untracked(this.key)];
		sheet.detachObject(key);
		this.sheetObject.set(sheet.object(key, this.aggregatedProps, { reconfigure: true }));
	}

	/**
	 * Adds new properties to the sheet object.
	 * The properties are merged with existing properties and the object is reconfigured.
	 *
	 * @param props - Properties to add to the sheet object
	 */
	addProps(props: UnknownShorthandCompoundProps) {
		this.aggregatedProps = { ...this.aggregatedProps, ...props };
		this.update();
	}

	/**
	 * Removes properties from the sheet object.
	 * If all properties are removed and `detach` is true, the object is detached from the sheet.
	 *
	 * @param props - Array of property names to remove
	 */
	removeProps(props: string[]) {
		const [detach, sheet, key] = [untracked(this.detach), untracked(this.sheet.sheet), untracked(this.key)];

		// remove props from sheet object
		props.forEach((prop) => {
			delete this.aggregatedProps[prop];
		});

		// if there are no more props, detach sheet object
		if (Object.keys(this.aggregatedProps).length === 0) {
			// detach sheet object
			if (detach) {
				sheet.detachObject(key);
			}
		} else {
			// update sheet object (reconfigure)
			this.update();
		}
	}

	/**
	 * Selects this sheet object in Theatre.js Studio.
	 * Only works when the studio is available.
	 */
	select() {
		const studio = this.studio?.();
		if (!studio) return;
		studio.setSelection([this.sheetObject()]);
	}

	/**
	 * Deselects this sheet object in Theatre.js Studio.
	 * Only deselects if this object is currently selected.
	 */
	deselect() {
		const studio = this.studio?.();
		if (!studio) return;

		if (studio.selection.includes(this.sheetObject())) {
			studio.setSelection([]);
		}
	}

	/**
	 * Type guard for the template context.
	 * Provides type safety for the template variables exposed by this directive.
	 *
	 * @param _ - The directive instance
	 * @param ctx - The template context
	 * @returns Type predicate for the template context
	 */
	static ngTemplateContextGuard(
		_: TheatreSheetObject,
		ctx: unknown,
	): ctx is {
		select: TheatreSheetObject['select'];
		deselect: TheatreSheetObject['deselect'];
		sheetObject: ReturnType<TheatreSheetObject['sheetObject']['asReadonly']>;
		values: ReturnType<TheatreSheetObject['values']['asReadonly']>;
	} {
		return true;
	}
}
