import { NgTemplateOutlet } from '@angular/common';
import {
	CUSTOM_ELEMENTS_SCHEMA,
	Component,
	ContentChild,
	Directive,
	Input,
	TemplateRef,
	computed,
	effect,
	untracked,
	type Injector,
	type Signal,
} from '@angular/core';
import {
	NgtArgs,
	extend,
	injectBeforeRender,
	injectNgtRef,
	injectNgtStore,
	signalStore,
	type NgtGroup,
} from 'angular-three-old';
import { assertInjector } from 'ngxtension/assert-injector';
import * as THREE from 'three';
import { Group } from 'three';

export type NgtsCubeCameraState = {
	/** Resolution of the FBO, 256 */
	resolution: number;
	/** Camera near, 0.1 */
	near: number;
	/** Camera far, 1000 */
	far: number;
	/** Custom environment map that is temporarily set as the scenes background */
	envMap?: THREE.Texture;
	/** Custom fog that is temporarily set as the scenes fog */
	fog?: THREE.Fog | THREE.FogExp2;
};

const defaultCubeCameraState = {
	resolution: 256,
	near: 0.1,
	far: 1000,
} satisfies NgtsCubeCameraState;

export function injectNgtsCubeCamera(
	cubeCameraState: () => Partial<NgtsCubeCameraState>,
	{ injector }: { injector?: Injector } = {},
) {
	return assertInjector(injectNgtsCubeCamera, injector, () => {
		const state = computed(() => ({ ...defaultCubeCameraState, ...cubeCameraState() }));
		const resolution = computed(() => state().resolution);
		const near = computed(() => state().near);
		const far = computed(() => state().far);

		const store = injectNgtStore();

		const [_gl, _scene] = [store.select('gl'), store.select('scene')];

		const _fbo = computed(() => {
			const renderTarget = new THREE.WebGLCubeRenderTarget(resolution());
			renderTarget.texture.type = THREE.HalfFloatType;
			return renderTarget;
		});

		effect((onCleanup) => {
			const fbo = _fbo();
			onCleanup(() => fbo.dispose());
		});

		const _camera = computed(() => new THREE.CubeCamera(near(), far(), _fbo()));

		let originalFog: THREE.Scene['fog'];
		let originalBackground: THREE.Scene['background'];

		const update = computed(() => {
			const [scene, gl, camera, { envMap, fog }] = [_scene(), _gl(), _camera(), untracked(state)];

			return () => {
				originalFog = scene.fog;
				originalBackground = scene.background;
				scene.background = envMap || originalBackground;
				scene.fog = fog || originalFog;
				camera.update(gl, scene);
				scene.fog = originalFog;
				scene.background = originalBackground;
			};
		});

		return { fbo: _fbo, camera: _camera, update };
	});
}

extend({ Group });

export type NgtsCubeCameraComponentState = NgtsCubeCameraState & {
	frames: number;
};

declare global {
	interface HTMLElementTagNameMap {
		/**
		 * @extends ngt-group
		 */
		'ngts-cube-camera': NgtsCubeCameraComponentState & NgtGroup;
	}
}

@Directive({ selector: 'ng-template[ngtsCubeCameraContent]', standalone: true })
export class NgtsCubeCameraContent {
	static ngTemplateContextGuard(
		_: NgtsCubeCameraContent,
		ctx: unknown,
	): ctx is { texture: Signal<THREE.WebGLRenderTarget['texture']> } {
		return true;
	}
}

@Component({
	selector: 'ngts-cube-camera',
	standalone: true,
	template: `
		<ngt-group ngtCompound>
			<ngt-primitive *args="[cubeCamera.camera()]" />
			<ngt-group [ref]="cameraRef">
				<ng-container *ngTemplateOutlet="cameraContent; context: { texture }" />
			</ngt-group>
		</ngt-group>
	`,
	imports: [NgtArgs, NgTemplateOutlet],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsCubeCamera {
	private inputs = signalStore<NgtsCubeCameraComponentState>({ frames: Infinity });

	@Input() cameraRef = injectNgtRef<Group>();

	@ContentChild(NgtsCubeCameraContent, { static: true, read: TemplateRef })
	cameraContent!: TemplateRef<{ texture: Signal<THREE.WebGLRenderTarget['texture']> }>;

	/** Resolution of the FBO, 256 */
	@Input({ alias: 'resolution' }) set _resolution(resolution: number) {
		this.inputs.set({ resolution });
	}

	/** Camera near, 0.1 */
	@Input({ alias: 'near' }) set _near(near: number) {
		this.inputs.set({ near });
	}

	/** Camera far, 1000 */
	@Input({ alias: 'far' }) set _far(far: number) {
		this.inputs.set({ far });
	}

	/** Custom environment map that is temporarily set as the scenes background */
	@Input({ alias: 'envMap' }) set _envMap(envMap: THREE.Texture) {
		this.inputs.set({ envMap });
	}

	/** Custom fog that is temporarily set as the scenes fog */
	@Input({ alias: 'fog' }) set _fog(fog: THREE.Fog | THREE.FogExp2) {
		this.inputs.set({ fog });
	}

	cubeCamera = injectNgtsCubeCamera(this.inputs.state);
	texture = computed(() => this.cubeCamera.fbo().texture);

	constructor() {
		this.beforeRender();
	}

	private beforeRender() {
		let count = 0;
		injectBeforeRender(() => {
			const camera = this.cameraRef.nativeElement;
			if (!camera) return;
			const [update, frames] = [this.cubeCamera.update(), this.inputs.get('frames')];
			if (frames === Infinity || count < frames) {
				camera.visible = false;
				update();
				camera.visible = true;
				count++;
			}
		});
	}
}
