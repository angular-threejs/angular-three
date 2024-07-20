import {
	ChangeDetectionStrategy,
	Component,
	computed,
	CUSTOM_ELEMENTS_SCHEMA,
	ElementRef,
	input,
	viewChild,
} from '@angular/core';
import { extend, is, NgtGroup, omit, pick } from 'angular-three';
import { mergeInputs } from 'ngxtension/inject-inputs';
import { DoubleSide, Group, Mesh, Object3D, PlaneGeometry, ShaderMaterial } from 'three';

export interface NgtsHTMLOptions extends Partial<NgtGroup> {
	occlude: ElementRef<Object3D>[] | Object3D[] | boolean | 'raycast' | 'blending';
	transform: boolean;
	castShadow: boolean;
	receiveShadow: boolean;
}

const defaultHtmlOptions: NgtsHTMLOptions = {
	occlude: false,
	transform: false,
	castShadow: false,
	receiveShadow: false,
};

@Component({
	selector: 'ngts-html',
	standalone: true,
	template: `
		<ngt-group #group [parameters]="parameters()">
			@if (occlude() && !isRaycastOcclusion()) {
				<ngt-mesh #occlusionMesh [castShadow]="castShadow()" [receiveShadow]="receiveShadow()">
					<ng-content select="[data-occlusion-geometry]">
						<ngt-plane-geometry #occlusionGeometry />
					</ng-content>
					<ng-content select="[data-occlusion-material]">
						<ngt-shader-material
							[side]="DoubleSide"
							[vertexShader]="vertexShader()"
							[fragmentShader]="fragmentShader()"
						/>
					</ng-content>
				</ngt-mesh>
			}
		</ngt-group>

		<ng-content />
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgtsHTML {
	options = input(defaultHtmlOptions, { transform: mergeInputs(defaultHtmlOptions) });
	parameters = omit(this.options, ['occlude', 'castShadow', 'receiveShadow', 'transform']);

	groupRef = viewChild.required<ElementRef<Group>>('group');
	occlusionMeshRef = viewChild<ElementRef<Mesh>>('occlusionMesh');
	occlusionGeometryRef = viewChild<ElementRef<PlaneGeometry>>('occlusionGeometry');

	occlude = pick(this.options, 'occlude');
	transform = pick(this.options, 'transform');
	castShadow = pick(this.options, 'castShadow');
	receiveShadow = pick(this.options, 'receiveShadow');
	scale = pick(this.options, 'scale');

	isRaycastOcclusion = computed(() => {
		const occlude = this.occlude();
		return (occlude && occlude !== 'blending') || (Array.isArray(occlude) && occlude.length && is.ref(occlude[0]));
	});

	private shaders = computed(() => {
		const transform = this.transform();
		const vertexShader = !transform
			? /* language=glsl glsl */ `
          /*
            This shader is from the THREE's SpriteMaterial.
            We need to turn the backing plane into a Sprite
            (make it always face the camera) if "transfrom"
            is false.
          */
          #include <common>

          void main() {
            vec2 center = vec2(0., 1.);
            float rotation = 0.0;

            // This is somewhat arbitrary, but it seems to work well
            // Need to figure out how to derive this dynamically if it even matters
            float size = 0.03;

            vec4 mvPosition = modelViewMatrix * vec4( 0.0, 0.0, 0.0, 1.0 );
            vec2 scale;
            scale.x = length( vec3( modelMatrix[ 0 ].x, modelMatrix[ 0 ].y, modelMatrix[ 0 ].z ) );
            scale.y = length( vec3( modelMatrix[ 1 ].x, modelMatrix[ 1 ].y, modelMatrix[ 1 ].z ) );

            bool isPerspective = isPerspectiveMatrix( projectionMatrix );
            if ( isPerspective ) scale *= - mvPosition.z;

            vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale * size;
            vec2 rotatedPosition;
            rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
            rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
            mvPosition.xy += rotatedPosition;

            gl_Position = projectionMatrix * mvPosition;
          }
      `
			: undefined;

		const fragmentShader = /* language=glsl glsl */ `
      void main() {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
      }
    `;

		return { vertexShader, fragmentShader };
	});

	vertexShader = pick(this.shaders, 'vertexShader');
	fragmentShader = pick(this.shaders, 'fragmentShader');

	constructor() {
		extend({ Group, Mesh, PlaneGeometry, ShaderMaterial });
	}

	protected readonly DoubleSide = DoubleSide;
}
