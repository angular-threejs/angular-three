import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, Input } from '@angular/core';
import {
	extend,
	injectBeforeRender,
	injectNgtRef,
	injectNgtStore,
	NgtArgs,
	signalStore,
	type NgtGroup,
	type NgtRenderState,
} from 'angular-three-old';
import * as THREE from 'three';
import { Group, Mesh, MeshBasicMaterial, OrthographicCamera } from 'three';
import { HorizontalBlurShader, VerticalBlurShader } from 'three-stdlib';

extend({ Group, Mesh, MeshBasicMaterial, OrthographicCamera });

export type NgtsContactShadowsState = {
	opacity: number;
	width: number;
	height: number;
	blur: number;
	far: number;
	smooth: boolean;
	resolution: number;
	frames: number;
	scale: number | [x: number, y: number];
	color: THREE.ColorRepresentation;
	depthWrite: boolean;
	renderOrder: number;
};

declare global {
	interface HTMLElementTagNameMap {
		/**
		 * @extends ngt-group
		 */
		'ngts-contact-shadows': NgtsContactShadowsState & NgtGroup;
	}
}

@Component({
	selector: 'ngts-contact-shadows',
	standalone: true,
	template: `
		<ngt-group ngtCompound [ref]="contactShadowsRef" [rotation]="[Math.PI / 2, 0, 0]">
			<ngt-mesh
				[renderOrder]="renderOrder() ?? 0"
				[geometry]="contactShadows().planeGeometry"
				[scale]="[1, -1, 1]"
				[rotation]="[-Math.PI / 2, 0, 0]"
			>
				<ngt-mesh-basic-material
					[map]="contactShadows().renderTarget.texture"
					[transparent]="true"
					[opacity]="opacity() ?? 1"
					[depthWrite]="depthWrite() ?? false"
				/>
			</ngt-mesh>
			<ngt-orthographic-camera *args="cameraArgs()" [ref]="shadowCameraRef" />
		</ngt-group>
	`,
	imports: [NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsContactShadows {
	private inputs = signalStore<NgtsContactShadowsState>({
		scale: 10,
		frames: Infinity,
		opacity: 1,
		width: 1,
		height: 1,
		blur: 1,
		far: 10,
		resolution: 512,
		smooth: true,
		color: '#000000',
		depthWrite: false,
		renderOrder: 0,
	});

	@Input() contactShadowsRef = injectNgtRef<Group>();

	@Input({ alias: 'opacity' }) set _opacity(opacity: number) {
		this.inputs.set({ opacity });
	}

	@Input({ alias: 'width' }) set _width(width: number) {
		this.inputs.set({ width });
	}

	@Input({ alias: 'height' }) set _height(height: number) {
		this.inputs.set({ height });
	}

	@Input({ alias: 'blur' }) set _blur(blur: number) {
		this.inputs.set({ blur });
	}

	@Input({ alias: 'far' }) set _far(far: number) {
		this.inputs.set({ far });
	}

	@Input({ alias: 'smooth' }) set _smooth(smooth: boolean) {
		this.inputs.set({ smooth });
	}

	@Input({ alias: 'resolution' }) set _resolution(resolution: number) {
		this.inputs.set({ resolution });
	}

	@Input({ alias: 'frames' }) set _frames(frames: number) {
		this.inputs.set({ frames });
	}

	@Input({ alias: 'scale' }) set _scale(scale: number | [x: number, y: number]) {
		this.inputs.set({ scale });
	}

	@Input({ alias: 'color' }) set _color(color: THREE.ColorRepresentation) {
		this.inputs.set({ color });
	}

	@Input({ alias: 'depthWrite' }) set _depthWrite(depthWrite: boolean) {
		this.inputs.set({ depthWrite });
	}

	@Input({ alias: 'renderOrder' }) set _renderOrder(renderOrder: number) {
		this.inputs.set({ renderOrder });
	}

	Math = Math;

	private store = injectNgtStore();

	shadowCameraRef = injectNgtRef<OrthographicCamera>();

	private scale = this.inputs.select('scale');
	private width = this.inputs.select('width');
	private height = this.inputs.select('height');
	private far = this.inputs.select('far');
	private resolution = this.inputs.select('resolution');
	private color = this.inputs.select('color');

	private scaledWidth = computed(() => {
		const scale = this.scale();
		return this.width() * (Array.isArray(scale) ? scale[0] : scale || 1);
	});
	private scaledHeight = computed(() => {
		const scale = this.scale();
		return this.height() * (Array.isArray(scale) ? scale[1] : scale || 1);
	});

	renderOrder = this.inputs.select('renderOrder');
	opacity = this.inputs.select('opacity');
	depthWrite = this.inputs.select('depthWrite');

	cameraArgs = computed(() => {
		const width = this.scaledWidth();
		const height = this.scaledHeight();
		return [-width / 2, width / 2, height / 2, -height / 2, 0, this.far()];
	});
	contactShadows = computed(() => {
		const [color, resolution] = [this.color(), this.resolution()];
		const renderTarget = new THREE.WebGLRenderTarget(resolution, resolution);
		const renderTargetBlur = new THREE.WebGLRenderTarget(resolution, resolution);
		renderTargetBlur.texture.generateMipmaps = renderTarget.texture.generateMipmaps = false;
		const planeGeometry = new THREE.PlaneGeometry(this.scaledWidth(), this.scaledHeight()).rotateX(Math.PI / 2);
		const blurPlane = new Mesh(planeGeometry);
		const depthMaterial = new THREE.MeshDepthMaterial();
		depthMaterial.depthTest = depthMaterial.depthWrite = false;
		depthMaterial.onBeforeCompile = (shader) => {
			shader.uniforms = {
				...shader.uniforms,
				ucolor: { value: new THREE.Color(color) },
			};
			shader.fragmentShader = shader.fragmentShader.replace(
				`void main() {`, //
				`uniform vec3 ucolor;
         void main() {`,
			);
			shader.fragmentShader = shader.fragmentShader.replace(
				'vec4( vec3( 1.0 - fragCoordZ ), opacity );',
				// Colorize the shadow, multiply by the falloff so that the center can remain darker
				'vec4( ucolor * fragCoordZ * 2.0, ( 1.0 - fragCoordZ ) * 1.0 );',
			);
		};

		const horizontalBlurMaterial = new THREE.ShaderMaterial(HorizontalBlurShader);
		const verticalBlurMaterial = new THREE.ShaderMaterial(VerticalBlurShader);
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

	constructor() {
		injectBeforeRender(this.beforeRender.bind(this, 0));
	}

	private beforeRender(count: number, { scene, gl }: NgtRenderState) {
		const { frames = Infinity, blur = 1, smooth = true } = this.inputs.get();
		const { depthMaterial, renderTarget } = this.contactShadows();
		const shadowCamera = this.shadowCameraRef.nativeElement;
		if (shadowCamera && (frames === Infinity || count < frames)) {
			const initialBackground = scene.background;
			scene.background = null;
			const initialOverrideMaterial = scene.overrideMaterial;
			scene.overrideMaterial = depthMaterial;
			gl.setRenderTarget(renderTarget);
			gl.render(scene, shadowCamera);
			scene.overrideMaterial = initialOverrideMaterial;

			this.blurShadows(blur);
			if (smooth) this.blurShadows(blur * 0.4);

			gl.setRenderTarget(null);
			scene.background = initialBackground;
			count++;
		}
	}

	private blurShadows(blur: number) {
		const { blurPlane, horizontalBlurMaterial, verticalBlurMaterial, renderTargetBlur, renderTarget } =
			this.contactShadows();
		const gl = this.store.get('gl');
		const shadowCamera = this.shadowCameraRef.nativeElement;

		blurPlane.visible = true;

		blurPlane.material = horizontalBlurMaterial;
		horizontalBlurMaterial.uniforms['tDiffuse'].value = renderTarget.texture;
		horizontalBlurMaterial.uniforms['h'].value = (blur * 1) / 256;

		gl.setRenderTarget(renderTargetBlur);
		gl.render(blurPlane, shadowCamera);

		blurPlane.material = verticalBlurMaterial;
		verticalBlurMaterial.uniforms['tDiffuse'].value = renderTargetBlur.texture;
		verticalBlurMaterial.uniforms['v'].value = (blur * 1) / 256;

		gl.setRenderTarget(renderTarget);
		gl.render(blurPlane, shadowCamera);

		blurPlane.visible = false;
	}
}
