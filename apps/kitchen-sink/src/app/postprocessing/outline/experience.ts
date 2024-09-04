import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, signal } from '@angular/core';
import { NgtArgs, NgtSelect, NgtSelection } from 'angular-three';
import { NgtpEffectComposer, NgtpOutline, NgtpSMAA } from 'angular-three-postprocessing';
import { NgtsOrbitControls } from 'angular-three-soba/controls';
import { KernelSize } from 'postprocessing';

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
 *    ngtSelect can be used on ngt-group or ngt-mesh. ngt-group will select all children, ngt-mesh will only select itself.
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

		<ngt-group [ngtSelect]="hovered()" (pointerenter)="hovered.set(true)" (pointerleave)="hovered.set(false)">
			<ngt-mesh>
				<ngt-box-geometry />
				<ngt-mesh-standard-material color="hotpink" />
			</ngt-mesh>
			<ngt-mesh [position]="[0.5, -0.25, 0.75]">
				<ngt-sphere-geometry *args="[0.25]" />
				<ngt-mesh-standard-material color="orange" />
			</ngt-mesh>
			<ngt-mesh [position]="[-0.5, -0.25, 0.75]">
				<ngt-cone-geometry *args="[0.25, 0.5]" />
				<ngt-mesh-standard-material color="yellow" />
			</ngt-mesh>
		</ngt-group>

		<ngtp-effect-composer [options]="{ autoClear: false, multisampling: 0 }">
			<ngtp-outline [options]="{ edgeStrength: 2.5, pulseSpeed: 0, blur: true, kernelSize: KernelSize.SMALL }" />
			<ngtp-smaa />
		</ngtp-effect-composer>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'postprocessing-sample' },
	hostDirectives: [NgtSelection],
	imports: [NgtsOrbitControls, NgtSelect, NgtpEffectComposer, NgtpOutline, NgtArgs, NgtpSMAA],
})
export class Experience {
	protected KernelSize = KernelSize;
	protected hovered = signal(false);
}
