import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, DOCUMENT, inject } from '@angular/core';
import { NgtArgs } from 'angular-three';
import { NgtsGrid } from 'angular-three-soba/abstractions';
import { NgtsMeshReflectorMaterial } from 'angular-three-soba/materials';
import * as THREE from 'three';
import { FlowShieldState } from './state';

@Component({
	selector: 'app-grid-floor',
	template: `
		<ngt-group>
			<ngt-mesh [rotation.x]="-Math.PI / 2" [position.y]="state.grid.floorPositionY()" receiveShadow>
				<ngt-plane-geometry *args="state.grid.floorSize()" />
				<ngts-mesh-reflector-material
					[options]="{
						mirror: state.reflector.mirror(),
						blur: [state.reflector.blurX(), state.reflector.blurY()],
						resolution: state.reflector.resolution(),
						mixBlur: state.reflector.mixBlur(),
						mixStrength: state.reflector.mixStrength(),
						roughness: state.reflector.roughness(),
						metalness: state.reflector.metalness(),
						color: state.reflector.color(),
						depthScale: state.reflector.depthScale(),
						transparent: state.reflector.transparent(),
						alphaMap: alphaMap,
					}"
				/>
			</ngt-mesh>
			<ngts-grid
				[options]="{
					planeArgs: state.grid.planeSize(),
					position: state.grid.position(),
					cellSize: state.grid.cellSize(),
					cellThickness: state.grid.cellThickness(),
					cellColor: state.grid.cellColor(),
					sectionSize: state.grid.sectionSize(),
					sectionThickness: state.grid.sectionThickness(),
					sectionColor: state.grid.sectionColor(),
					fadeDistance: state.grid.fadeDistance(),
					fadeStrength: state.grid.fadeStrength(),
					infiniteGrid: state.grid.infiniteGrid(),
					followCamera: state.grid.followCamera(),
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
	protected state = inject(FlowShieldState);

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
