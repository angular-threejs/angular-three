import {
	afterNextRender,
	booleanAttribute,
	ChangeDetectionStrategy,
	Component,
	CUSTOM_ELEMENTS_SCHEMA,
	Directive,
	ElementRef,
	inject,
	input,
	signal,
	untracked,
	viewChild,
} from '@angular/core';
import { injectAutoEffect } from 'ngxtension/auto-effect';
import { Group, Object3D } from 'three';
import { getLocalState } from '../instance';
import { extend } from '../renderer';
import { NgtGroup } from '../three-types';
import { NgtObjectEvents, NgtObjectEventsHostDirective } from '../utils/object-events';

@Directive({ standalone: true, selector: '[ngtSelection]' })
export class NgtSelection {
	enabled = input(true, { alias: 'ngtSelection', transform: booleanAttribute });

	private selection = signal<Array<ElementRef<Object3D> | Object3D>>([]);
	collection = this.selection.asReadonly();

	select(...objects: Array<ElementRef<Object3D> | Object3D>) {
		this.selection.update((prev) => [...prev, ...objects]);
	}

	unselect(...objects: Array<ElementRef<Object3D> | Object3D>) {
		this.selection.update((prev) => prev.filter((selected) => !objects.includes(selected)));
	}
}

@Component({
	selector: 'ngt-select',
	standalone: true,
	template: `
		<ngt-group #group [parameters]="options()">
			<ng-content />
		</ngt-group>
	`,
	hostDirectives: [NgtObjectEventsHostDirective],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgtSelect {
	enabled = input(false, { transform: booleanAttribute });
	options = input({} as Partial<NgtGroup>);

	groupRef = viewChild.required<ElementRef<Group>>('group');

	constructor() {
		extend({ Group });

		const objectEvents = inject(NgtObjectEvents, { host: true });
		const selection = inject(NgtSelection);
		const autoEffect = injectAutoEffect();

		afterNextRender(() => {
			objectEvents.ngtObjectEvents.set(this.groupRef());

			autoEffect(
				() => {
					const group = this.groupRef().nativeElement;
					const localState = getLocalState(group);
					if (!localState) return;

					const enabled = this.enabled();
					if (!enabled) return;

					const [collection] = [untracked(selection.collection), localState.objects()];
					let changed = false;
					const current: Object3D[] = [];
					group.traverse((child) => {
						child.type === 'Mesh' && current.push(child);
						if (collection.indexOf(child) === -1) changed = true;
					});

					if (!changed) return;

					selection.select(...current);
					return () => {
						selection.unselect(...current);
					};
				},
				{ allowSignalWrites: true },
			);
		});
	}
}
