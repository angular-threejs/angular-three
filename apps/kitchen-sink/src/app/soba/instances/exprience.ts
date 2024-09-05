import {
	ChangeDetectionStrategy,
	Component,
	CUSTOM_ELEMENTS_SCHEMA,
	effect,
	ElementRef,
	viewChild,
} from '@angular/core';
import { extend, NgtArgs } from 'angular-three';
import { NgtsCameraControls } from 'angular-three-soba/controls';
import { shaderMaterial } from 'angular-three-soba/vanilla-exports';
import { BoxGeometry, Color, InstancedMesh, Object3D, Vector3 } from 'three';
import niceColors from '../../colors';

const MeshEdgesMaterial = shaderMaterial(
	{
		color: new Color('white'),
		size: new Vector3(1, 1, 1),
		thickness: 0.01,
		smoothness: 0.2,
	},
	/* language=glsl glsl */ `varying vec3 vPosition;
  void main() {
    vPosition = position;
    gl_Position = projectionMatrix * viewMatrix * instanceMatrix * vec4(position, 1.0);
  }`,
	/* language=glsl glsl*/ `varying vec3 vPosition;
  uniform vec3 size;
  uniform vec3 color;
  uniform float thickness;
  uniform float smoothness;
  void main() {
    vec3 d = abs(vPosition) - (size * 0.5);
    float a = smoothstep(thickness, thickness + smoothness, min(min(length(d.xy), length(d.yz)), length(d.xz)));
    gl_FragColor = vec4(color, 1.0 - a);
  }`,
);

@Component({
	selector: 'app-boxes',
	standalone: true,
	template: `
		<ngt-group>
			<ngt-instanced-mesh #instances *args="[undefined, undefined, length]">
				<ngt-box-geometry #boxGeometry *args="[0.15, 0.15, 0.15]">
					<ngt-instanced-buffer-attribute attach="attributes.color" *args="[randomColors, 3]" />
				</ngt-box-geometry>
				<ngt-mesh-lambert-material [vertexColors]="true" [toneMapped]="false" />
			</ngt-instanced-mesh>
			<ngt-instanced-mesh #outlines *args="[undefined, undefined, length]">
				<ngt-mesh-edges-material
					[transparent]="true"
					[polygonOffset]="true"
					[polygonOffsetFactor]="-10"
					[size]="[0.15, 0.15, 0.15]"
					color="black"
					[thickness]="0.001"
					[smoothness]="0.005"
				/>
			</ngt-instanced-mesh>
		</ngt-group>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtArgs],
})
export class Boxes {
	protected length = 100_000;

	private c = new Color();
	protected randomColors = new Float32Array(
		Array.from({ length: this.length }, () => this.c.set(niceColors[Math.floor(Math.random() * 5)]).toArray()).flat(),
	);

	private instancesRef = viewChild<ElementRef<InstancedMesh>>('instances');
	private outlinesRef = viewChild<ElementRef<InstancedMesh>>('outlines');
	private boxGeometryRef = viewChild<ElementRef<BoxGeometry>>('boxGeometry');

	constructor() {
		extend({ MeshEdgesMaterial });

		const o = new Object3D();

		effect(() => {
			const [instances, outlines, boxGeometry] = [
				this.instancesRef()?.nativeElement,
				this.outlinesRef()?.nativeElement,
				this.boxGeometryRef()?.nativeElement,
			];
			if (!instances || !outlines || !boxGeometry) return;

			let i = 0;
			const root = Math.round(Math.pow(this.length, 1 / 3));
			const halfRoot = root / 2;
			for (let x = 0; x < root; x++)
				for (let y = 0; y < root; y++)
					for (let z = 0; z < root; z++) {
						const id = i++;
						o.rotation.set(Math.random(), Math.random(), Math.random());
						o.position.set(halfRoot - x + Math.random(), halfRoot - y + Math.random(), halfRoot - z + Math.random());
						o.updateMatrix();
						instances.setMatrixAt(id, o.matrix);
					}
			instances.instanceMatrix.needsUpdate = true;
			// Re-use geometry + instance matrix
			outlines.geometry = boxGeometry;
			outlines.instanceMatrix = instances.instanceMatrix;
		});
	}
}

@Component({
	standalone: true,
	template: `
		<ngt-color attach="background" *args="['#e0e0e0']" />

		<ngt-ambient-light [intensity]="0.85" />
		<ngt-directional-light [position]="[150, 150, 150]" [intensity]="1" />

		<app-boxes />

		<ngts-camera-controls />
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: 'instances-soba-experience' },
	imports: [NgtsCameraControls, Boxes, NgtArgs],
})
export class Experience {}
