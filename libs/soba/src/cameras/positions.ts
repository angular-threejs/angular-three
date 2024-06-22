import { computed } from '@angular/core';

const NUM = 3;

export interface Position {
	id: string;
	position: [number, number, number];
}

export const positions = computed(() => {
	const pos: Position[] = [];
	const half = (NUM - 1) / 2;

	for (let x = 0; x < NUM; x++) {
		for (let y = 0; y < NUM; y++) {
			pos.push({
				id: `${x}-${y}`,
				position: [(x - half) * 4, (y - half) * 4, 0],
			});
		}
	}

	return pos;
});
