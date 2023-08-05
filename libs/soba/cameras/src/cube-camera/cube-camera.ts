import { NgTemplateOutlet } from '@angular/common';
import {
	CUSTOM_ELEMENTS_SCHEMA,
	Component,
	ContentChild,
	DestroyRef,
	Directive,
	EmbeddedViewRef,
	Input,
	OnInit,
	Signal,
	TemplateRef,
	ViewChild,
	ViewContainerRef,
	computed,
	effect,
	inject,
	runInInjectionContext,
	untracked,
	type Injector,
} from '@angular/core';
import {
	NgtArgs,
	assertInjectionContext,
	extend,
	injectBeforeRender,
	injectNgtRef,
	injectNgtStore,
	signalStore,
	type NgtGroup,
} from 'angular-three';
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
	injector = assertInjectionContext(injectNgtsCubeCamera, injector);
	return runInInjectionContext(injector, () => {
		const state = computed(() => {
			const cameraState = cubeCameraState();
			return { ...defaultCubeCameraState, ...cameraState };
		});

		const store = injectNgtStore();

		const gl = store.select('gl');
		const scene = store.select('scene');

		const fbo = computed(() => {
			const renderTarget = new THREE.WebGLCubeRenderTarget(state().resolution);
			renderTarget.texture.type = THREE.HalfFloatType;
			return renderTarget;
		});

		effect((onCleanup) => {
			const _fbo = fbo();
			onCleanup(() => _fbo.dispose());
		});

		const camera = computed(() => {
			const { near, far } = state();
			return new THREE.CubeCamera(near, far, fbo());
		});

		let originalFog: THREE.Scene['fog'];
		let originalBackground: THREE.Scene['background'];

		const update = computed(() => {
			const _scene = scene();
			const _gl = gl();
			const _camera = camera();
			const { envMap, fog } = untracked(state);

			return () => {
				originalFog = _scene.fog;
				originalBackground = _scene.background;
				_scene.background = envMap || originalBackground;
				_scene.fog = fog || originalFog;
				_camera.update(_gl, _scene);
				_scene.fog = originalFog;
				_scene.background = originalBackground;
			};
		});

		return { fbo, camera, update };
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
				<ng-container #anchor />
			</ngt-group>
		</ngt-group>
	`,
	imports: [NgtArgs, NgTemplateOutlet],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsCubeCamera implements OnInit {
	private inputs = signalStore<NgtsCubeCameraComponentState>({ frames: Infinity });

	@Input() cameraRef = injectNgtRef<Group>();

	@ContentChild(NgtsCubeCameraContent, { static: true, read: TemplateRef })
	cameraContent!: TemplateRef<{ texture: Signal<THREE.WebGLRenderTarget['texture']> }>;

	@ViewChild('anchor', { static: true, read: ViewContainerRef })
	anchor!: ViewContainerRef;

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

	cubeCamera = injectNgtsCubeCamera(this.inputs.select());
	private texture = computed(() => this.cubeCamera.fbo().texture);
	private contentRef?: EmbeddedViewRef<unknown>;

	constructor() {
		this.beforeRender();
		inject(DestroyRef).onDestroy(() => {
			this.contentRef?.destroy();
		});
	}

	ngOnInit() {
		this.contentRef = this.anchor.createEmbeddedView(this.cameraContent, { texture: this.texture });
	}

	private beforeRender() {
		let count = 0;
		injectBeforeRender(() => {
			const camera = this.cameraRef.nativeElement;
			if (!camera) return;
			const update = this.cubeCamera.update();
			const frames = this.inputs.get('frames');
			if (frames === Infinity || count < frames) {
				camera.visible = false;
				update();
				camera.visible = true;
				count++;
			}
		});
	}
}
