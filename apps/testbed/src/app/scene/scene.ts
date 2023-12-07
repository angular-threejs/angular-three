import { CUSTOM_ELEMENTS_SCHEMA, ChangeDetectionStrategy, Component } from '@angular/core';
import { NgtArgs } from 'angular-three';
import { NgtsOrbitControls } from 'angular-three-soba/controls';
import { Cube } from '../cube/cube';

@Component({
	standalone: true,
	templateUrl: './scene.html',
	imports: [Cube, NgtArgs, NgtsOrbitControls],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Scene {
	protected Math = Math;
}
