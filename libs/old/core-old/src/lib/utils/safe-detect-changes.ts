import type { ChangeDetectorRef } from '@angular/core';
import type { NgtAnyRecord } from '../types';

export function safeDetectChanges(...cdrs: (ChangeDetectorRef | undefined | null)[]) {
	cdrs.forEach((cdr) => {
		if (!cdr) return;
		try {
			// dynamic created component with ViewContainerRef#createComponent does not have Context
			// but it has _attachedToViewContainer
			if ((cdr as NgtAnyRecord)['_attachedToViewContainer'] || !!(cdr as NgtAnyRecord)['context']) {
				cdr.detectChanges();
			}
		} catch (e) {
			cdr.markForCheck();
		}
	});
}
