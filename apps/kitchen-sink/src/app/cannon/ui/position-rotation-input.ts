import { Directive, input } from '@angular/core';
import { Triplet } from '@pmndrs/cannon-worker-api';

@Directive()
export class PositionRotationInput {
	position = input<Triplet>([0, 0, 0]);
	rotation = input<Triplet>([0, 0, 0]);
}
