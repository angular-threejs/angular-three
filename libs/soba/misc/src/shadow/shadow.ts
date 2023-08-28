import { CUSTOM_ELEMENTS_SCHEMA, Component, Input, computed } from '@angular/core';
import { NgtArgs, extend, injectNgtRef, signalStore, type NgtMesh } from 'angular-three';
import * as THREE from 'three';
import { CanvasTexture, Mesh, MeshBasicMaterial, PlaneGeometry } from 'three';

export type NgtsShadowState = {
	colorStop: number;
	fog: boolean;
	color: THREE.ColorRepresentation;
	opacity: number;
	depthWrite: boolean;
};

declare global {
	interface HTMLElementTagNameMap {
		/**
		 * @extends ngt-mesh
		 */
		'ngts-shadow': NgtsShadowState & NgtMesh;
	}
}

extend({ Mesh, CanvasTexture, PlaneGeometry, MeshBasicMaterial });

@Component({
	selector: 'ngts-shadow',
	standalone: true,
	template: `
		<ngt-mesh ngtCompound [ref]="shadowRef" [rotation]="[-Math.PI / 2, 0, 0]">
			<ngt-plane-geometry />
			<ngt-mesh-basic-material
				[transparent]="true"
				[opacity]="opacity()"
				[fog]="fog()"
				[depthWrite]="depthWrite()"
				[side]="DoubleSide"
			>
				<ngt-canvas-texture *args="[canvas()]" attach="map" />
			</ngt-mesh-basic-material>
			<ng-content />
		</ngt-mesh>
	`,
	imports: [NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsShadow {
	Math = Math;
	DoubleSide = THREE.DoubleSide;

	private inputs = signalStore<NgtsShadowState>({
		fog: false,
		depthWrite: false,
		colorStop: 0.0,
		color: 'black',
		opacity: 0.5,
	});

	@Input() shadowRef = injectNgtRef<Mesh>();

	@Input({ alias: 'colorStop' }) set _colorStop(colorStop: number) {
		this.inputs.set({ colorStop });
	}

	@Input({ alias: 'fog' }) set _fog(fog: boolean) {
		this.inputs.set({ fog });
	}

	@Input({ alias: 'color' }) set _color(color: THREE.ColorRepresentation) {
		this.inputs.set({ color });
	}

	@Input({ alias: 'opacity' }) set _opacity(opacity: number) {
		this.inputs.set({ opacity });
	}

	@Input({ alias: 'depthWrite' }) set _depthWrite(depthWrite: boolean) {
		this.inputs.set({ depthWrite });
	}

	private colorStop = this.inputs.select('colorStop');
	private color = this.inputs.select('color');

	opacity = this.inputs.select('opacity');
	fog = this.inputs.select('fog');
	depthWrite = this.inputs.select('depthWrite');

	canvas = computed(() => {
		const [colorStop, color] = [this.colorStop(), this.color()];
		const canvas = document.createElement('canvas');
		canvas.width = 128;
		canvas.height = 128;
		const context = canvas.getContext('2d') as CanvasRenderingContext2D;
		const gradient = context.createRadialGradient(
			canvas.width / 2,
			canvas.height / 2,
			0,
			canvas.width / 2,
			canvas.height / 2,
			canvas.width / 2,
		);
		gradient.addColorStop(colorStop, new THREE.Color(color).getStyle());
		gradient.addColorStop(1, 'rgba(0,0,0,0)');
		context.fillStyle = gradient;
		context.fillRect(0, 0, canvas.width, canvas.height);
		return canvas;
	});
}

//
//
// type Props = JSX.IntrinsicElements['mesh'] & {
//   colorStop?: number
//   fog?: boolean
//   color?: Color | number | string
//   opacity?: number
//   depthWrite?: boolean
// }
//
// export const Shadow = React.forwardRef(
//   (
//     { fog = false, renderOrder, depthWrite = false, colorStop = 0.0, color = 'black', opacity = 0.5, ...props }: Props,
//     ref
//   ) => {
//     const canvas = React.useMemo(() => {
//       const canvas = document.createElement('canvas')
//       canvas.width = 128
//       canvas.height = 128
//       const context = canvas.getContext('2d') as CanvasRenderingContext2D
//       const gradient = context.createRadialGradient(
//         canvas.width / 2,
//         canvas.height / 2,
//         0,
//         canvas.width / 2,
//         canvas.height / 2,
//         canvas.width / 2
//       )
//       gradient.addColorStop(colorStop, new Color(color).getStyle())
//       gradient.addColorStop(1, 'rgba(0,0,0,0)')
//       context.fillStyle = gradient
//       context.fillRect(0, 0, canvas.width, canvas.height)
//       return canvas
//     }, [color, colorStop])
//     return (
//       <mesh renderOrder={renderOrder} ref={ref as React.MutableRefObject<Mesh>} rotation-x={-Math.PI / 2} {...props}>
//         <planeGeometry />
//         <meshBasicMaterial transparent opacity={opacity} fog={fog} depthWrite={depthWrite} side={DoubleSide}>
//           <canvasTexture attach="map" args={[canvas]} />
//         </meshBasicMaterial>
//       </mesh>
//     )
//   }
// )
