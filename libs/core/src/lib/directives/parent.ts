import { computed, Directive, ElementRef, input, linkedSignal } from '@angular/core';
import type * as THREE from 'three';
import {
	NGT_INTERNAL_ADD_COMMENT_FLAG,
	NGT_INTERNAL_SET_PARENT_COMMENT_FLAG,
	NGT_PARENT_FLAG,
} from '../renderer/constants';
import { injectStore } from '../store';
import { NgtNullish } from '../types';
import { NgtCommonDirective } from './common';

@Directive({ selector: 'ng-template[parent]' })
export class NgtParent extends NgtCommonDirective<THREE.Object3D | null | undefined> {
	parent = input.required<
		| string
		| THREE.Object3D
		| ElementRef<THREE.Object3D>
		| (() => NgtNullish<ElementRef<THREE.Object3D> | THREE.Object3D | string>)
	>();

	private store = injectStore();

	private _parent = computed(() => {
		const parent = this.parent();
		const rawParent = typeof parent === 'function' ? parent() : parent;
		if (!rawParent) return null;

		const scene = this.store.scene();
		if (typeof rawParent === 'string') {
			return scene.getObjectByName(rawParent);
		}

		if ('nativeElement' in rawParent) {
			return rawParent.nativeElement;
		}

		return rawParent;
	});

	protected linkedValue = linkedSignal(this._parent);
	protected shouldSkipRender = computed(() => !this._parent());

	constructor() {
		super();

		const commentNode = this.commentNode;
		commentNode.data = NGT_PARENT_FLAG;
		commentNode[NGT_PARENT_FLAG] = true;

		if (commentNode[NGT_INTERNAL_ADD_COMMENT_FLAG]) {
			commentNode[NGT_INTERNAL_ADD_COMMENT_FLAG]('parent', this.injector);
			delete commentNode[NGT_INTERNAL_ADD_COMMENT_FLAG];
		}
	}

	validate() {
		return !this.injected && !!this.injectedValue;
	}

	protected override beforeCreateView() {
		const commentNode = this.commentNode;
		if (commentNode[NGT_INTERNAL_SET_PARENT_COMMENT_FLAG]) {
			commentNode[NGT_INTERNAL_SET_PARENT_COMMENT_FLAG](this.injectedValue);
		}
	}
}
