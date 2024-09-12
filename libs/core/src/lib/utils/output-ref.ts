import { OutputEmitterRef } from '@angular/core';

export function getEmitter<T>(emitterRef: OutputEmitterRef<T> | undefined) {
	if (!emitterRef || !emitterRef['listeners'] || emitterRef['destroyed']) return undefined;
	return emitterRef.emit.bind(emitterRef);
}

export function hasListener(...emitterRefs: (OutputEmitterRef<unknown> | undefined)[]) {
	return emitterRefs.some(
		(emitterRef) =>
			emitterRef && !emitterRef['destroyed'] && emitterRef['listeners'] && emitterRef['listeners'].length > 0,
	);
}
