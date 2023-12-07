import { Directive, Input } from '@angular/core';
import type { NgtRef } from '../ref';
import { NgtCommonDirective } from './common';

@Directive({ selector: 'ng-template[parent]', standalone: true })
export class NgtParent extends NgtCommonDirective {
	static override nodeType = 'parent' as const;

	private injectedParent: string | NgtRef<THREE.Object3D> = null!;

	@Input() set parent(parent: string | NgtRef<THREE.Object3D>) {
		if (!parent) return;
		this.injected = false;
		this.injectedParent = parent;
		this.createView();
	}

	get parent() {
		if (this.validate()) {
			this.injected = true;
			return this.injectedParent;
		}
		return null!;
	}

	validate(): boolean {
		return !this.injected && !!this.injectedParent;
	}
}
