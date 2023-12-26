import { CUSTOM_ELEMENTS_SCHEMA, Component, Input } from '@angular/core';
import { extend, injectBeforeRender, injectNgtRef, signalStore, type NgtGroup } from 'angular-three-old';
import * as THREE from 'three';
import { Group } from 'three';

extend({ Group });

export type NgtsFloatState = {
	enabled: boolean;
	speed: number;
	rotationIntensity: number;
	floatIntensity: number;
	floatingRange: [number?, number?];
};

declare global {
	interface HTMLElementTagNameMap {
		/**
		 * @extends ngt-group
		 */
		'ngts-float': NgtsFloatState & NgtGroup;
	}
}

@Component({
	selector: 'ngts-float',
	standalone: true,
	template: `
		<ngt-group ngtCompound>
			<ngt-group [ref]="floatRef" [matrixAutoUpdate]="false">
				<ng-content />
			</ngt-group>
		</ngt-group>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsFloat {
	private inputs = signalStore<NgtsFloatState>({
		enabled: true,
		speed: 1,
		rotationIntensity: 1,
		floatIntensity: 1,
		floatingRange: [-0.1, 0.1],
	});

	@Input() floatRef = injectNgtRef<Group>();
	@Input({ alias: 'enabled' }) set _enabled(enabled: boolean) {
		this.inputs.set({ enabled });
	}

	@Input({ alias: 'speed' }) set _speed(speed: number) {
		this.inputs.set({ speed });
	}

	@Input({ alias: 'rotationIntensity' }) set _rotationIntensity(rotationIntensity: number) {
		this.inputs.set({ rotationIntensity });
	}

	@Input({ alias: 'floatIntensity' }) set _floatIntensity(floatIntensity: number) {
		this.inputs.set({ floatIntensity });
	}

	@Input({ alias: 'floatingRange' }) set _floatingRange(floatingRange: [number?, number?]) {
		this.inputs.set({ floatingRange });
	}

	constructor() {
		this.beforeRender();
	}

	private beforeRender() {
		const offset = Math.random() * 10_000;
		injectBeforeRender(({ clock }) => {
			const float = this.floatRef.nativeElement;
			if (!float) return;

			const { enabled, speed, rotationIntensity, floatingRange, floatIntensity } = this.inputs.get();

			if (!enabled || speed === 0) return;
			const t = offset + clock.getElapsedTime();
			float.rotation.x = (Math.cos((t / 4) * speed) / 8) * rotationIntensity;
			float.rotation.y = (Math.sin((t / 4) * speed) / 8) * rotationIntensity;
			float.rotation.z = (Math.sin((t / 4) * speed) / 20) * rotationIntensity;
			let yPosition = Math.sin((t / 4) * speed) / 10;
			yPosition = THREE.MathUtils.mapLinear(
				yPosition,
				-0.1,
				0.1,
				floatingRange?.[0] ?? -0.1,
				floatingRange?.[1] ?? 0.1,
			);
			float.position.y = yPosition * floatIntensity;
			float.updateMatrix();
		});
	}
}
