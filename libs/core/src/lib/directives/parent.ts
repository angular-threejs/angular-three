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
import { Object3D } from 'three';
import { SPECIAL_INTERNAL_ADD_COMMENT, SPECIAL_INTERNAL_SET_PARENT_COMMENT } from '../renderer/constants';
import { injectStore } from '../store';
import { NgtNullish } from '../types';

@Directive({ selector: 'ng-template[parent]' })
export class NgtParent {
	parent = input.required<
		string | Object3D | ElementRef<Object3D> | (() => NgtNullish<ElementRef<Object3D> | Object3D | string>)
	>();

	private vcr = inject(ViewContainerRef);
	private template = inject(TemplateRef);
	private store = injectStore();
	private scene = this.store.select('scene');

	protected injected = false;
	protected injectedParent: NgtNullish<Object3D> = null;
	private view?: EmbeddedViewRef<unknown>;

	private _parent = computed(() => {
		const parent = this.parent();
		const rawParent = typeof parent === 'function' ? parent() : parent;
		if (!rawParent) return null;

		const scene = this.scene();
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
		if (commentNode[SPECIAL_INTERNAL_ADD_COMMENT]) {
			commentNode[SPECIAL_INTERNAL_ADD_COMMENT]('parent');
			delete commentNode[SPECIAL_INTERNAL_ADD_COMMENT];
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
		if (comment[SPECIAL_INTERNAL_SET_PARENT_COMMENT]) {
			comment[SPECIAL_INTERNAL_SET_PARENT_COMMENT](this.injectedParent);
		}

		this.view = this.vcr.createEmbeddedView(this.template);
		this.view.detectChanges();
	}
}
