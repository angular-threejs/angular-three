import {
	computed,
	DestroyRef,
	Directive,
	effect,
	ElementRef,
	EmbeddedViewRef,
	inject,
	input,
	TemplateRef,
	ViewContainerRef,
} from '@angular/core';
import type * as THREE from 'three';
import { SPECIAL_INTERNAL_ADD_COMMENT_FLAG, SPECIAL_INTERNAL_SET_PARENT_COMMENT_FLAG } from '../renderer/constants';
import { injectStore } from '../store';
import { NgtNullish } from '../types';

@Directive({ selector: 'ng-template[parent]' })
export class NgtParent {
	parent = input.required<
		| string
		| THREE.Object3D
		| ElementRef<THREE.Object3D>
		| (() => NgtNullish<ElementRef<THREE.Object3D> | THREE.Object3D | string>)
	>();

	private vcr = inject(ViewContainerRef);
	private template = inject(TemplateRef);
	private store = injectStore();

	protected injected = false;
	protected injectedParent: NgtNullish<THREE.Object3D> = null;
	private view?: EmbeddedViewRef<unknown>;

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

	constructor() {
		const commentNode = this.vcr.element.nativeElement;
		commentNode.data = 'parent-container';
		if (commentNode[SPECIAL_INTERNAL_ADD_COMMENT_FLAG]) {
			commentNode[SPECIAL_INTERNAL_ADD_COMMENT_FLAG]('parent');
			delete commentNode[SPECIAL_INTERNAL_ADD_COMMENT_FLAG];
		}

		effect(() => {
			const parent = this._parent();
			if (!parent) return;

			this.injected = false;
			this.injectedParent = parent;
			this.createView();
		});

		inject(DestroyRef).onDestroy(() => {
			this.view?.destroy();
		});
	}

	get value() {
		if (this.validate()) {
			this.injected = true;
			return this.injectedParent;
		}
		return null;
	}

	validate() {
		return !this.injected && !!this.injectedParent;
	}

	private createView() {
		if (this.view && !this.view.destroyed) this.view.destroy();

		const comment = this.vcr.element.nativeElement;
		if (comment[SPECIAL_INTERNAL_SET_PARENT_COMMENT_FLAG]) {
			comment[SPECIAL_INTERNAL_SET_PARENT_COMMENT_FLAG](this.injectedParent);
		}

		this.view = this.vcr.createEmbeddedView(this.template);
		this.view.detectChanges();
	}
}
