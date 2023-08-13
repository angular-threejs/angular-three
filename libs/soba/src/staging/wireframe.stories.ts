import { CUSTOM_ELEMENTS_SCHEMA, Component } from '@angular/core';
import { NgtArgs } from 'angular-three';
import { NgtsEnvironment, NgtsWireframe } from 'angular-three-soba/staging';
import { IcosahedronGeometry } from 'three';
import { makeCanvasOptions, makeDecorators, makeStoryFunction } from '../setup-canvas';

@Component({
	standalone: true,
	template: `
		<ngt-mesh>
			<ngt-icosahedron-geometry *args="[1, 16]" />
			<ngt-mesh-physical-material color="red" [roughness]="0.2" [metalness]="1" />
			<ngts-wireframe stroke="white" [squeeze]="true" [dash]="true" />
		</ngt-mesh>

		<ngt-mesh [position]="[0, 0, -2.5]">
			<ngt-torus-knot-geometry />
			<ngt-mesh-basic-material color="red" />
			<ngts-wireframe
				[simplify]="true"
				stroke="white"
				[squeeze]="true"
				[dash]="true"
				[fillMix]="1"
				[fillOpacity]="0.2"
			/>
		</ngt-mesh>

		<ngt-group [position]="[-2.5, 0, -2.5]">
			<ngts-wireframe
				[fill]="blue"
				[geometry]="geometry"
				stroke="white"
				[squeeze]="true"
				[dash]="true"
				[fillMix]="1"
				[fillOpacity]="0.2"
			/>
		</ngt-group>

		<ngt-mesh [position]="[-2.5, 0, 0]">
			<ngt-sphere-geometry *args="[1, 16, 16]" />
			<ngt-shader-material [vertexShader]="vertexShader" [fragmentShader]="fragmentShader" />
			<ngts-wireframe stroke="white" [squeeze]="true" [dash]="true" />
		</ngt-mesh>

		<ngts-environment [background]="true" preset="sunset" [blur]="0.2" />
	`,
	imports: [NgtsWireframe, NgtsEnvironment, NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class DefaultWireframeStory {
	geometry = new IcosahedronGeometry(1, 16);
	vertexShader = /* glsl */ `
	            void main() {
	              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
	            }
	          `;
	fragmentShader = /* glsl */ `
	            void main() {
	              float edge = getWireframe();
	              gl_FragColor = vec4(1.0, 1.0, 0.0, edge);
	            }
	          `;
}

export default {
	title: 'Staging/Wireframe',
	decorators: makeDecorators(),
};

const canvasOptions = makeCanvasOptions({ camera: { position: [2, 2, 2] } });

export const Default = makeStoryFunction(DefaultWireframeStory, canvasOptions);
