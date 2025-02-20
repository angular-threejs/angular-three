import { booleanAttribute, Directive, effect, ElementRef, inject, input, signal, untracked } from '@angular/core';
import { Group, Mesh, Object3D } from 'three';
import { getInstanceState } from '../instance';

@Directive({ selector: '[selection]' })
export class NgtSelectionApi {
	enabled = input(true, { alias: 'selection', transform: booleanAttribute });

	private source = signal<Array<ElementRef<Object3D> | Object3D>>([]);
	selected = this.source.asReadonly();

	update(...args: Parameters<typeof this.source.update>) {
		if (!this.enabled()) return;
		this.source.update(...args);
	}
}

@Directive({ selector: 'ngt-group[select], ngt-mesh[select]' })
export class NgtSelect {
	enabled = input(false, { transform: booleanAttribute, alias: 'select' });

	constructor() {
		const elementRef = inject<ElementRef<Group | Mesh>>(ElementRef);
		const selectionApi = inject(NgtSelectionApi);

		effect((onCleanup) => {
			const selectionEnabled = selectionApi.enabled();
			if (!selectionEnabled) return;

			const enabled = this.enabled();
			if (!enabled) return;

			const host = elementRef.nativeElement;
			if (!host) return;

			const localState = getInstanceState(host);
			if (!localState) return;

			// ngt-mesh[select]
			if (host.type === 'Mesh') {
				selectionApi.update((prev) => [...prev, host]);
				onCleanup(() => selectionApi.update((prev) => prev.filter((el) => el !== host)));
				return;
			}

			const [collection] = [untracked(selectionApi.selected), localState.objects()];
			let changed = false;
			const current: Object3D[] = [];
			host.traverse((child) => {
				child.type === 'Mesh' && current.push(child);
				if (collection.indexOf(child) === -1) changed = true;
			});

			if (!changed) return;

			selectionApi.update((prev) => [...prev, ...current]);
			onCleanup(() => {
				selectionApi.update((prev) => prev.filter((el) => !current.includes(el as Object3D)));
			});
		});
	}
}

export const NgtSelection = [NgtSelectionApi, NgtSelect] as const;
