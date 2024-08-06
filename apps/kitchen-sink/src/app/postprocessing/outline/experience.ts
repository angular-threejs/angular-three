import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, signal } from '@angular/core';
import { NgtArgs, NgtHexify, NgtSelect, NgtSelection } from 'angular-three';
import { NgtpEffectComposer, NgtpOutline } from 'angular-three-postprocessing';
import { NgtsOrbitControls } from 'angular-three-soba/controls';

/**
 * There are multiple ways to use the Outline effect.
 *
 * 1. Via NgtSelection and NgtSelect
 *    This is the recommended way to use the Outline effect.
 *
 *    1a. We can use NgtSelection as hostDirective (as shown) to enable Selection on the entire scene.
 *        NgtpOutline will automatically be aware of the NgtSelection context and will use it for the selected objects.
 *
 *    1b. We can wrap `<ng-container ngtSelection>` around the objects we want to select AS WELL AS the Outline effect.
 *
 * 2. Via selection input on NgtpOutline
 *    If we want to control the selection ourselves, we can pass in the selection input an Array of Object3D or ElementRef<Object3D>
 *      then we control this selection collection based on our own logic.
 *
 *      <ngtp-outline [options]="{ selection: selection(), edgeStrength: 100, pulseSpeed: 0 }" />
 *
 */

@Component({
	standalone: true,
	template: `
		<ngt-color attach="background" *args="['black']" />

		<ngts-orbit-controls />

		<ngt-ambient-light />
		<ngt-point-light [position]="[0, -1, -1]" [decay]="0" color="green" />
		<ngt-directional-light [position]="[0, 1, 1]" />

		<ngt-select [enabled]="hovered()" (pointerenter)="hovered.set(true)" (pointerleave)="hovered.set(false)">
			<ngt-mesh>
				<ngt-box-geometry />
				<ngt-mesh-standard-material color="hotpink" />
			</ngt-mesh>
		</ngt-select>

		<ngtp-effect-composer [options]="{ autoClear: false }">
			<ngtp-outline [options]="{ edgeStrength: 100, pulseSpeed: 0 }" />
		</ngtp-effect-composer>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'postprocessing-sample' },
	hostDirectives: [NgtSelection],
	imports: [NgtsOrbitControls, NgtSelect, NgtHexify, NgtpEffectComposer, NgtpOutline, NgtArgs],
})
export class Experience {
	hovered = signal(false);
}
