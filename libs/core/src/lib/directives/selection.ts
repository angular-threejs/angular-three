import {
	afterNextRender,
	booleanAttribute,
	Directive,
	ElementRef,
	inject,
	input,
	signal,
	untracked,
} from '@angular/core';
import { injectAutoEffect } from 'ngxtension/auto-effect';
import { Group, Mesh, Object3D } from 'three';
import { getLocalState } from '../instance';

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

@Directive({ standalone: true, selector: 'ngt-group[ngtSelect], ngt-mesh[ngtSelect]' })
export class NgtSelect {
	enabled = input(false, { transform: booleanAttribute, alias: 'ngtSelect' });

	host = inject<ElementRef<Group | Mesh>>(ElementRef);

	constructor() {
		const selection = inject(NgtSelection);
		const autoEffect = injectAutoEffect();

		afterNextRender(() => {
			autoEffect(
				() => {
					const host = this.host.nativeElement;
					if (!host) return;

					const localState = getLocalState(host);
					if (!localState) return;

					const enabled = this.enabled();
					if (!enabled) return;

					// ngt-mesh[ngtSelect]
					if (host.type === 'Mesh') {
						selection.select(host);
						return () => selection.unselect(host);
					}

					const [collection] = [untracked(selection.collection), localState.objects()];
					let changed = false;
					const current: Object3D[] = [];
					host.traverse((child) => {
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
