import {
	DestroyRef,
	Directive,
	Input,
	NgZone,
	TemplateRef,
	ViewContainerRef,
	inject,
	type EmbeddedViewRef,
} from '@angular/core';
import { safeDetectChanges } from '../utils/safe-detect-changes';

@Directive({ selector: 'ng-template[key]', standalone: true })
export class NgtKey {
	private vcr = inject(ViewContainerRef);
	private templateRef = inject(TemplateRef);
	private zone = inject(NgZone);

	private lastKey = '';
	private viewRef?: EmbeddedViewRef<unknown>;

	@Input() set key(key: string | number | object) {
		const normalizedKey = key.toString();
		if (this.lastKey !== normalizedKey) {
			this.createView();
			this.lastKey = normalizedKey;
		}
	}

	constructor() {
		inject(DestroyRef).onDestroy(() => {
			this.viewRef?.destroy();
		});
	}

	private createView() {
		if (!this.viewRef?.destroyed) {
			this.viewRef?.destroy();
		}

		this.zone.runOutsideAngular(() => {
			this.viewRef = this.vcr.createEmbeddedView(this.templateRef);
			safeDetectChanges(this.viewRef);
		});
	}
}
