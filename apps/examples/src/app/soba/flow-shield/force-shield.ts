import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, viewChild } from '@angular/core';
import { beforeRender, extend, NgtThreeEvent } from 'angular-three';
import { gltfResource } from 'angular-three-soba/loaders';
import * as THREE from 'three';
import { GLTF } from 'three-stdlib';
import { MAX_HITS, ShieldMaterial } from './shield-material';

import logoUrl from './polygraph-logo-basic.glb' with { loader: 'file' };

interface PolygraphLogoGLTF extends GLTF {
	nodes: {
		Polygraph_Basic_Extruded_Mark: THREE.Mesh;
	};
}

@Component({
	selector: 'app-force-shield',
	template: `
		@if (gltf.value(); as gltf) {
			<ngt-group #shieldGroup [position]="[0, 2, 0.2]" [rotation.x]="Math.PI / 2">
				<ngt-mesh
					(click)="onClick($event)"
					[geometry]="gltf.nodes.Polygraph_Basic_Extruded_Mark.geometry"
					[renderOrder]="2"
				>
					<ngt-shield-material #shieldMaterial />
				</ngt-mesh>
			</ngt-group>
		}
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForceShield {
	protected readonly Math = Math;
	protected readonly gltf = gltfResource<PolygraphLogoGLTF>(() => logoUrl);

	private shieldGroupRef = viewChild<ElementRef<THREE.Group>>('shieldGroup');
	private shieldMaterialRef = viewChild<ElementRef<ShieldMaterial>>('shieldMaterial');

	private hitIndex = 0;
	private time = 0;
	private life = 1;
	private hitDamage = 10;
	private lastHitTime = Number.NEGATIVE_INFINITY;
	private regenDelay = 3;
	private regenRate = 0.2;
	private regenEffectStrength = 0;
	private regenEffectProgress = 0;
	private reveal = 1;
	private boundsInitialized = false;

	constructor() {
		extend({ ShieldMaterial });

		beforeRender(({ delta, clock }) => {
			const material = this.shieldMaterialRef()?.nativeElement;
			if (!material) return;

			if (!this.boundsInitialized) {
				const logo = this.gltf.value()?.nodes.Polygraph_Basic_Extruded_Mark;
				if (logo) {
					logo.geometry.computeBoundingBox();
					const box = logo.geometry.boundingBox;
					if (box) {
						material.uniforms['uBoundsMin'].value.copy(box.min);
						material.uniforms['uBoundsMax'].value.copy(box.max);
						this.boundsInitialized = true;
					}
				}
			}

			this.time = clock.elapsedTime;
			const regenActive = this.time - this.lastHitTime >= this.regenDelay && this.life < 1;
			if (regenActive) {
				this.life = Math.min(1, this.life + delta * this.regenRate);
			}
			this.regenEffectStrength = THREE.MathUtils.damp(this.regenEffectStrength, regenActive ? 1 : 0, 4, delta);
			if (regenActive || this.regenEffectStrength > 0.001) {
				this.regenEffectProgress += delta;
			}
			const heartbeatPhase = this.regenEffectProgress * 0.82;
			const heartbeat =
				this.gaussianPulse(heartbeatPhase, 0.12, 0.045) + this.gaussianPulse(heartbeatPhase, 0.28, 0.07) * 0.45;
			const scale = 1 + heartbeat * this.regenEffectStrength * 0.05;
			this.shieldGroupRef()?.nativeElement.scale.setScalar(scale);

			material.uniforms['uTime'].value = this.time;
			material.uniforms['uLife'].value = this.life;
			material.uniforms['uRegenStrength'].value = this.regenEffectStrength;
			material.uniforms['uRegenProgress'].value = this.regenEffectProgress;

			const target = 0;
			this.reveal = THREE.MathUtils.lerp(this.reveal, target, 1 - Math.exp(-3.5 * delta));
			if (this.reveal < 0.005) this.reveal = 0;

			material.uniforms['uReveal'].value = this.reveal;
			material.visible = this.reveal < 1;
		});
	}

	protected onClick(event: NgtThreeEvent<MouseEvent>) {
		event.stopPropagation();
		const material = this.shieldMaterialRef()?.nativeElement;
		if (!material) return;

		// e.point is world-space; worldToLocal gives object space,
		// matching vObjPos (position attribute) in the vertex shader.
		const localPoint = event.object.worldToLocal(event.point.clone());

		const idx = this.hitIndex % MAX_HITS;
		this.hitIndex++;

		const u = material.uniforms;
		u['uHitPos'].value[idx].copy(localPoint);
		u['uHitTime'].value[idx] = this.time;

		this.lastHitTime = this.time;
		this.life = Math.max(0, this.life - this.hitDamage / 100);
	}

	private gaussianPulse(phase: number, center: number, width: number) {
		const wrappedPhase = phase - Math.floor(phase);
		const offset = (wrappedPhase - center) / width;
		return Math.exp(-(offset * offset));
	}
}
