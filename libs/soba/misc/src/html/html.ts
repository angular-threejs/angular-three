import { NgIf } from '@angular/common';
import {
	CUSTOM_ELEMENTS_SCHEMA,
	Component,
	ContentChild,
	EventEmitter,
	Input,
	Output,
	TemplateRef,
	computed,
	forwardRef,
} from '@angular/core';
import {
	createInjectionToken,
	extend,
	injectNgtRef,
	is,
	signalStore,
	type NgtGroup,
	type NgtRef,
	type NgtVector3,
} from 'angular-three';
import { NgtsSobaContent } from 'angular-three-soba/utils';
import * as THREE from 'three';
import { Group, Mesh, PlaneGeometry, ShaderMaterial } from 'three';
import { NgtsHtmlWrapper, defaultCalculatePosition } from './html-wrapper';

extend({ Group, PlaneGeometry, Mesh, ShaderMaterial });

type PointerEventsProperties =
	| 'auto'
	| 'none'
	| 'visiblePainted'
	| 'visibleFill'
	| 'visibleStroke'
	| 'visible'
	| 'painted'
	| 'fill'
	| 'stroke'
	| 'all'
	| 'inherit';

export type NgtsHtmlState = {
	as: keyof HTMLElementTagNameMap;
	prepend: boolean;
	transform: boolean;
	zIndexRange: Array<number>;
	calculatePosition: typeof defaultCalculatePosition;
	fullscreen: boolean;
	center: boolean;
	sprite: boolean;
	pointerEvents: PointerEventsProperties;
	eps: number;
	scale: NgtVector3;
	content?: TemplateRef<unknown>;
	distanceFactor?: number;
	style?: CSSStyleDeclaration;
	renderedDivClass?: string;
	wrapperClass?: string;
	portal?: NgtRef<HTMLElement>;
	occlude: NgtRef<THREE.Object3D>[] | boolean | 'raycast' | 'blending';
	material?: NgtRef<THREE.Material>;
	geometry?: NgtRef<THREE.BufferGeometry>;
	castShadow: boolean; // Cast shadow for occlusion plane
	receiveShadow: boolean; // Receive shadow for occlusion plane
};

export const [injectNgtsHtmlInputs, provideNgtsHtmlInputs] = createInjectionToken(
	(html: NgtsHtml) => ({ state: html.inputs.state, ...html.state }),
	{ isRoot: false, deps: [forwardRef(() => NgtsHtml)] },
);

declare global {
	interface HTMLElementTagNameMap {
		/**
		 * @extends ngt-group
		 */
		'ngts-html': NgtsHtmlState & NgtGroup;
	}
}

@Component({
	selector: 'ngts-html',
	standalone: true,
	template: `
		<ngt-group ngtCompound [ref]="groupRef" [scale]="scale()">
			<ngt-mesh
				*ngIf="occlude() && !isRayCastOcclusion()"
				[castShadow]="castShadow()"
				[receiveShadow]="receiveShadow()"
				[ref]="occlusionMeshRef"
			>
				<ngt-plane-geometry *ngIf="geometry()" />
				<ngt-shader-material
					*ngIf="material()"
					[side]="DoubleSide"
					[vertexShader]="shaders().vertexShader"
					[fragmentShader]="shaders().fragmentShader"
				/>
			</ngt-mesh>
		</ngt-group>

		<ngts-html-wrapper />
	`,
	imports: [NgIf, NgtsHtmlWrapper],
	providers: [provideNgtsHtmlInputs()],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsHtml {
	DoubleSide = THREE.DoubleSide;

	inputs = signalStore<NgtsHtmlState>({
		as: 'div',
		prepend: false,
		transform: false,
		fullscreen: false,
		center: false,
		sprite: false,
		zIndexRange: [16777271, 0],
		eps: 0.001,
		scale: 1,
		calculatePosition: defaultCalculatePosition,
		pointerEvents: 'auto',
		occlude: false,
		castShadow: false,
		receiveShadow: false,
	});

	@ContentChild(NgtsSobaContent, { read: TemplateRef }) set content(content: TemplateRef<unknown>) {
		this.inputs.set({ content });
	}

	@Input() groupRef = injectNgtRef<Group>();

	@Input({ alias: 'as' }) set _as(as: keyof HTMLElementTagNameMap) {
		this.inputs.set({ as });
	}

	@Input({ alias: 'zIndexRange' }) set _zIndexRange(zIndexRange: Array<number>) {
		this.inputs.set({ zIndexRange });
	}

	@Input({ alias: 'portal' }) set _portal(portal: NgtRef<HTMLElement>) {
		this.inputs.set({ portal });
	}

	@Input({ alias: 'occlude' }) set _occlude(occlude: NgtsHtmlState['occlude']) {
		this.inputs.set({ occlude });
	}

	@Input({ alias: 'castShadow' }) set _castShadow(castShadow: NgtsHtmlState['castShadow']) {
		this.inputs.set({ castShadow });
	}

	@Input({ alias: 'receiveShadow' }) set _receiveShadow(receiveShadow: NgtsHtmlState['receiveShadow']) {
		this.inputs.set({ receiveShadow });
	}

	@Input({ alias: 'material' }) set _material(material: NgtsHtmlState['material']) {
		this.inputs.set({ material });
	}

	@Input({ alias: 'geometry' }) set _geometry(geometry: NgtsHtmlState['geometry']) {
		this.inputs.set({ geometry });
	}

	@Input({ alias: 'scale' }) set _scale(scale: NgtsHtmlState['scale']) {
		this.inputs.set({ scale });
	}

	@Input({ alias: 'prepend' }) set _prepend(prepend: boolean) {
		this.inputs.set({ prepend });
	}

	@Input({ alias: 'transform' }) set _transform(transform: boolean) {
		this.inputs.set({ transform });
	}

	@Input({ alias: 'center' }) set _center(center: boolean) {
		this.inputs.set({ center });
	}

	@Input({ alias: 'sprite' }) set _sprite(sprite: boolean) {
		this.inputs.set({ sprite });
	}

	@Input({ alias: 'fullscreen' }) set _fullscreen(fullscreen: boolean) {
		this.inputs.set({ fullscreen });
	}

	@Input({ alias: 'eps' }) set _eps(eps: number) {
		this.inputs.set({ eps });
	}

	@Input({ alias: 'distanceFactor' }) set _distanceFactor(distanceFactor: number) {
		this.inputs.set({ distanceFactor });
	}

	@Input({ alias: 'wrapperClass' }) set _wrapperClass(wrapperClass: string) {
		this.inputs.set({ wrapperClass });
	}

	@Input({ alias: 'renderedDivClass' }) set _renderedDivClass(renderedDivClass: string) {
		this.inputs.set({ renderedDivClass });
	}

	@Input({ alias: 'style' }) set _style(style: CSSStyleDeclaration) {
		this.inputs.set({ style });
	}

	@Input({ alias: 'pointerEvents' }) set _pointerEvents(pointerEvents: PointerEventsProperties) {
		this.inputs.set({ pointerEvents });
	}

	@Input({ alias: 'calculatePosition' }) set _calculatePosition(
		calculatePosition: NgtsHtmlState['calculatePosition'],
	) {
		this.inputs.set({ calculatePosition });
	}

	@Output() occluded = new EventEmitter<boolean>();

	occlusionMeshRef = injectNgtRef<Mesh>();

	private transform = this.inputs.select('transform');

	isRayCastOcclusion = computed(() => {
		const occlude = this.occlude();
		return (
			(occlude && occlude !== 'blending') || (Array.isArray(occlude) && !!occlude.length && is.ref(occlude[0]))
		);
	});

	occlude = this.inputs.select('occlude');
	castShadow = this.inputs.select('castShadow');
	receiveShadow = this.inputs.select('receiveShadow');
	geometry = this.inputs.select('geometry');
	material = this.inputs.select('material');
	scale = this.inputs.select('scale');

	shaders = computed(() => {
		const transform = this.transform();
		return {
			vertexShader: !transform
				? /* glsl */ `
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
				: undefined,
			fragmentShader: /* glsl */ `
        void main() {
          gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
        }
      `,
		};
	});

	state = {
		zIndexRange: this.inputs.select('zIndexRange'),
		prepend: this.inputs.select('prepend'),
		transform: this.transform,
		center: this.inputs.select('center'),
		fullscreen: this.inputs.select('fullscreen'),
		calculatePosition: this.inputs.select('calculatePosition'),
		wrapperClass: this.inputs.select('wrapperClass'),
		renderedDivClass: this.inputs.select('renderedDivClass'),
		style: this.inputs.select('style'),
		pointerEvents: this.inputs.select('pointerEvents'),
		eps: this.inputs.select('eps'),
		distanceFactor: this.inputs.select('distanceFactor'),
		sprite: this.inputs.select('sprite'),
		as: this.inputs.select('as'),
		portal: this.inputs.select('portal'),
		content: this.inputs.select('content'),
		occlude: this.occlude,
		isRayCastOcclusion: this.isRayCastOcclusion,
		occlusionMeshRef: this.occlusionMeshRef,
		occluded: this.occluded,
		geometry: this.geometry,
		scale: this.scale,
		groupRef: this.groupRef,
	};
}
