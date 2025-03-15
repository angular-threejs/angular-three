import { computed, DestroyRef, Directive, effect, ElementRef, inject, input, signal } from '@angular/core';
import { NgtAnyRecord, resolveInstanceKey, resolveRef } from 'angular-three';
import { THEATRE_STUDIO } from '../studio/studio-token';
import { getDefaultTransformer } from '../transformers/default-transformer';
import { TheatreTransformer } from '../transformers/transformer';
import { TheatreSheetObject } from './sheet-object';

const updateProjectionMatrixKeys = ['fov', 'near', 'far', 'zoom', 'left', 'right', 'top', 'bottom', 'aspect'];

@Directive({ selector: '[sync]' })
export class TheatreSheetObjectSync<TObject extends object> {
	parent = input.required<TObject | ElementRef<TObject> | (() => TObject | ElementRef<TObject> | undefined | null)>({
		alias: 'sync',
	});
	props = input<
		Array<string | [string, string | { label?: string; key?: string; transformer?: TheatreTransformer }]>
	>([], { alias: 'syncProps' });

	private sheetObject = inject(TheatreSheetObject);
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

	private init = signal(false);
	private propsMapping: Record<string, { path: string; transformer: TheatreTransformer }> = {};

	constructor() {
		effect(() => {
			const parent = this.parentRef();
			if (!parent) return;

			const propsToAdd: NgtAnyRecord = {};
			const resolvedProps = this.resolvedProps();
			resolvedProps.forEach(([propName, { key, label, transformer }]) => {
				const { root, targetKey, targetProp } = resolveInstanceKey(parent, propName);
				const rawValue = root[targetKey];
				const valueTransformer = transformer ?? getDefaultTransformer(root, targetKey, propName);
				const value = valueTransformer.transform(rawValue);

				value.label = label ?? key;

				this.propsMapping[key] = { path: propName, transformer: valueTransformer };
				propsToAdd[key] = value;
			});

			this.sheetObject.addProps(propsToAdd);
			this.init.set(true);
		});

		effect((onCleanup) => {
			const parent = this.parentRef();
			if (!parent) return;

			const init = this.init();
			if (!init) return;

			const sheetObject = this.sheetObject.sheetObject();
			const cleanup = sheetObject.onValuesChange((newValues) => {
				Object.keys(newValues).forEach((key) => {
					// first, check if the prop is mapped in this component
					const propMapping = this.propsMapping[key];
					if (!propMapping) return;

					// we're using the addedProps map to infer the target property name from the property name on values
					const { root, targetProp, targetKey } = resolveInstanceKey(parent, propMapping.path);

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
			this.sheetObject.removeProps(Object.keys(this.propsMapping));
		});
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
