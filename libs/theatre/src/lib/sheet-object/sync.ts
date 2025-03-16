import { computed, DestroyRef, Directive, effect, ElementRef, inject, input } from '@angular/core';
import { NgtAnyRecord, resolveInstanceKey, resolveRef } from 'angular-three';
import { THEATRE_STUDIO } from '../studio/studio-token';
import { getDefaultTransformer } from '../transformers/default-transformer';
import { TheatreTransformer } from '../transformers/transformer';
import { TheatreSheetObject } from './sheet-object';

const updateProjectionMatrixKeys = ['fov', 'near', 'far', 'zoom', 'left', 'right', 'top', 'bottom', 'aspect'];

@Directive({ selector: '[sync]', exportAs: 'sync' })
export class TheatreSheetObjectSync<TObject extends object> {
	parent = input.required<TObject | ElementRef<TObject> | (() => TObject | ElementRef<TObject> | undefined | null)>({
		alias: 'sync',
	});
	props = input<
		Array<string | [string, string | { label?: string; key?: string; transformer?: TheatreTransformer }]>
	>([], { alias: 'syncProps' });

	private theatreSheetObject = inject(TheatreSheetObject);
	sheetObject = computed(() => this.theatreSheetObject.sheetObject());
	private studio = inject(THEATRE_STUDIO, { optional: true });

	private parentRef = computed(() => {
		const parent = this.parent();
		if (typeof parent === 'function') return resolveRef(parent());
		return resolveRef(parent);
	});
	private resolvedProps = computed(() => {
		const props = this.props();
		return props.reduce(
			(resolved, prop) => {
				if (typeof prop === 'string') {
					resolved.push([prop, { key: this.resolvePropertyPath(prop) }]);
				} else {
					if (typeof prop[1] === 'string') {
						resolved.push([prop[0], { key: prop[1] }]);
					} else {
						resolved.push(
							prop as [string, { label?: string; key: string; transformer?: TheatreTransformer }],
						);
					}
				}

				return resolved;
			},
			[] as Array<[string, { label?: string; key: string; transformer?: TheatreTransformer }]>,
		);
	});

	private propsToAdd = computed(() => {
		const parent = this.parentRef();
		if (!parent) return null;

		const propsToAdd: NgtAnyRecord = {};
		const resolvedProps = this.resolvedProps();
		resolvedProps.forEach(([propName, { key, label, transformer }]) => {
			const { root, targetKey } = resolveInstanceKey(parent, propName);
			const rawValue = root[targetKey];
			const valueTransformer = transformer ?? getDefaultTransformer(root, targetKey, propName);
			const value = valueTransformer.transform(rawValue);

			value.label = label ?? key;

			this.propsMapping[key] = { path: propName, transformer: valueTransformer };
			propsToAdd[key] = value;
		});

		return propsToAdd;
	});

	private propsMapping: Record<string, { path: string; transformer: TheatreTransformer }> = {};

	constructor() {
		effect(() => {
			const propsToAdd = this.propsToAdd();
			if (!propsToAdd) return;
			this.theatreSheetObject.addProps(propsToAdd);
		});

		effect((onCleanup) => {
			const parent = this.parentRef();
			if (!parent) return;

			const propsToAdd = this.propsToAdd();
			if (!propsToAdd) return;

			const sheetObject = this.sheetObject();
			const cleanup = sheetObject.onValuesChange((newValues) => {
				Object.keys(newValues).forEach((key) => {
					// first, check if the prop is mapped in this component
					const propMapping = this.propsMapping[key];
					if (!propMapping) return;

					// we're using the addedProps map to infer the target property name from the property name on values
					const { root, targetKey } = resolveInstanceKey(parent, propMapping.path);

					// use a transformer to apply value
					const transformer = propMapping.transformer;
					transformer.apply(root, targetKey, newValues[key]);

					if (updateProjectionMatrixKeys.includes(targetKey)) {
						root.updateProjectionMatrix?.();
					}
				});
			});

			onCleanup(cleanup);
		});

		inject(DestroyRef).onDestroy(() => {
			this.theatreSheetObject.removeProps(Object.keys(this.propsMapping));
		});
	}

	capture() {
		const studio = this.studio?.();
		if (!studio) return;

		const parent = this.parentRef();
		if (!parent) return;

		const sheetObject = this.sheetObject();
		if (!sheetObject) return;

		const scrub = studio.scrub();

		Object.keys(sheetObject.value).forEach((key) => {
			// first, check if the prop is mapped in this component
			const propMapping = this.propsMapping[key];
			if (!propMapping) return;

			// we're using the addedProps map to infer the target property name from the property name on values
			const { targetProp } = resolveInstanceKey(parent, propMapping.path);
			const value = propMapping.transformer.transform(targetProp).default;

			scrub.capture(({ set }) => {
				set(sheetObject.props[key], value);
			});
		});

		scrub.commit();
	}

	private resolvePropertyPath(propPath: string) {
		return (
			propPath
				// make the label alphanumeric by first removing dots (fundamental feature for pierced props)
				.replace(/\./g, '-')
				// make the following characters uppercase
				.replace(/-([a-z])/g, (g) => g[1].toUpperCase())
				// convert to safe alphanumeric characters without dashes
				.replace(/[^a-zA-Z0-9]/g, '')
		);
	}
}
