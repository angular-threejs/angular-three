import {
	ChangeDetectionStrategy,
	Component,
	computed,
	CUSTOM_ELEMENTS_SCHEMA,
	effect,
	ElementRef,
	inject,
	Injector,
	input,
	viewChild,
} from '@angular/core';
import { beforeRender, extend, injectStore, is, NgtArgs, NgtThreeElements, omit, pick } from 'angular-three';
import { NgtsHelper } from 'angular-three-soba/abstractions';
import { SpotLightMaterial } from 'angular-three-soba/vanilla-exports';
import { assertInjector } from 'ngxtension/assert-injector';
import { mergeInputs } from 'ngxtension/inject-inputs';
import * as THREE from 'three';
import { Group, Mesh, MeshBasicMaterial, PlaneGeometry, RepeatWrapping, SpotLight } from 'three';
import { FullScreenQuad } from 'three-stdlib';

/**
 * Configuration options for the NgtsSpotLight component.
 * Extends the base spot light element options from Three.js.
 */
export interface NgtsSpotLightOptions extends Partial<NgtThreeElements['ngt-spot-light']> {
	/**
	 * Depth texture for soft volumetric lighting. Set to null to disable.
	 * @default null
	 */
	depthBuffer: THREE.DepthTexture | null;
	/**
	 * Light attenuation factor. Controls how quickly light fades.
	 * @default 5
	 */
	attenuation?: number;
	/**
	 * Power of the light cone angle falloff.
	 * @default 5
	 */
	anglePower?: number;
	/**
	 * Radius of the light cone at the top (near the light source).
	 * @default 0.1
	 */
	radiusTop?: number;
	/**
	 * Radius of the light cone at the bottom (far from the light source).
	 * @default angle * 7
	 */
	radiusBottom?: number;
	/**
	 * Opacity of the volumetric light cone.
	 * @default 1
	 */
	opacity?: number;
	/**
	 * Color of the light.
	 * @default 'white'
	 */
	color?: THREE.ColorRepresentation;
	/**
	 * Whether to render the volumetric light cone mesh.
	 * @default true
	 */
	volumetric?: boolean;
	/**
	 * Whether to show the SpotLightHelper for debugging.
	 * @default false
	 */
	debug?: boolean;
}

/**
 * Configuration options for the volumetric mesh component.
 * Same as NgtsSpotLightOptions but without the volumetric toggle.
 */
export type NgtsVolumetricMeshOptions = Omit<NgtsSpotLightOptions, 'volumetric'>;

const defaultVolumetricMeshOptions: NgtsVolumetricMeshOptions = {
	opacity: 1,
	distance: 5,
	angle: 0.15,
	attenuation: 5,
	anglePower: 5,
	color: 'white',
	depthBuffer: null,
};

/**
 * Renders the volumetric light cone mesh for the spot light effect.
 * Creates a cylinder geometry that visualizes the light beam with proper attenuation.
 *
 * @internal Used internally by NgtsSpotLight
 */
@Component({
	selector: 'ngts-volumetric-mesh',
	template: `
		<ngt-mesh #mesh [geometry]="geometry()" [raycast]="null">
			<ngt-primitive
				*args="[material]"
				attach="material"
				[uniforms.opacity.value]="opacity()"
				[uniforms.lightColor.value]="color()"
				[uniforms.attenuation.value]="attenuation()"
				[uniforms.anglePower.value]="anglePower()"
				[uniforms.depth.value]="depthBuffer()"
				[uniforms.cameraNear.value]="camera.near()"
				[uniforms.cameraFar.value]="camera.far()"
				[uniforms.resolution.value]="depthBuffer() ? [size.width() * dpr(), size.height() * dpr()] : [0, 0]"
			/>
		</ngt-mesh>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtArgs],
})
export class NgtsVolumetricMesh {
	/** Configuration options for the volumetric mesh. */
	options = input(defaultVolumetricMeshOptions, { transform: mergeInputs(defaultVolumetricMeshOptions) });

	/** Reference to the underlying mesh element. */
	meshRef = viewChild.required<ElementRef<THREE.Mesh>>('mesh');

	private store = injectStore();
	protected size = this.store.size;
	protected dpr = this.store.viewport.dpr;
	protected camera = this.store.camera;

	private radiusTop = pick(this.options, 'radiusTop');
	private radiusBottom = pick(this.options, 'radiusBottom');
	private angle = pick(this.options, 'angle');
	private distance = pick(this.options, 'distance');

	private normalizedRadiusTop = computed(() => (this.radiusTop() === undefined ? 0.1 : this.radiusTop()));
	private normalizedRadiusBottom = computed(() =>
		this.radiusBottom() === undefined ? this.angle()! * 7 : this.radiusBottom(),
	);

	protected material = new SpotLightMaterial();
	protected opacity = pick(this.options, 'opacity');
	protected color = pick(this.options, 'color');
	protected attenuation = pick(this.options, 'attenuation');
	protected anglePower = pick(this.options, 'anglePower');
	protected depthBuffer = pick(this.options, 'depthBuffer');

	protected geometry = computed(() => {
		const geometry = new THREE.CylinderGeometry(
			this.normalizedRadiusTop(),
			this.normalizedRadiusBottom(),
			this.distance(),
			128,
			64,
			true,
		);
		geometry.applyMatrix4(new THREE.Matrix4().makeTranslation(0, -this.distance()! / 2, 0));
		geometry.applyMatrix4(new THREE.Matrix4().makeRotationX(-Math.PI / 2));
		return geometry;
	});

	constructor() {
		extend({ Mesh });

		const vec = new THREE.Vector3();

		beforeRender(() => {
			const mesh = this.meshRef().nativeElement;
			const material = this.material;

			material.uniforms['spotPosition'].value.copy(mesh.getWorldPosition(vec));
			if (mesh.parent) {
				mesh.lookAt((mesh.parent as any).target.getWorldPosition(vec));
			}
		});
	}
}

/**
 * Shared logic for spot light shadow components.
 * Handles shadow map sizing and mesh positioning to follow the spot light target.
 *
 * @param spotLight - Reference to the parent spot light element
 * @param mesh - Reference to the shadow mesh element
 * @param width - Shadow map width
 * @param height - Shadow map height
 * @param distance - Distance factor for shadow placement
 * @param injector - Optional injector for dependency injection
 *
 * @internal
 */
function spotLightCommon(
	spotLight: () => ElementRef<THREE.SpotLight> | null,
	mesh: () => ElementRef<Mesh> | null,
	width: () => number,
	height: () => number,
	distance: () => number,
	injector?: Injector,
) {
	assertInjector(spotLightCommon, injector, () => {
		const pos = new THREE.Vector3();
		const dir = new THREE.Vector3();

		effect(() => {
			const [_spotLight, _width, _height] = [spotLight()?.nativeElement, width(), height()];
			if (!_spotLight) return;
			if (is.three<THREE.SpotLight>(_spotLight, 'isSpotLight')) {
				_spotLight.shadow.mapSize.set(_width, _height);
				if (_spotLight.shadow.map) {
					_spotLight.shadow.map.setSize(_width, _height);
				}
				_spotLight.shadow.needsUpdate = true;
			} else {
				throw new Error('NgtsSpotLightShadow must be a child of a NgtsSpotLight');
			}
		});

		beforeRender(() => {
			const [_spotLight, _mesh] = [spotLight()?.nativeElement, mesh()?.nativeElement];
			if (!_spotLight || !_mesh) return;

			const A = _spotLight.position;
			const B = _spotLight.target.position;

			dir.copy(B).sub(A);
			const len = dir.length();
			dir.normalize().multiplyScalar(len * distance());
			pos.copy(A).add(dir);

			_mesh.position.copy(pos);
			_mesh.lookAt(_spotLight.target.position);
		});
	});
}

/**
 * Configuration options for shadow mesh components.
 *
 * @internal
 */
interface NgtsShadowMeshOptions {
	/**
	 * Distance factor for shadow placement along the light direction.
	 * @default 0.4
	 */
	distance: number;
	/**
	 * Alpha test threshold for shadow transparency.
	 * @default 0.5
	 */
	alphaTest: number;
	/**
	 * Scale of the shadow mesh.
	 * @default 1
	 */
	scale: number;
	/**
	 * Width of the shadow map in pixels.
	 * @default 512
	 */
	width: number;
	/**
	 * Height of the shadow map in pixels.
	 * @default 512
	 */
	height: number;
	/**
	 * Texture to use as the shadow alpha map.
	 */
	map?: THREE.Texture;
}

const defaultSpotLightShadowOptions: NgtsShadowMeshOptions = {
	distance: 0.4,
	alphaTest: 0.5,
	scale: 1,
	width: 512,
	height: 512,
};

/**
 * Shadow component that uses a custom shader to generate procedural shadow patterns.
 * Renders the shader output to a texture used as an alpha map for the shadow mesh.
 *
 * @internal Used internally by NgtsSpotLightShadow
 */
@Component({
	selector: 'ngts-spot-light-shadow-shader',
	template: `
		<ngt-mesh #mesh [scale]="scale()" castShadow>
			<ngt-plane-geometry />
			<ngt-mesh-basic-material
				transparent
				[side]="DoubleSide"
				[alphaTest]="alphaTest()"
				[alphaMap]="texture()"
				[opacity]="debug() ? 1 : 0"
			>
				<ng-content />
			</ngt-mesh-basic-material>
		</ngt-mesh>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgtsSpotLightShadowShader {
	protected readonly DoubleSide = THREE.DoubleSide;

	/** GLSL shader code for generating the shadow pattern. */
	shader = input.required<string>();
	/** Configuration options for the shadow mesh. */
	options = input(defaultSpotLightShadowOptions, { transform: mergeInputs(defaultSpotLightShadowOptions) });

	/** Reference to the shadow mesh element. */
	meshRef = viewChild.required<ElementRef<Mesh>>('mesh');

	private spotLight = inject(NgtsSpotLight);
	protected debug = this.spotLight.debug;

	protected scale = pick(this.options, 'scale');
	protected alphaTest = pick(this.options, 'alphaTest');

	private width = pick(this.options, 'width');
	private height = pick(this.options, 'height');
	private map = pick(this.options, 'map');
	private distance = pick(this.options, 'distance');

	private renderTarget = computed(() => {
		return new THREE.WebGLRenderTarget(this.width(), this.height(), {
			format: THREE.RGBAFormat,
			stencilBuffer: false,
			// depthTexture: null!
		});
	});

	protected texture = computed(() => {
		const renderTarget = this.renderTarget();
		renderTarget.texture.wrapT = renderTarget.texture.wrapS = THREE.RepeatWrapping;
		return renderTarget.texture;
	});

	private fsQuad = computed(() => {
		return new FullScreenQuad(
			new THREE.ShaderMaterial({
				uniforms: this.uniforms,
				vertexShader: /* language=glsl glsl */ `
          varying vec2 vUv;

          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
				fragmentShader: this.shader(),
			}),
		);
	});

	private uniforms = {
		uShadowMap: { value: undefined as THREE.Texture | undefined },
		uTime: { value: 0 },
	};

	constructor() {
		extend({ Mesh, PlaneGeometry, MeshBasicMaterial });

		spotLightCommon(this.spotLight.spotLightRef, this.meshRef, this.width, this.height, this.distance);

		effect(() => {
			this.uniforms.uShadowMap.value = this.map();
		});

		effect((onCleanup) => {
			const fsQuad = this.fsQuad();
			onCleanup(() => {
				fsQuad.material.dispose();
				fsQuad.dispose();
			});
		});

		effect((onCleanup) => {
			const renderTarget = this.renderTarget();
			onCleanup(() => {
				renderTarget.dispose();
			});
		});

		beforeRender(({ gl, delta }) => {
			this.uniforms.uTime.value += delta;

			gl.setRenderTarget(this.renderTarget());
			this.fsQuad().render(gl);
			gl.setRenderTarget(null);
		});
	}
}

/**
 * Shadow component that uses a provided texture directly as the alpha map.
 * Simpler alternative to the shader-based shadow when custom patterns aren't needed.
 *
 * @internal Used internally by NgtsSpotLightShadow
 */
@Component({
	selector: 'ngts-spot-light-shadow-no-shader',
	template: `
		<ngt-mesh #mesh [scale]="scale()" castShadow>
			<ngt-plane-geometry />
			<ngt-mesh-basic-material
				transparent
				[side]="DoubleSide"
				[alphaTest]="alphaTest()"
				[alphaMap]="map()"
				[opacity]="debug() ? 1 : 0"
			>
				<ng-content />
			</ngt-mesh-basic-material>
		</ngt-mesh>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgtsSpotLightShadowNoShader {
	protected readonly DoubleSide = THREE.DoubleSide;

	/** Configuration options for the shadow mesh. */
	options = input(defaultSpotLightShadowOptions, { transform: mergeInputs(defaultSpotLightShadowOptions) });

	/** Reference to the shadow mesh element. */
	meshRef = viewChild.required<ElementRef<THREE.Mesh>>('mesh');

	private spotLight = inject(NgtsSpotLight);
	protected debug = this.spotLight.debug;

	protected alphaTest = pick(this.options, 'alphaTest');
	protected scale = pick(this.options, 'scale');
	protected map = computed(() => {
		const map = this.options().map;
		if (map) {
			map.wrapS = map.wrapT = RepeatWrapping;
		}
		return map;
	});

	private width = pick(this.options, 'width');
	private height = pick(this.options, 'height');
	private distance = pick(this.options, 'distance');

	constructor() {
		extend({ Mesh, PlaneGeometry, MeshBasicMaterial });

		spotLightCommon(this.spotLight.spotLightRef, this.meshRef, this.width, this.height, this.distance);
	}
}

/**
 * Casts shaped shadows from a spot light using a projected texture or shader.
 * Must be used as a child of NgtsSpotLight.
 *
 * @example
 * ```html
 * <ngts-spot-light>
 *   <ngts-spot-light-shadow [options]="{ map: shadowTexture, scale: 4 }" />
 * </ngts-spot-light>
 * ```
 */
@Component({
	selector: 'ngts-spot-light-shadow',
	template: `
		@if (shader(); as shader) {
			<ngts-spot-light-shadow-shader [shader]="shader" [options]="options()" />
		} @else {
			<ngts-spot-light-shadow-no-shader [options]="options()" />
		}
	`,
	imports: [NgtsSpotLightShadowShader, NgtsSpotLightShadowNoShader],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgtsSpotLightShadow {
	/** Optional GLSL shader code for custom shadow patterns. If not provided, uses texture-based shadows. */
	shader = input<string>();
	/** Configuration options for the shadow. */
	options = input(defaultSpotLightShadowOptions, { transform: mergeInputs(defaultSpotLightShadowOptions) });
}

const defaultOptions: NgtsSpotLightOptions = {
	opacity: 1,
	color: 'white',
	distance: 5,
	angle: 0.15,
	attenuation: 5,
	anglePower: 5,
	volumetric: true,
	debug: false,
	depthBuffer: null,
};

/**
 * Enhanced spot light with optional volumetric lighting effect.
 * Creates a visible light cone that simulates light scattering through atmosphere or dust.
 *
 * @example
 * ```html
 * <ngts-spot-light
 *   [options]="{
 *     position: [0, 5, 0],
 *     angle: 0.5,
 *     intensity: 1,
 *     color: 'white',
 *     volumetric: true
 *   }"
 * />
 * ```
 */
@Component({
	selector: 'ngts-spot-light',
	template: `
		<ngt-group>
			<ngt-spot-light
				#spotLight
				[angle]="angle()"
				[color]="color()"
				[distance]="distance()"
				castShadow
				[parameters]="parameters()"
			>
				@if (volumetric()) {
					<ngts-volumetric-mesh [options]="volumetricOptions()" />
				}

				@if (debug()) {
					<ngts-helper [type]="SpotLightHelper" />
				}
			</ngt-spot-light>
			<ng-content />
		</ngt-group>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtsVolumetricMesh, NgtsHelper],
})
export class NgtsSpotLight {
	protected readonly SpotLightHelper = THREE.SpotLightHelper;

	/** Configuration options for the spot light. */
	options = input(defaultOptions, { transform: mergeInputs(defaultOptions) });
	protected parameters = omit(this.options, [
		'opacity',
		'radiusTop',
		'radiusBottom',
		'depthBuffer',
		'color',
		'distance',
		'angle',
		'attenuation',
		'anglePower',
		'volumetric',
		'debug',
	]);
	protected volumetricOptions = pick(this.options, [
		'opacity',
		'radiusTop',
		'radiusBottom',
		'depthBuffer',
		'color',
		'distance',
		'angle',
		'attenuation',
		'anglePower',
		'debug',
	]);

	/** Reference to the underlying spot light element. */
	spotLightRef = viewChild.required<ElementRef<THREE.SpotLight>>('spotLight');

	/** Whether debug mode is enabled (shows SpotLightHelper). */
	debug = pick(this.options, 'debug');
	protected angle = pick(this.options, 'angle');
	protected color = pick(this.options, 'color');
	protected distance = pick(this.options, 'distance');
	protected volumetric = pick(this.options, 'volumetric');

	constructor() {
		extend({ Group, SpotLight });
	}
}
