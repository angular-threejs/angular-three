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

@Directive({ selector: 'ng-template[sheetObject]', exportAs: 'sheetObject' })
export class TheatreSheetObject {
	key = input.required<string>({ alias: 'sheetObject' });
	props = input<UnknownShorthandCompoundProps>({}, { alias: 'sheetObjectProps' });
	detach = input(false, { transform: booleanAttribute, alias: 'sheetObjectDetach' });
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
	sheetObject = linkedSignal(this.originalSheetObject);
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

	update() {
		if (this.detached) return;

		const [sheet, key] = [untracked(this.sheet.sheet), untracked(this.key)];
		sheet.detachObject(key);
		this.sheetObject.set(sheet.object(key, this.aggregatedProps, { reconfigure: true }));
	}

	addProps(props: UnknownShorthandCompoundProps) {
		this.aggregatedProps = { ...this.aggregatedProps, ...props };
		this.update();
	}

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

	select() {
		const studio = this.studio?.();
		if (!studio) return;
		studio.setSelection([this.sheetObject()]);
	}

	deselect() {
		const studio = this.studio?.();
		if (!studio) return;

		if (studio.selection.includes(this.sheetObject())) {
			studio.setSelection([]);
		}
	}

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
