import { OutputEmitterRef } from '@angular/core';

/**
 * Gets the emit function from an OutputEmitterRef if it has active listeners.
 *
 * @typeParam T - The type of value the emitter emits
 * @param emitterRef - The output emitter reference
 * @returns The bound emit function, or undefined if no listeners
 */
export function getEmitter<T>(emitterRef: OutputEmitterRef<T> | undefined) {
	if (!emitterRef || !emitterRef['listeners'] || emitterRef['destroyed']) return undefined;
	return emitterRef.emit.bind(emitterRef);
}

/**
 * Checks if any of the provided emitter refs have active listeners.
 *
 * @param emitterRefs - The output emitter references to check
 * @returns true if any emitter has listeners
 */
export function hasListener(...emitterRefs: (OutputEmitterRef<unknown> | undefined)[]) {
	return emitterRefs.some(
		(emitterRef) =>
			emitterRef && !emitterRef['destroyed'] && emitterRef['listeners'] && emitterRef['listeners'].length > 0,
	);
}
