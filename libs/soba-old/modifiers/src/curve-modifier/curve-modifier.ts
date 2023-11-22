import { CUSTOM_ELEMENTS_SCHEMA, Component, Input, effect, signal, untracked } from '@angular/core';
import { NgtArgs, NgtPortal, NgtPortalContent, injectNgtRef, prepare, signalStore } from 'angular-three-old';
import * as THREE from 'three';
import { Flow } from 'three-stdlib';

export type NgtsCurveModifierState = {
	curve?: THREE.Curve<THREE.Vector3>;
};

declare global {
	interface HTMLElementTagNameMap {
		'ngts-curve-modifier': NgtsCurveModifierState;
	}
}

@Component({
	selector: 'ngts-curve-modifier',
	standalone: true,
	template: `
		<ngt-portal [container]="sceneRef" [autoRender]="false">
			<ng-content *ngtPortalContent />
		</ngt-portal>
		<ngt-primitive *args="[modifierObject()]" />
	`,
	imports: [NgtArgs, NgtPortal, NgtPortalContent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsCurveModifier {
	private inputs = signalStore<NgtsCurveModifierState>();

	@Input({ alias: 'curve' }) set _curve(curve: THREE.Curve<THREE.Vector3>) {
		this.inputs.set({ curve });
	}

	private curve = this.inputs.select('curve');

	sceneRef = injectNgtRef(prepare(new THREE.Scene()));
	private sceneRefChildren = this.sceneRef.children();

	private modifier?: Flow;
	modifierObject = signal<THREE.Object3D | null>(null);

	constructor() {
		effect(() => {
			this.sceneRefChildren();
			untracked(() => {
				this.modifier = new Flow(this.sceneRef.nativeElement.children[0] as THREE.Mesh);
				this.modifierObject.set(this.modifier.object3D);
			});
		});

		effect(() => {
			const curve = this.curve();
			this.modifierObject();
			if (curve) {
				this.modifier?.updateCurve(0, curve);
			}
		});
	}

	moveAlongCurve(value: number) {
		this.modifier?.moveAlongCurve(value);
	}
}
