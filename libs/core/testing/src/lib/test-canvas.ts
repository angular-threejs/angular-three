import {
	ChangeDetectionStrategy,
	Component,
	ComponentRef,
	DestroyRef,
	effect,
	inject,
	input,
	Type,
	viewChild,
	ViewContainerRef,
} from '@angular/core';
import { injectStore, NGT_CANVAS_CONTENT_FLAG, NGT_RENDERER_NODE_FLAG, NgtAnyRecord } from 'angular-three';

@Component({
	selector: 'ngt-test-canvas',
	template: `
		<ng-container #anchor />
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgtTestCanvas {
	sceneGraph = input.required<Type<unknown>>();
	sceneGraphInputs = input<NgtAnyRecord>({});

	private anchorRef = viewChild.required('anchor', { read: ViewContainerRef });

	private store = injectStore();

	sceneRef?: ComponentRef<unknown>;

	constructor() {
		effect(() => {
			const anchor = this.anchorRef();
			const sceneGraph = this.sceneGraph();
			if (!sceneGraph) return;

			const sceneGraphInputs = this.sceneGraphInputs();

			const anchorComment = anchor.element.nativeElement;
			anchorComment.data = NGT_CANVAS_CONTENT_FLAG;
			anchorComment[NGT_CANVAS_CONTENT_FLAG] = this.store;
			if (anchorComment[NGT_RENDERER_NODE_FLAG]) {
				anchorComment[NGT_RENDERER_NODE_FLAG][5] = this.store.snapshot.scene;
			}

			this.sceneRef = anchor.createComponent(sceneGraph);

			for (const key in sceneGraphInputs) {
				this.sceneRef.setInput(key, sceneGraphInputs[key]);
			}

			this.sceneRef.changeDetectorRef.detectChanges();
		});

		inject(DestroyRef).onDestroy(() => {
			this.destroy();
		});
	}

	destroy() {
		this.sceneRef?.destroy();
	}
}
