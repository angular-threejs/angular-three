import {
	afterNextRender,
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
import { extend, injectBeforeRender, injectStore, NgtArgs, NgtSpotLight, omit, pick } from 'angular-three';
import { NgtsHelper } from 'angular-three-soba/abstractions';
import { SpotLightMaterial } from 'angular-three-soba/vanilla-exports';
import { assertInjector } from 'ngxtension/assert-injector';
import { injectAutoEffect } from 'ngxtension/auto-effect';
import { mergeInputs } from 'ngxtension/inject-inputs';
import {
	ColorRepresentation,
	CylinderGeometry,
	DepthTexture,
	DoubleSide,
	Group,
	Matrix4,
	Mesh,
	MeshBasicMaterial,
	Object3D,
	PlaneGeometry,
	RepeatWrapping,
	RGBAFormat,
	ShaderMaterial,
	SpotLight,
	SpotLightHelper,
	Texture,
	Vector3,
	WebGLRenderTarget,
} from 'three';
import { FullScreenQuad } from 'three-stdlib';

function isSpotLight(child: Object3D | null): child is SpotLight {
	return (child as SpotLight)?.isSpotLight;
}

export interface NgtsSpotLightOptions extends Partial<NgtSpotLight> {
	depthBuffer?: DepthTexture;
	attenuation?: number;
	anglePower?: number;
	radiusTop?: number;
	radiusBottom?: number;
	opacity?: number;
	color?: ColorRepresentation;
	volumetric?: boolean;
	debug?: boolean;
}

export type NgtsVolumetricMeshOptions = Omit<NgtsSpotLightOptions, 'volumetric'>;

const defaultVolumetricMeshOptions: NgtsVolumetricMeshOptions = {
	opacity: 1,
	distance: 5,
	angle: 0.15,
	attenuation: 5,
	anglePower: 5,
	color: 'white',
};

@Component({
	selector: 'ngts-volumetric-mesh',
	standalone: true,
	template: `
		<ngt-mesh #mesh [geometry]="geometry()" [raycast]="null">
			<ngt-primitive *args="[material]" attach="material">
				<ngt-value attach="uniforms.opacity.value" [rawValue]="opacity()" />
				<ngt-value attach="uniforms.lightColor.value" [rawValue]="color()" />
				<ngt-value attach="uniforms.attenuation.value" [rawValue]="attenuation()" />
				<ngt-value attach="uniforms.anglePower.value" [rawValue]="anglePower()" />
				<ngt-value attach="uniforms.depth.value" [rawValue]="depthBuffer()" />
				<ngt-value attach="uniforms.cameraNear.value" [rawValue]="camera().near" />
				<ngt-value attach="uniforms.cameraFar.value" [rawValue]="camera().far" />
				<ngt-value
					attach="uniforms.resolution.value"
					[rawValue]="depthBuffer() ? [size().width * dpr(), size().height * dpr()] : [0, 0]"
				/>
			</ngt-primitive>
		</ngt-mesh>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtArgs],
})
export class NgtsVolumetricMesh {
	options = input(defaultVolumetricMeshOptions, { transform: mergeInputs(defaultVolumetricMeshOptions) });

	meshRef = viewChild.required<ElementRef<Mesh>>('mesh');

	private store = injectStore();
	size = this.store.select('size');
	dpr = this.store.select('viewport', 'dpr');
	camera = this.store.select('camera');

	private radiusTop = pick(this.options, 'radiusTop');
	private radiusBottom = pick(this.options, 'radiusBottom');
	private angle = pick(this.options, 'angle');
	private distance = pick(this.options, 'distance');

	private normalizedRadiusTop = computed(() => (this.radiusTop() === undefined ? 0.1 : this.radiusTop()));
	private normalizedRadiusBottom = computed(() =>
		this.radiusBottom() === undefined ? this.angle()! * 7 : this.radiusBottom(),
	);

	material = new SpotLightMaterial();
	opacity = pick(this.options, 'opacity');
	color = pick(this.options, 'color');
	attenuation = pick(this.options, 'attenuation');
	anglePower = pick(this.options, 'anglePower');
	depthBuffer = pick(this.options, 'depthBuffer');

	geometry = computed(() => {
		const geometry = new CylinderGeometry(
			this.normalizedRadiusTop(),
			this.normalizedRadiusBottom(),
			this.distance(),
			128,
			64,
			true,
		);
		geometry.applyMatrix4(new Matrix4().makeTranslation(0, -this.distance()! / 2, 0));
		geometry.applyMatrix4(new Matrix4().makeRotationX(-Math.PI / 2));
		return geometry;
	});

	constructor() {
		extend({ Mesh });

		const vec = new Vector3();

		injectBeforeRender(() => {
			const mesh = this.meshRef().nativeElement;
			const material = this.material;

			material.uniforms['spotPosition'].value.copy(mesh.getWorldPosition(vec));
			if (mesh.parent) {
				mesh.lookAt((mesh.parent as any).target.getWorldPosition(vec));
			}
		});
	}
}

function injectSpotLightCommon(
	spotLight: () => ElementRef<SpotLight> | null,
	mesh: () => ElementRef<Mesh> | null,
	width: () => number,
	height: () => number,
	distance: () => number,
	injector?: Injector,
) {
	assertInjector(injectSpotLightCommon, injector, () => {
		const pos = new Vector3();
		const dir = new Vector3();

		effect(() => {
			const [_spotLight, _width, _height] = [spotLight()?.nativeElement, width(), height()];
			if (!_spotLight) return;
			if (isSpotLight(_spotLight)) {
				_spotLight.shadow.mapSize.set(_width, _height);
				if (_spotLight.shadow.map) {
					_spotLight.shadow.map.setSize(_width, _height);
				}
				_spotLight.shadow.needsUpdate = true;
			} else {
				throw new Error('NgtsSpotLightShadow must be a child of a NgtsSpotLight');
			}
		});

		injectBeforeRender(() => {
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

interface NgtsShadowMeshOptions {
	distance: number;
	alphaTest: number;
	scale: number;
	width: number;
	height: number;
	map?: Texture;
}

const defaultSpotLightShadowOptions: NgtsShadowMeshOptions = {
	distance: 0.4,
	alphaTest: 0.5,
	scale: 1,
	width: 512,
	height: 512,
};

@Component({
	selector: 'ngts-spot-light-shadow-shader',
	standalone: true,
	template: `
		<ngt-mesh #mesh [scale]="scale()" [castShadow]="true">
			<ngt-plane-geometry />
			<ngt-mesh-basic-material
				[transparent]="true"
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
	protected readonly DoubleSide = DoubleSide;

	shader = input.required<string>();
	options = input(defaultSpotLightShadowOptions, { transform: mergeInputs(defaultSpotLightShadowOptions) });

	mesh = viewChild.required<ElementRef<Mesh>>('mesh');

	private spotLight = inject(NgtsSpotLight);
	debug = this.spotLight.debug;

	scale = pick(this.options, 'scale');
	alphaTest = pick(this.options, 'alphaTest');

	private width = pick(this.options, 'width');
	private height = pick(this.options, 'height');
	private map = pick(this.options, 'map');
	private distance = pick(this.options, 'distance');

	private renderTarget = computed(() => {
		return new WebGLRenderTarget(this.width(), this.height(), {
			format: RGBAFormat,
			stencilBuffer: false,
			// depthTexture: null!
		});
	});

	texture = computed(() => {
		const renderTarget = this.renderTarget();
		renderTarget.texture.wrapT = renderTarget.texture.wrapS = RepeatWrapping;
		return renderTarget.texture;
	});

	private fsQuad = computed(() => {
		return new FullScreenQuad(
			new ShaderMaterial({
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
		uShadowMap: { value: undefined as Texture | undefined },
		uTime: { value: 0 },
	};

	constructor() {
		extend({ Mesh, PlaneGeometry, MeshBasicMaterial });

		const autoEffect = injectAutoEffect();
		const injector = inject(Injector);

		afterNextRender(() => {
			injectSpotLightCommon(this.spotLight.spotLight, this.mesh, this.width, this.height, this.distance, injector);

			autoEffect(() => {
				this.uniforms.uShadowMap.value = this.map();
			});

			autoEffect(() => {
				const fsQuad = this.fsQuad();
				return () => {
					fsQuad.material.dispose();
					fsQuad.dispose();
				};
			});

			autoEffect(() => {
				const renderTarget = this.renderTarget();
				return () => {
					renderTarget.dispose();
				};
			});
		});

		injectBeforeRender(({ gl, delta }) => {
			this.uniforms.uTime.value += delta;

			gl.setRenderTarget(this.renderTarget());
			this.fsQuad().render(gl);
			gl.setRenderTarget(null);
		});
	}
}

@Component({
	selector: 'ngts-spot-light-shadow-no-shader',
	standalone: true,
	template: `
		<ngt-mesh #mesh [scale]="scale()" [castShadow]="true">
			<ngt-plane-geometry />
			<ngt-mesh-basic-material
				[transparent]="true"
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
	protected readonly DoubleSide = DoubleSide;

	options = input(defaultSpotLightShadowOptions, { transform: mergeInputs(defaultSpotLightShadowOptions) });

	mesh = viewChild.required<ElementRef<Mesh>>('mesh');

	private spotLight = inject(NgtsSpotLight);
	debug = this.spotLight.debug;

	alphaTest = pick(this.options, 'alphaTest');
	scale = pick(this.options, 'scale');
	map = computed(() => {
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

		const injector = inject(Injector);
		afterNextRender(() => {
			injectSpotLightCommon(this.spotLight.spotLight, this.mesh, this.width, this.height, this.distance, injector);
		});
	}
}

@Component({
	selector: 'ngts-spot-light-shadow',
	standalone: true,
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
	shader = input<string>();
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
};

@Component({
	selector: 'ngts-spot-light',
	standalone: true,
	template: `
		<ngt-group>
			<ngt-spot-light
				#spotLight
				[angle]="angle()"
				[color]="color()"
				[distance]="distance()"
				[castShadow]="true"
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
	imports: [NgtArgs, NgtsVolumetricMesh, NgtsHelper],
})
export class NgtsSpotLight {
	protected readonly SpotLightHelper = SpotLightHelper;

	options = input(defaultOptions, { transform: mergeInputs(defaultOptions) });
	parameters = omit(this.options, [
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
	volumetricOptions = pick(this.options, [
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

	spotLight = viewChild.required<ElementRef<SpotLight>>('spotLight');

	debug = pick(this.options, 'debug');
	angle = pick(this.options, 'angle');
	color = pick(this.options, 'color');
	distance = pick(this.options, 'distance');
	volumetric = pick(this.options, 'volumetric');

	constructor() {
		extend({ Group, SpotLight });
	}
}
