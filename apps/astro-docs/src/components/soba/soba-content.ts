import { InjectionToken, signal, type Type, type WritableSignal } from '@angular/core';

export const SOBA_CONTENT = new InjectionToken<WritableSignal<Type<any> | null>>('SobaContent');

const sobaContent = signal<Type<any> | null>(null);

export function provideSobaContent() {
	return { provide: SOBA_CONTENT, useValue: sobaContent };
}
