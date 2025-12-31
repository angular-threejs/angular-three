import {
	ChangeDetectionStrategy,
	Component,
	computed,
	CUSTOM_ELEMENTS_SCHEMA,
	ElementRef,
	input,
	viewChild,
} from '@angular/core';
import { extend, is, NgtThreeElements, omit, pick } from 'angular-three';
import { mergeInputs } from 'ngxtension/inject-inputs';
import * as THREE from 'three';
import { Group, Mesh, PlaneGeometry, ShaderMaterial } from 'three';
import { NgtsHTMLContent } from './html-content';

export interface NgtsHTMLOptions extends Partial<NgtThreeElements['ngt-group']> {
	/**
	 * Controls how HTML is hidden when behind other objects.
	 * - `false` - No occlusion (default)
	 * - `true` - Raycast against entire scene
	 * - `'raycast'` - Same as `true`
	 * - `'blending'` - Uses z-index blending (canvas becomes transparent)
	 * - `Object3D[]` or `ElementRef<Object3D>[]` - Raycast against specific objects only
	 */
	occlude: ElementRef<THREE.Object3D>[] | THREE.Object3D[] | boolean | 'raycast' | 'blending';
	/**
	 * When `true`, uses CSS 3D transforms to position HTML in 3D space.
	 * When `false`, projects 3D position to 2D screen coordinates.
	 *
	 * Transform mode enables proper 3D rotation/scaling but may have
	 * performance implications with many elements.
	 *
	 * @default false
	 */
	transform: boolean;
	/**
	 * Forward shadow casting to occlusion mesh.
	 * Only used with blending occlusion mode.
	 *
	 * @default false
	 */
	castShadow: boolean;
	/**
	 * Forward shadow receiving to occlusion mesh.
	 * Only used with blending occlusion mode.
	 *
	 * @default false
	 */
	receiveShadow: boolean;
}

const defaultHtmlOptions: NgtsHTMLOptions = {
	occlude: false,
	transform: false,
	castShadow: false,
	receiveShadow: false,
};

/**
 * Creates a THREE.Group anchor point in the 3D scene for HTML overlay positioning.
 *
 * This component renders a THREE.Group that serves as the spatial reference
 * for `NgtsHTMLContent`. It can be placed standalone in the scene or
 * as a child of any THREE.Object3D (mesh, group, etc.).
 *
 * Must contain a `div[htmlContent]` child to render actual HTML content.
 * The Group's world position is used to calculate screen-space coordinates.
 *
 * @example
 * ```html
 * <!-- Attached to a mesh -->
 * <ngt-mesh [position]="[0, 2, 0]">
 *   <ngts-html [options]="{ transform: true }">
 *     <div [htmlContent]="{ distanceFactor: 10 }">Label</div>
 *   </ngts-html>
 * </ngt-mesh>
 *
 * <!-- Standalone in scene -->
 * <ngts-html [options]="{ position: [5, 5, 0] }">
 *   <div [htmlContent]="{}">Floating UI</div>
 * </ngts-html>
 * ```
 */
@Component({
	selector: 'ngts-html',
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
export class NgtsHTMLImpl {
	options = input(defaultHtmlOptions, { transform: mergeInputs(defaultHtmlOptions) });
	protected parameters = omit(this.options, ['occlude', 'castShadow', 'receiveShadow', 'transform']);

	groupRef = viewChild.required<ElementRef<THREE.Group>>('group');
	occlusionMeshRef = viewChild<ElementRef<THREE.Mesh>>('occlusionMesh');
	occlusionGeometryRef = viewChild<ElementRef<THREE.PlaneGeometry>>('occlusionGeometry');

	protected castShadow = pick(this.options, 'castShadow');
	protected receiveShadow = pick(this.options, 'receiveShadow');
	occlude = pick(this.options, 'occlude');
	transform = pick(this.options, 'transform');

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

	protected vertexShader = pick(this.shaders, 'vertexShader');
	protected fragmentShader = pick(this.shaders, 'fragmentShader');

	constructor() {
		extend({ Group, Mesh, PlaneGeometry, ShaderMaterial });
	}

	protected readonly DoubleSide = THREE.DoubleSide;
}

export const NgtsHTML = [NgtsHTMLImpl, NgtsHTMLContent] as const;
