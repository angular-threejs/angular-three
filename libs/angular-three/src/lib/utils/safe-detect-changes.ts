import { ChangeDetectorRef } from '@angular/core';
import type { NgtAnyRecord } from '../types';

export function safeDetectChanges(cdr: ChangeDetectorRef | undefined | null) {
    if (!cdr) return;
    try {
        if ((cdr as NgtAnyRecord)['_attachedToViewContainer']) {
            cdr.detectChanges();
        }
    } catch (e) {
        cdr.markForCheck();
    }
}
