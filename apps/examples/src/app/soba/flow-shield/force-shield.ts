import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, inject, viewChild } from '@angular/core';
import { beforeRender, extend, NgtThreeEvent } from 'angular-three';
import { gltfResource } from 'angular-three-soba/loaders';
import * as THREE from 'three';
import { GLTF } from 'three-stdlib';
import { MAX_HITS, ShieldMaterial } from './shield-material';
import { FlowShieldState } from './state';

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
			<ngt-group #shieldGroup [position]="state.shield.position()" [rotation.x]="state.shield.rotationX()">
				<ngt-mesh
					(click)="onClick($event)"
					[geometry]="gltf.nodes.Polygraph_Basic_Extruded_Mark.geometry"
					[renderOrder]="state.shield.renderOrder()"
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
	protected state = inject(FlowShieldState);
	protected readonly gltf = gltfResource<PolygraphLogoGLTF>(() => logoUrl);

	private shieldGroupRef = viewChild<ElementRef<THREE.Group>>('shieldGroup');
	private shieldMaterialRef = viewChild<ElementRef<ShieldMaterial>>('shieldMaterial');

	private hitIndex = 0;
	private time = 0;
	private lastHitTime = Number.NEGATIVE_INFINITY;
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
			const shield = this.state.shield;
			const regenActive = this.time - this.lastHitTime >= shield.regenDelay() && shield.life() < 1;
			if (regenActive) {
				shield.life.set(Math.min(1, shield.life() + delta * shield.regenRate()));
			}
			this.regenEffectStrength = THREE.MathUtils.damp(this.regenEffectStrength, regenActive ? 1 : 0, 4, delta);
			if (regenActive || this.regenEffectStrength > 0.001) {
				this.regenEffectProgress += delta;
			}
			const heartbeatPhase = this.regenEffectProgress * 0.82;
			const heartbeat =
				this.gaussianPulse(heartbeatPhase, 0.12, 0.045) + this.gaussianPulse(heartbeatPhase, 0.28, 0.07) * 0.45;
			const scale = 1 + heartbeat * this.regenEffectStrength * shield.regenPulseScale();
			this.shieldGroupRef()?.nativeElement.scale.setScalar(scale);

			material.uniforms['uTime'].value = this.time;
			material.uniforms['uColor'].value.set(shield.color());
			material.uniforms['uLife'].value = shield.life();
			material.uniforms['uHexScale'].value = shield.hexScale();
			material.uniforms['uEdgeWidth'].value = shield.edgeWidth();
			material.uniforms['uFresnelPower'].value = shield.fresnelPower();
			material.uniforms['uFresnelStrength'].value = shield.fresnelStrength();
			material.uniforms['uOpacity'].value = shield.opacity();
			material.uniforms['uFlashSpeed'].value = shield.flashSpeed();
			material.uniforms['uFlashIntensity'].value = shield.flashIntensity();
			material.uniforms['uNoiseScale'].value = shield.noiseScale();
			material.uniforms['uNoiseEdgeColor'].value.set(shield.noiseEdgeColor());
			material.uniforms['uNoiseEdgeWidth'].value = shield.noiseEdgeWidth();
			material.uniforms['uNoiseEdgeIntensity'].value = shield.noiseEdgeIntensity();
			material.uniforms['uNoiseEdgeSmoothness'].value = shield.noiseEdgeSmoothness();
			material.uniforms['uHexOpacity'].value = shield.hexOpacity();
			material.uniforms['uShowHex'].value = shield.showHex() ? 1 : 0;
			material.uniforms['uFlowScale'].value = shield.flowScale();
			material.uniforms['uFlowSpeed'].value = shield.flowSpeed();
			material.uniforms['uFlowIntensity'].value = shield.flowIntensity();
			material.uniforms['uHitRingSpeed'].value = shield.hitRingSpeed();
			material.uniforms['uHitRingWidth'].value = shield.hitRingWidth();
			material.uniforms['uHitMaxRadius'].value = shield.hitMaxRadius();
			material.uniforms['uHitDuration'].value = shield.hitDuration();
			material.uniforms['uHitIntensity'].value = shield.hitIntensity();
			material.uniforms['uHitImpactRadius'].value = shield.hitImpactRadius();
			material.uniforms['uFadeStart'].value = shield.fadeStart();
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
		const shield = this.state.shield;
		shield.life.set(Math.max(0, shield.life() - shield.hitDamage() / 100));
	}

	private gaussianPulse(phase: number, center: number, width: number) {
		const wrappedPhase = phase - Math.floor(phase);
		const offset = (wrappedPhase - center) / width;
		return Math.exp(-(offset * offset));
	}
}
