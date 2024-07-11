import {
	CUSTOM_ELEMENTS_SCHEMA,
	ChangeDetectionStrategy,
	Component,
	ElementRef,
	afterNextRender,
	computed,
	input,
	viewChild,
} from '@angular/core';
import { MeshDiscardMaterial, SoftShadowMaterial } from '@pmndrs/vanilla';
import {
	NgtGroup,
	createApiToken,
	extend,
	getLocalState,
	injectNextBeforeRender,
	injectStore,
	omit,
	pick,
} from 'angular-three';
import { injectAutoEffect } from 'ngxtension/auto-effect';
import { mergeInputs } from 'ngxtension/inject-inputs';
import {
	Camera,
	Color,
	Group,
	HalfFloatType,
	Light,
	Material,
	Mesh,
	MeshLambertMaterial,
	NearestFilter,
	PlaneGeometry,
	Scene,
	ShaderMaterial,
	Texture,
	WebGLRenderTarget,
	WebGLRenderer,
} from 'three';

export interface NgtsAccumulativeShadowsOptions extends Partial<NgtGroup> {
	/** How many frames it can render, more yields cleaner results but takes more time, 40 */
	frames: number;
	/** If frames === Infinity blend controls the refresh ratio, 100 */
	blend: number;
	/** Can limit the amount of frames rendered if frames === Infinity, usually to get some performance back once a movable scene has settled, Infinity */
	limit: number;
	/** Scale of the plane,  */
	scale: number;
	/** Temporal accumulates shadows over time which is more performant but has a visual regression over instant results, false  */
	temporal?: boolean;
	/** Opacity of the plane, 1 */
	opacity: number;
	/** Discards alpha pixels, 0.65 */
	alphaTest: number;
	/** Shadow color, black */
	color: string;
	/** Colorblend, how much colors turn to black, 0 is black, 2 */
	colorBlend: number;
	/** Buffer resolution, 1024 */
	resolution: number;
	/** Texture tonemapping */
	toneMapped: boolean;
}

export const [injectAccumulativeShadowsApi, provideAccumulativeShadowsApi] = createApiToken(
	() => NgtsAccumulativeShadows,
);

const defaultOptions: NgtsAccumulativeShadowsOptions = {
	frames: 40,
	limit: Infinity,
	blend: 20,
	scale: 10,
	opacity: 1,
	alphaTest: 0.75,
	color: 'black',
	colorBlend: 2,
	resolution: 1024,
	toneMapped: true,
};

@Component({
	selector: 'ngts-accumulative-shadows',
	standalone: true,
	template: `
		<ngt-group [parameters]="parameters()">
			<ngt-group #lights [traverse]="nullTraversal">
				<ng-content />
			</ngt-group>

			<ngt-mesh #plane [scale]="scale()" [rotation]="[-Math.PI / 2, 0, 0]" [receiveShadow]="true">
				<ngt-plane-geometry />
				<ngt-soft-shadow-material
					[transparent]="true"
					[depthWrite]="false"
					[toneMapped]="toneMapped()"
					[color]="color()"
					[blend]="colorBlend()"
					[map]="map()"
				/>
			</ngt-mesh>
		</ngt-group>
	`,
	providers: [provideAccumulativeShadowsApi()],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgtsAccumulativeShadows {
	nullTraversal = () => null;
	Math = Math;

	options = input(defaultOptions, { transform: mergeInputs(defaultOptions) });
	parameters = omit(this.options, [
		'temporal',
		'frames',
		'limit',
		'blend',
		'scale',
		'opacity',
		'alphaTest',
		'color',
		'colorBlend',
		'resolution',
		'toneMapped',
	]);

	lights = viewChild.required<ElementRef<Group>>('lights');
	plane = viewChild.required<ElementRef<Mesh>>('plane');

	private autoEffect = injectAutoEffect();
	private store = injectStore();
	private gl = this.store.select('gl');
	private camera = this.store.select('camera');
	private scene = this.store.select('scene');
	private invalidate = this.store.select('invalidate');

	private temporal = pick(this.options, 'temporal');
	private frames = pick(this.options, 'frames');
	private blend = pick(this.options, 'blend');
	private opacity = pick(this.options, 'opacity');
	private alphaTest = pick(this.options, 'alphaTest');
	private limit = pick(this.options, 'limit');

	private resolution = pick(this.options, 'resolution');
	private pLM = computed(() => new ProgressiveLightMap(this.gl(), this.scene(), this.resolution()));

	scale = pick(this.options, 'scale');
	toneMapped = pick(this.options, 'toneMapped');
	color = pick(this.options, 'color');
	colorBlend = pick(this.options, 'colorBlend');
	map = computed(() => this.pLM().progressiveLightMap2.texture);

	api = computed(() => {
		const [pLM, camera, , temporal, frames, blend, opacity, alphaTest, lights, plane] = [
			this.pLM(),
			this.camera(),
			this.scene(),
			this.temporal(),
			this.frames(),
			this.blend(),
			this.opacity(),
			this.alphaTest(),
			this.lights(),
			this.plane(),
		];

		const api = {
			lights: new Map<string, () => void>(),
			temporal: !!temporal,
			frames: Math.max(2, frames),
			blend: Math.max(2, frames === Infinity ? blend : frames),
			count: 0,
			getMesh: () => plane.nativeElement,
			reset: () => {
				if (!plane.nativeElement) return;
				// Clear buffers, reset opacities, set frame count to 0
				pLM.clear();
				const material = plane.nativeElement.material as Material;
				material.opacity = 0;
				material.alphaTest = 0;
				api.count = 0;
			},
			update: (frames = 1) => {
				// Adapt the opacity-blend ratio to the number of frames
				const material = plane.nativeElement.material as Material;
				if (!api.temporal) {
					material.opacity = opacity;
					material.alphaTest = alphaTest;
				} else {
					material.opacity = Math.min(opacity, material.opacity + opacity / api.blend);
					material.alphaTest = Math.min(alphaTest, material.alphaTest + alphaTest / api.blend);
				}

				// Switch accumulative lights on
				lights.nativeElement.visible = true;
				// Collect scene lights and meshes
				pLM.prepare();

				// Update the lightmap and the accumulative lights
				for (let i = 0; i < frames; i++) {
					api.lights.forEach((lightUpdate) => lightUpdate());
					pLM.update(camera, api.blend);
				}
				// Switch lights off
				lights.nativeElement.visible = false;
				// Restore lights and meshes
				pLM.finish();
			},
		};

		return api;
	});

	constructor() {
		extend({ Group, SoftShadowMaterial, Mesh, PlaneGeometry });

		afterNextRender(() => {
			this.autoEffect(() => {
				const [pLM, plane] = [this.pLM(), this.plane()];
				if (!plane) return;
				pLM.configure(plane.nativeElement);
			});

			this.autoEffect(() => {
				const sceneLS = getLocalState(this.scene());
				const [api, plane] = [this.api(), this.plane(), this.options(), sceneLS?.objects()];
				if (!plane.nativeElement) return;
				// Reset internals, buffers, ...
				api.reset();
				// Update lightmap
				if (!api.temporal && api.frames !== Infinity) api.update(api.blend);
			});
		});

		injectNextBeforeRender(() => {
			const [api, invalidate, limit] = [this.api(), this.invalidate(), this.limit()];
			if ((api.temporal || api.frames === Infinity) && api.count < api.frames && api.count < limit) {
				invalidate();
				api.update();
				api.count++;
			}
		});
	}
}

function hasGeometry(obj: unknown): obj is Mesh {
	return obj instanceof Mesh && !!obj.geometry;
}

function isLight(object: unknown): object is Light {
	return !!object && typeof object === 'object' && 'isLight' in object && object['isLight'] === true;
}

// Based on "Progressive Light Map Accumulator", by [zalo](https://github.com/zalo/)
class ProgressiveLightMap {
	renderer: WebGLRenderer;
	res: number;
	scene: Scene;
	object: Mesh | null;
	buffer1Active: boolean;
	progressiveLightMap1: WebGLRenderTarget;
	progressiveLightMap2: WebGLRenderTarget;
	discardMat: ShaderMaterial;
	targetMat: MeshLambertMaterial;
	previousShadowMap: { value: Texture };
	averagingWindow: { value: number };
	clearColor: Color;
	clearAlpha: number;
	lights: { object: Light; intensity: number }[];
	meshes: { object: Mesh; material: Material | Material[] }[];

	constructor(renderer: WebGLRenderer, scene: Scene, res: number = 1024) {
		this.renderer = renderer;
		this.res = res;
		this.scene = scene;
		this.buffer1Active = false;
		this.lights = [];
		this.meshes = [];
		this.object = null;
		this.clearColor = new Color();
		this.clearAlpha = 0;

		// Create the Progressive LightMap Texture
		const textureParams = {
			type: HalfFloatType,
			magFilter: NearestFilter,
			minFilter: NearestFilter,
		};
		this.progressiveLightMap1 = new WebGLRenderTarget(this.res, this.res, textureParams);
		this.progressiveLightMap2 = new WebGLRenderTarget(this.res, this.res, textureParams);

		// Inject some spicy new logic into a standard phong material
		this.discardMat = new MeshDiscardMaterial();
		this.targetMat = new MeshLambertMaterial({ fog: false });
		this.previousShadowMap = { value: this.progressiveLightMap1.texture };
		this.averagingWindow = { value: 100 };
		this.targetMat.onBeforeCompile = (shader) => {
			// Vertex Shader: Set Vertex Positions to the Unwrapped UV Positions
			shader.vertexShader =
				'varying vec2 vUv;\n' +
				shader.vertexShader.slice(0, -1) +
				'vUv = uv; gl_Position = vec4((uv - 0.5) * 2.0, 1.0, 1.0); }';

			// Fragment Shader: Set Pixels to average in the Previous frame's Shadows
			const bodyStart = shader.fragmentShader.indexOf('void main() {');
			shader.fragmentShader =
				'varying vec2 vUv;\n' +
				shader.fragmentShader.slice(0, bodyStart) +
				'uniform sampler2D previousShadowMap;\n	uniform float averagingWindow;\n' +
				shader.fragmentShader.slice(bodyStart - 1, -1) +
				`\nvec3 texelOld = texture2D(previousShadowMap, vUv).rgb;
        gl_FragColor.rgb = mix(texelOld, gl_FragColor.rgb, 1.0/ averagingWindow);
      }`;

			// Set the Previous Frame's Texture Buffer and Averaging Window
			// Set the Previous Frame's Texture Buffer and Averaging Window
			shader.uniforms['previousShadowMap'] = this.previousShadowMap;
			shader.uniforms['averagingWindow'] = this.averagingWindow;
		};
	}

	clear() {
		this.renderer.getClearColor(this.clearColor);
		this.clearAlpha = this.renderer.getClearAlpha();
		this.renderer.setClearColor('black', 1);
		this.renderer.setRenderTarget(this.progressiveLightMap1);
		this.renderer.clear();
		this.renderer.setRenderTarget(this.progressiveLightMap2);
		this.renderer.clear();
		this.renderer.setRenderTarget(null);
		this.renderer.setClearColor(this.clearColor, this.clearAlpha);

		this.lights = [];
		this.meshes = [];
		this.scene.traverse((object) => {
			if (hasGeometry(object)) {
				this.meshes.push({ object, material: object.material });
			} else if (isLight(object)) {
				this.lights.push({ object, intensity: object.intensity });
			}
		});
	}

	prepare() {
		this.lights.forEach((light) => (light.object.intensity = 0));
		this.meshes.forEach((mesh) => (mesh.object.material = this.discardMat));
	}

	finish() {
		this.lights.forEach((light) => (light.object.intensity = light.intensity));
		this.meshes.forEach((mesh) => (mesh.object.material = mesh.material));
	}

	configure(object: Mesh) {
		this.object = object;
	}

	update(camera: Camera, blendWindow = 100) {
		if (!this.object) return;
		// Set each object's material to the UV Unwrapped Surface Mapping Version
		this.averagingWindow.value = blendWindow;
		this.object.material = this.targetMat;
		// Ping-pong two surface buffers for reading/writing
		const activeMap = this.buffer1Active ? this.progressiveLightMap1 : this.progressiveLightMap2;
		const inactiveMap = this.buffer1Active ? this.progressiveLightMap2 : this.progressiveLightMap1;
		// Render the object's surface maps
		const oldBg = this.scene.background;
		this.scene.background = null;
		this.renderer.setRenderTarget(activeMap);
		this.previousShadowMap.value = inactiveMap.texture;
		this.buffer1Active = !this.buffer1Active;
		this.renderer.render(this.scene, camera);
		this.renderer.setRenderTarget(null);
		this.scene.background = oldBg;
	}
}
