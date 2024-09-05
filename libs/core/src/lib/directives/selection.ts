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
	private source = signal<Array<ElementRef<Object3D> | Object3D>>([]);
	selected = this.source.asReadonly();
	update = this.source.update.bind(this.source);
}

@Directive({ standalone: true, selector: 'ngt-group[ngtSelect], ngt-mesh[ngtSelect]' })
export class NgtSelect {
	enabled = input(false, { transform: booleanAttribute, alias: 'ngtSelect' });

	constructor() {
		const elementRef = inject<ElementRef<Group | Mesh>>(ElementRef);
		const selection = inject(NgtSelection);
		const autoEffect = injectAutoEffect();

		afterNextRender(() => {
			autoEffect(
				() => {
					const enabled = this.enabled();
					if (!enabled) return;

					const host = elementRef.nativeElement;
					if (!host) return;

					const localState = getLocalState(host);
					if (!localState) return;

					// ngt-mesh[ngtSelect]
					if (host.type === 'Mesh') {
						selection.update((prev) => [...prev, host]);
						return () => selection.update((prev) => prev.filter((el) => el !== host));
					}

					const [collection] = [untracked(selection.selected), localState.objects()];
					let changed = false;
					const current: Object3D[] = [];
					host.traverse((child) => {
						child.type === 'Mesh' && current.push(child);
						if (collection.indexOf(child) === -1) changed = true;
					});

					if (!changed) return;

					selection.update((prev) => [...prev, ...current]);
					return () => {
						selection.update((prev) => prev.filter((el) => !current.includes(el as Object3D)));
					};
				},
				{ allowSignalWrites: true },
			);
		});
	}
}
