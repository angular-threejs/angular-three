import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, DOCUMENT, inject } from '@angular/core';
import { NgtArgs } from 'angular-three';
import { NgtsGrid } from 'angular-three-soba/abstractions';
import { NgtsMeshReflectorMaterial } from 'angular-three-soba/materials';
import * as THREE from 'three';

@Component({
	selector: 'app-grid-floor',
	template: `
		<ngt-group>
			<ngt-mesh [rotation.x]="-Math.PI / 2" [position.y]="-0.1" receiveShadow>
				<ngt-plane-geometry *args="[200, 200]" />
				<ngts-mesh-reflector-material
					[options]="{
						mirror: 1,
						blur: [512, 512],
						resolution: 512,
						mixBlur: 2,
						mixStrength: 1,
						roughness: 0.5,
						metalness: 0.5,
						color: '#ffffff',
						depthScale: 1.8,
						transparent: true,
						alphaMap: alphaMap,
					}"
				/>
			</ngt-mesh>
			<ngts-grid
				[options]="{
					planeArgs: [100, 100],
					position: [0, 0, 0],
					cellSize: 3,
					cellThickness: 1,
					cellColor: '#adadad',
					sectionSize: 1,
					sectionThickness: 0.5,
					sectionColor: '#5c5854',
					fadeDistance: 67,
					fadeStrength: 3.2,
					infiniteGrid: true,
					followCamera: false,
				}"
			/>
		</ngt-group>
	`,
	imports: [NgtArgs, NgtsMeshReflectorMaterial, NgtsGrid],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GridFloor {
	protected readonly Math = Math;

	private document = inject(DOCUMENT);

	get alphaMap() {
		const canvas = this.document.createElement('canvas');
		canvas.width = canvas.height = 512;
		const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

		const size = 512;
		const half = size / 2;
		const gradient = ctx.createRadialGradient(half, half, 0, half, half, half);

		gradient.addColorStop(0, '#ffffff');
		gradient.addColorStop(Math.min(0.16, 0.99), '#ffffff');
		gradient.addColorStop(Math.min(0.66, 1), '#000000');
		gradient.addColorStop(1, '#000000');

		ctx.fillStyle = gradient;
		ctx.fillRect(0, 0, size, size);

		const texture = new THREE.CanvasTexture(canvas);
		texture.needsUpdate = true;
		return texture;
	}
}
