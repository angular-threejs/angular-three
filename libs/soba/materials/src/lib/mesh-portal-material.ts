import { NgTemplateOutlet } from '@angular/common';
import {
	ChangeDetectionStrategy,
	Component,
	computed,
	contentChild,
	CUSTOM_ELEMENTS_SCHEMA,
	Directive,
	effect,
	ElementRef,
	inject,
	Injector,
	input,
	signal,
	TemplateRef,
	viewChild,
} from '@angular/core';
import {
	extend,
	getLocalState,
	injectBeforeRender,
	injectStore,
	NgtAttachable,
	NgtComputeFunction,
	NgtShaderMaterial,
	omit,
	pick,
} from 'angular-three';
import { getVersion, injectFBO, injectIntersect } from 'angular-three-soba/misc';
import { NgtsRenderTexture, NgtsRenderTextureContent } from 'angular-three-soba/staging';
import {
	MeshPortalMaterial,
	meshPortalMaterialApplySDF,
	NgtMeshPortalMaterial,
} from 'angular-three-soba/vanilla-exports';
import { mergeInputs } from 'ngxtension/inject-inputs';
import { Mesh, Scene, ShaderMaterial } from 'three';
import { FullScreenQuad } from 'three-stdlib';

/**
 * This directive is used inside of the render texture, hence has access to the render texture store (a portal store)
 */
@Directive({ selector: 'ngts-manage-portal-scene', standalone: true })
export class ManagePortalScene {
	events = input<boolean>();
	rootScene = input.required<Scene>();
	material = input.required<NgtMeshPortalMaterial>();
	priority = input.required<number>();
	worldUnits = input.required<boolean>();

	constructor() {
		const injector = inject(Injector);
		const renderTextureStore = injectStore();
		const portalScene = renderTextureStore.select('scene');
		const portalSetEvents = renderTextureStore.select('setEvents');

		const buffer1 = injectFBO();
		const buffer2 = injectFBO();

		const fullScreenQuad = computed(() => {
			// This fullscreen-quad is used to blend the two textures
			const blend = { value: 0 };
			const quad = new FullScreenQuad(
				new ShaderMaterial({
					uniforms: {
						a: { value: buffer1().texture },
						b: { value: buffer2().texture },
						blend,
					},
					vertexShader: /*glsl*/ `
		      varying vec2 vUv;
		      void main() {
		        vUv = uv;
		        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
		      }`,
					fragmentShader: /*glsl*/ `
		      uniform sampler2D a;
		      uniform sampler2D b;
		      uniform float blend;
		      varying vec2 vUv;
		      #include <packing>
		      void main() {
		        vec4 ta = texture2D(a, vUv);
		        vec4 tb = texture2D(b, vUv);
		        gl_FragColor = mix(tb, ta, blend);
		        #include <tonemapping_fragment>
		        #include <${getVersion() >= 154 ? 'colorspace_fragment' : 'encodings_fragment'}>
		      }`,
				}),
			);
			return [quad, blend] as const;
		});

		effect(() => {
			portalScene().matrixAutoUpdate = false;
		});

		effect(() => {
			const [events, setEvents] = [this.events(), portalSetEvents()];
			if (!events) return;
			setEvents({ enabled: events });
		});

		effect((onCleanup) => {
			const priority = this.priority();

			// we start the before render in effect because we need the priority input to be resolved
			const sub = injectBeforeRender(
				({ gl, camera }) => {
					const material = this.material();

					const localState = getLocalState(material);
					if (!localState) return;

					const parent = localState.parent();
					if (!parent) return;

					const materialBlend = 'blend' in material && typeof material.blend === 'number' ? material.blend : 0;
					const [worldUnits, rootScene, scene, [quad, blend]] = [
						this.worldUnits(),
						this.rootScene(),
						portalScene(),
						fullScreenQuad(),
					];
					// Move portal contents along with the parent if worldUnits is true
					if (!worldUnits) {
						// If the portal renders exclusively the original scene needs to be updated
						if (priority && materialBlend === 1) parent.updateWorldMatrix(true, false);
						scene.matrixWorld.copy(parent.matrixWorld);
					} else {
						scene.matrixWorld.identity();
					}

					// This bit is only necessary if the portal is blended, now it has a render-priority
					// and will take over the render loop
					if (priority) {
						if (materialBlend > 0 && materialBlend < 1) {
							// If blend is ongoing (> 0 and < 1) then we need to render both the root scene
							// and the portal scene, both will then be mixed in the quad from above
							blend.value = materialBlend;
							gl.setRenderTarget(buffer1());
							gl.render(scene, camera);
							gl.setRenderTarget(buffer2());
							gl.render(rootScene, camera);
							gl.setRenderTarget(null);
							quad.render(gl);
						} else if (materialBlend === 1) {
							// However if blend is 1 we only need to render the portal scene
							gl.render(scene, camera);
						}
					}
				},
				{ injector, priority },
			);
			onCleanup(() => sub());
		});
	}
}

export interface NgtsMeshPortalMaterialOptions extends Partial<NgtShaderMaterial> {
	/** Mix the portals own scene with the world scene, 0 = world scene render,
	 *  0.5 = both scenes render, 1 = portal scene renders, defaults to 0.   */
	blend: number;
	/** Edge fade blur, 0 = no blur (default) */
	blur: number;
	/** SDF resolution, the smaller the faster is the start-up time (default: 512) */
	resolution: number;
	/** By default portals use relative coordinates, contents are affects by the local matrix transform */
	worldUnits: boolean;
	/** Optional event priority, defaults to 0 */
	eventPriority: number;
	/** Optional render priority, defaults to 0 */
	renderPriority: number;
	/** Optionally diable events inside the portal, defaults to false */
	events: boolean;
}

const defaultOptions: NgtsMeshPortalMaterialOptions = {
	blend: 0,
	blur: 0,
	resolution: 512,
	worldUnits: false,
	eventPriority: 0,
	renderPriority: 0,
	events: false,
};

@Component({
	selector: 'ngts-mesh-portal-material',
	template: `
		<ngt-mesh-portal-material
			#material
			[attach]="attach()"
			[blur]="blur()"
			[blend]="0"
			[resolution]="materialResolution()"
			[parameters]="parameters()"
		>
			<ngts-render-texture
				[options]="{
					frames: renderTextureFrames(),
					eventPriority: eventPriority(),
					renderPriority: renderPriority(),
					compute: renderTextureCompute(),
				}"
			>
				<ng-template renderTextureContent let-injector="injector">
					<ng-container *ngTemplateOutlet="content(); injector: injector" />
					<ngts-manage-portal-scene
						[events]="events()"
						[rootScene]="rootScene()"
						[priority]="priority()"
						[material]="material"
						[worldUnits]="worldUnits()"
					/>
				</ng-template>
			</ngts-render-texture>
		</ngt-mesh-portal-material>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgtsRenderTexture, NgtsRenderTextureContent, ManagePortalScene, NgTemplateOutlet],
})
export class NgtsMeshPortalMaterial {
	attach = input<NgtAttachable>('material');
	options = input(defaultOptions, { transform: mergeInputs(defaultOptions) });
	parameters = omit(this.options, ['blur', 'resolution', 'worldUnits', 'eventPriority', 'renderPriority', 'events']);

	blur = pick(this.options, 'blur');
	eventPriority = pick(this.options, 'eventPriority');
	renderPriority = pick(this.options, 'renderPriority');
	events = pick(this.options, 'events');
	worldUnits = pick(this.options, 'worldUnits');

	materialRef = viewChild.required<ElementRef<InstanceType<typeof MeshPortalMaterial>>>('material');
	content = contentChild.required(TemplateRef);

	private store = injectStore();
	private size = this.store.select('size');
	private viewport = this.store.select('viewport');
	private gl = this.store.select('gl');
	private setEvents = this.store.select('setEvents');
	rootScene = this.store.select('scene');

	materialResolution = computed(() => [
		this.size().width * this.viewport().dpr,
		this.size().height * this.viewport().dpr,
	]);
	private resolution = pick(this.options, 'resolution');

	private parent = signal<Mesh | null>(null);
	private visible = injectIntersect(this.parent, { source: signal(true) });

	renderTextureFrames = computed(() => (this.visible() ? Infinity : 0));
	renderTextureCompute = computed(() => {
		const [parent, material] = [this.parent(), this.materialRef().nativeElement];

		const computeFn: (...args: Parameters<NgtComputeFunction>) => false | undefined = (event, state) => {
			if (!parent) return false;
			state.snapshot.pointer.set(
				(event.offsetX / state.snapshot.size.width) * 2 - 1,
				-(event.offsetY / state.snapshot.size.height) * 2 + 1,
			);
			state.snapshot.raycaster.setFromCamera(state.snapshot.pointer, state.snapshot.camera);

			if ('blend' in material && material.blend === 0) {
				// We run a quick check against the parent, if it isn't hit there's no need to raycast at all
				const [intersection] = state.snapshot.raycaster.intersectObject(parent);
				if (!intersection) {
					// Cancel out the raycast camera if the parent mesh isn't hit
					Object.assign(state.snapshot.raycaster, { camera: undefined });
					return false;
				}
			}

			return;
		};

		return computeFn;
	});

	priority = signal(0);

	constructor() {
		extend({ MeshPortalMaterial });

		effect(
			() => {
				const material = this.materialRef().nativeElement;

				const localState = getLocalState(material);
				if (!localState) return;

				const materialParent = localState.parent();
				if (!materialParent || !(materialParent instanceof Mesh)) return;

				// Since the ref above is not tied to a mesh directly (we're inside a material),
				// it has to be tied to the parent mesh here
				this.parent.set(materialParent);
			},
			{ allowSignalWrites: true },
		);

		effect(() => {
			const events = this.events();
			if (!events) return;

			const setEvents = this.setEvents();
			setEvents({ enabled: !events });
		});

		effect(() => {
			const [material, parent] = [this.materialRef().nativeElement, this.parent()];
			if (!parent) return;

			const [resolution, blur, gl] = [this.resolution(), this.blur(), this.gl()];

			// apply the SDF mask once
			if (blur && material.sdf == null) {
				meshPortalMaterialApplySDF(parent, resolution, gl);
			}
		});

		injectBeforeRender(() => {
			const material = this.materialRef().nativeElement;
			const priority =
				'blend' in material && typeof material.blend === 'number' && material.blend > 0
					? Math.max(1, this.renderPriority())
					: 0;

			// If blend is > 0 then the portal is being entered, the render-priority must change
			if (this.priority() !== priority) {
				this.priority.set(priority);
			}
		});
	}
}
