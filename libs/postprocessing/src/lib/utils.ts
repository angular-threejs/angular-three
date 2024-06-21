import { Signal, computed } from '@angular/core';
import { Vector2, Vector2Tuple } from 'three';

export function vector2<TObject extends object>(options: Signal<TObject>, key: keyof TObject) {
	return computed(() => {
		const value = options()[key];
		if (typeof value === 'number') return new Vector2(value, value);
		else if (value) return new Vector2(...(value as Vector2Tuple));
		else return new Vector2();
	});
}
