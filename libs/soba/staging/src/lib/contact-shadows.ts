import {
	CUSTOM_ELEMENTS_SCHEMA,
	ChangeDetectionStrategy,
	Component,
	ElementRef,
	computed,
	input,
	viewChild,
} from '@angular/core';
import { NgtArgs, NgtGroup, extend, injectBeforeRender, injectStore, omit, pick } from 'angular-three';
import { mergeInputs } from 'ngxtension/inject-inputs';
import {
	Color,
	ColorRepresentation,
	Group,
	Material,
	Mesh,
	MeshBasicMaterial,
	MeshDepthMaterial,
	OrthographicCamera,
	PlaneGeometry,
	ShaderMaterial,
	Texture,
	WebGLRenderTarget,
} from 'three';
import { HorizontalBlurShader, VerticalBlurShader } from 'three-stdlib';

export interface NgtsContactShadowsOptions extends Partial<Omit<NgtGroup, 'scale'>> {
	opacity: number;
	width: number;
	height: number;
	blur: number;
	near: number;
	far: number;
	smooth: boolean;
	resolution: number;
	frames: number;
	scale: number | [x: number, y: number];
	color: ColorRepresentation;
	depthWrite: boolean;
}

const defaultOptions: NgtsContactShadowsOptions = {
	scale: 10,
	frames: Infinity,
	opacity: 1,
	width: 1,
	height: 1,
	blur: 1,
	near: 0,
	far: 10,
	resolution: 512,
	smooth: true,
	color: '#000000',
	depthWrite: false,
};

@Component({
	selector: 'ngts-contact-shadows',
	standalone: true,
	template: `
		<ngt-group #contactShadows [rotation]="[Math.PI / 2, 0, 0]" [parameters]="parameters()">
			<ngt-mesh
				[scale]="[1, -1, 1]"
				[rotation]="[-Math.PI / 2, 0, 0]"
				[renderOrder]="renderOrder() ?? 0"
				[geometry]="planeGeometry()"
			>
				<ngt-mesh-basic-material
					[transparent]="true"
					[opacity]="opacity()"
					[depthWrite]="depthWrite()"
					[map]="texture()"
				/>
			</ngt-mesh>
			<ngt-orthographic-camera *args="cameraArgs()" #shadowsCamera />
		</ngt-group>
	`,
	imports: [NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgtsContactShadows {
	Math = Math;

	options = input(defaultOptions, { transform: mergeInputs(defaultOptions) });
	parameters = omit(this.options, [
		'scale',
		'frames',
		'opacity',
		'width',
		'height',
		'blur',
		'near',
		'far',
		'resolution',
		'smooth',
		'color',
		'depthWrite',
		'renderOrder',
	]);

	contactShadowsRef = viewChild.required<ElementRef<Group>>('contactShadows');
	shadowsCameraRef = viewChild<ElementRef<OrthographicCamera>>('shadowsCamera');

	private store = injectStore();
	private scene = this.store.select('scene');
	private gl = this.store.select('gl');

	private scaledWidth = computed(() => {
		const { width, scale } = this.options();
		return width * (Array.isArray(scale) ? scale[0] : scale);
	});
	private scaledHeight = computed(() => {
		const { height, scale } = this.options();
		return height * (Array.isArray(scale) ? scale[1] : scale);
	});
	private resolution = pick(this.options, 'resolution');
	private color = pick(this.options, 'color');
	private near = pick(this.options, 'near');
	private far = pick(this.options, 'far');

	private shadowsOptions = computed(() => {
		const [width, height, resolution, color] = [
			this.scaledWidth(),
			this.scaledHeight(),
			this.resolution(),
			this.color(),
		];
		const renderTarget = new WebGLRenderTarget(resolution, resolution);
		const renderTargetBlur = new WebGLRenderTarget(resolution, resolution);
		renderTargetBlur.texture.generateMipmaps = renderTarget.texture.generateMipmaps = false;

		const planeGeometry = new PlaneGeometry(width, height).rotateX(Math.PI / 2);
		const blurPlane = new Mesh(planeGeometry);
		const depthMaterial = new MeshDepthMaterial();
		depthMaterial.depthTest = depthMaterial.depthWrite = false;
		depthMaterial.onBeforeCompile = (shader) => {
			shader.uniforms = { ...shader.uniforms, ucolor: { value: new Color(color) } };
			shader.fragmentShader = shader.fragmentShader.replace(
				`void main() {`, //
				`uniform vec3 ucolor;
         void main() {
        `,
			);
			shader.fragmentShader = shader.fragmentShader.replace(
				'vec4( vec3( 1.0 - fragCoordZ ), opacity );',
				// Colorize the shadow, multiply by the falloff so that the center can remain darker
				'vec4( ucolor * fragCoordZ * 2.0, ( 1.0 - fragCoordZ ) * 1.0 );',
			);
		};

		const horizontalBlurMaterial = new ShaderMaterial(HorizontalBlurShader);
		const verticalBlurMaterial = new ShaderMaterial(VerticalBlurShader);
		verticalBlurMaterial.depthTest = horizontalBlurMaterial.depthTest = false;

		return {
			renderTarget,
			planeGeometry,
			depthMaterial,
			blurPlane,
			horizontalBlurMaterial,
			verticalBlurMaterial,
			renderTargetBlur,
		};
	});

	renderOrder = pick(this.options, 'renderOrder');
	opacity = pick(this.options, 'opacity');
	depthWrite = pick(this.options, 'depthWrite');
	planeGeometry = computed(() => this.shadowsOptions().planeGeometry);
	texture = computed(() => this.shadowsOptions().renderTarget.texture);
	cameraArgs = computed(() => {
		const [width, height, near, far] = [this.scaledWidth(), this.scaledHeight(), this.near(), this.far()];
		return [-width / 2, width / 2, height / 2, -height / 2, near, far];
	});

	private blurShadows(blur: number) {
		const { renderTarget, renderTargetBlur, blurPlane, horizontalBlurMaterial, verticalBlurMaterial } =
			this.shadowsOptions();
		const shadowsCamera = this.shadowsCameraRef()?.nativeElement;
		if (!shadowsCamera) return;

		blurPlane.visible = true;
		blurPlane.material = horizontalBlurMaterial;
		horizontalBlurMaterial.uniforms['tDiffuse'].value = renderTarget.texture;
		horizontalBlurMaterial.uniforms['h'].value = blur / 256;
		this.gl().setRenderTarget(renderTargetBlur);
		this.gl().render(blurPlane, shadowsCamera);

		blurPlane.material = verticalBlurMaterial;
		verticalBlurMaterial.uniforms['tDiffuse'].value = renderTargetBlur.texture;
		verticalBlurMaterial.uniforms['v'].value = blur / 256;
		this.gl().setRenderTarget(renderTarget);
		this.gl().render(blurPlane, shadowsCamera);
		blurPlane.visible = false;
	}

	constructor() {
		extend({ Group, Mesh, MeshBasicMaterial, OrthographicCamera });

		let count = 0;
		let initialBackground: Color | Texture | null;
		let initialOverrideMaterial: Material | null;

		injectBeforeRender(() => {
			const shadowsCamera = this.shadowsCameraRef()?.nativeElement;
			if (!shadowsCamera) return;
			const [{ frames, blur, smooth }, gl, scene, contactShadows, { depthMaterial, renderTarget }] = [
				this.options(),
				this.gl(),
				this.scene(),
				this.contactShadowsRef().nativeElement,
				this.shadowsOptions(),
			];
			if (frames === Infinity || count < frames * frames) {
				count++;
				initialBackground = scene.background;
				initialOverrideMaterial = scene.overrideMaterial;
				contactShadows.visible = false;
				scene.background = null;
				scene.overrideMaterial = depthMaterial;
				gl.setRenderTarget(renderTarget);
				gl.render(scene, shadowsCamera);
				this.blurShadows(blur);
				if (smooth) this.blurShadows(blur * 0.4);
				gl.setRenderTarget(null);
				contactShadows.visible = true;
				scene.overrideMaterial = initialOverrideMaterial;
				scene.background = initialBackground;
			}
		});
	}
}
