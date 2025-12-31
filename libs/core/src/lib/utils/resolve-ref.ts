import { ElementRef } from '@angular/core';
import { is } from './is';

/**
 * Resolves a value that may be wrapped in an Angular ElementRef.
 *
 * If the value is an ElementRef, returns its nativeElement.
 * Otherwise, returns the value directly.
 *
 * @typeParam TObject - The type of the object
 * @param ref - An ElementRef or direct value
 * @returns The unwrapped value
 *
 * @example
 * ```typescript
 * // With ElementRef
 * const mesh = resolveRef(meshRef); // returns meshRef.nativeElement
 *
 * // With direct value
 * const mesh = resolveRef(myMesh); // returns myMesh
 * ```
 */
export function resolveRef<TObject>(ref: ElementRef<TObject | undefined> | TObject | undefined): TObject | undefined {
	if (is.ref(ref)) {
		return ref.nativeElement;
	}

	return ref;
}
