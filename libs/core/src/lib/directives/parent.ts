import { Directive, input } from '@angular/core';
import { Object3D } from 'three';
import { NgtRef } from '../ref';
import { NgtCommonDirective, provideNodeType } from './common';

@Directive({ selector: 'ng-template[parent]', standalone: true, providers: [provideNodeType('parent')] })
export class NgtParent extends NgtCommonDirective<string | NgtRef<Object3D>> {
	parent = input.required<string | NgtRef<Object3D>>();
	protected override inputValue = this.parent;

	validate(): boolean {
		return !this.injected && !!this.injectedValue;
	}
}
