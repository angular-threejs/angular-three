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
			<ngt-group [position]="[0, 2, 0.2]" [rotation.x]="Math.PI / 2">
				<ngt-mesh (click)="onClick($event)" [geometry]="gltf.nodes.Polygraph_Basic_Extruded_Mark.geometry">
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

	private shieldMaterialRef = viewChild<ElementRef<ShieldMaterial>>('shieldMaterial');

	private hitIndex = 0;
	private time = 0;
	private life = 1;
	private hitDamage = 10;
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
			material.uniforms['uTime'].value = this.time;
			material.uniforms['uLife'].value = this.life;

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

		this.life = Math.max(0, this.life - this.hitDamage / 100);
	}
}
