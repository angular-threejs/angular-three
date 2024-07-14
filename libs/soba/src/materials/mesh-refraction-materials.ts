import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, input, Signal } from '@angular/core';
import { Meta } from '@storybook/angular';
import { injectLoader } from 'angular-three';
import { NgtsCameraContent, NgtsCubeCamera } from 'angular-three-soba/cameras';
import { injectGLTF } from 'angular-three-soba/loaders';
import { NgtsMeshRefractionMaterialOptions } from 'angular-three-soba/materials';
import { RGBELoader } from 'three-stdlib';
import { makeDecorators } from '../setup-canvas';

@Component({
	selector: 'diamond-flat',
	standalone: true,
	template: `
		<ngts-cube-camera [options]="{ envMap: texture(), frames: 1, resolution: 256 }">
			<ng-template cameraContent let-texture></ng-template>
		</ngts-cube-camera>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtsCubeCamera, NgtsCameraContent],
})
class Diamond {
	rotation = input([0, 0, 0]);
	position = input([0, 0, 0]);
	options = input({} as NgtsMeshRefractionMaterialOptions);

	gltf = injectGLTF(() => './dflat.glb') as Signal<any | null>;
	texture = injectLoader(
		() => RGBELoader,
		() => 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/aerodynamics_workshop_1k.hdr',
	);
}

// const ref = React.useRef<React.ElementRef<'mesh'>>(null)
// const { nodes } = useGLTF('/dflat.glb') as any
// // Use a custom envmap/scene-backdrop for the diamond material
// // This way we can have a clear BG while cube-cam can still film other objects
// const texture = useLoader(
//   RGBELoader,
//   'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/aerodynamics_workshop_1k.hdr'
// )
// return (
//   <CubeCamera resolution={256} frames={1} envMap={texture}>
//   {(texture) => (
//   <Caustics
//     // @ts-ignore
//     backfaces
// color="white"
// position={[0, -0.5, 0]}
// lightSource={[5, 5, -10]}
// worldRadius={0.1}
// ior={1.8}
// backfaceIor={1.1}
// intensity={0.1}
//   >
//   <mesh castShadow ref={ref} geometry={nodes.Diamond_1_0.geometry} rotation={rotation} position={position}>
//   <MeshRefractionMaterial {...meshRefractionMaterialProps} envMap={texture} />
// </mesh>
// </Caustics>
// )}
// </CubeCamera>
// )

export default {
	title: 'Materials/MeshRefractionMaterial',
	decorators: makeDecorators(),
} as Meta;
