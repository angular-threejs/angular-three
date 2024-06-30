import { Directive, input } from '@angular/core';
import { Triplet } from '@pmndrs/cannon-worker-api';

@Directive({ standalone: true })
export class PositionRotationInput {
	position = input<Triplet>([0, 0, 0]);
	rotation = input<Triplet>([0, 0, 0]);
}
