import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, DestroyRef, inject } from '@angular/core';
import { NgtArgs } from 'angular-three';
import { NgtsSky } from 'angular-three-soba/staging';
import { EcctrlExampleControls } from '../shared/example-controls';
import { DroneFlightRig } from './drone-flight-rig';
import { FlightCity } from './flight-city';

@Component({
	selector: 'app-ecctrl-vehicle-drone-flight-scene',
	template: `
		<ngt-color attach="background" *args="['#101d2d']" />
		<ngt-fog attach="fog" *args="['#101d2d', 62, 190]" />
		<ngts-sky
			[options]="{
				distance: 450,
				sunPosition: [45, 70, 35],
				turbidity: 12,
				rayleigh: 0.45,
				mieCoefficient: 0.008,
				mieDirectionalG: 0.85,
			}"
		/>
		<ngt-hemisphere-light color="#9bbbd4" groundColor="#121827" [intensity]="0.32 * Math.PI" />

		<app-ecctrl-flight-city />
		<app-ecctrl-drone-flight-rig />
	`,
	imports: [DroneFlightRig, FlightCity, NgtArgs, NgtsSky],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class EcctrlVehicleDroneFlightScene {
	protected readonly Math = Math;

	constructor() {
		const controls = inject(EcctrlExampleControls);
		const resetInstructions = controls.setInstructions(
			'Flight drone · W/S climb/descend · A/D yaw · ↑/↓ pitch · ←/→ roll · touch: left altitude/yaw, right pitch/roll',
		);
		controls.flightControlsActive.set(true);
		inject(DestroyRef).onDestroy(() => {
			resetInstructions();
			controls.resetFlightControls();
		});
	}
}
