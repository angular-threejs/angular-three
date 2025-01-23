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
	getInstanceState,
	injectBeforeRender,
	injectStore,
	is,
	NgtAttachable,
	NgtComputeFunction,
	NgtThreeElements,
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
import * as THREE from 'three';
import { FullScreenQuad } from 'three-stdlib';

/**
 * This directive is used inside of the render texture, hence has access to the render texture store (a portal store)
 */
@Directive({ selector: 'ngts-manage-portal-scene' })
export class ManagePortalScene {
	events = input<boolean>();
	rootScene = input.required<THREE.Scene>();
	material = input.required<NgtMeshPortalMaterial>();
	priority = input.required<number>();
	worldUnits = input.required<boolean>();

	constructor() {
		const injector = inject(Injector);
		const renderTextureStore = injectStore();

		const buffer1 = injectFBO();
		const buffer2 = injectFBO();

		const fullScreenQuad = computed(() => {
			// This fullscreen-quad is used to blend the two textures
			const blend = { value: 0 };
			const quad = new FullScreenQuad(
				new THREE.ShaderMaterial({
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
			renderTextureStore.scene().matrixAutoUpdate = false;
		});

		effect(() => {
			const [events, setEvents] = [this.events(), renderTextureStore.setEvents()];
			if (!events) return;
			setEvents({ enabled: events });
		});

		effect((onCleanup) => {
			const priority = this.priority();

			// we start the before render in effect because we need the priority input to be resolved
			const sub = injectBeforeRender(
				({ gl, camera }) => {
					const material = this.material();

					const instanceState = getInstanceState(material);
					if (!instanceState) return;

					const parent = instanceState.parent();
					if (!parent) return;

					const materialBlend = 'blend' in material && typeof material.blend === 'number' ? material.blend : 0;
					const [worldUnits, rootScene, scene, [quad, blend]] = [
						this.worldUnits(),
						this.rootScene(),
						renderTextureStore.snapshot.scene,
						fullScreenQuad(),
					];
					// Move portal contents along with the parent if worldUnits is true
					if (!worldUnits) {
						// If the portal renders exclusively the original scene needs to be updated
						if (priority && materialBlend === 1) parent['updateWorldMatrix'](true, false);
						scene.matrixWorld.copy(parent['matrixWorld']);
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

export interface NgtsMeshPortalMaterialOptions extends Partial<NgtThreeElements['ngt-shader-material']> {
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
					compute: renderTextureCompute,
				}"
			>
				<ng-template renderTextureContent let-injector="injector">
					<ng-container [ngTemplateOutlet]="content()" [ngTemplateOutletInjector]="injector" />
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
	protected parameters = omit(this.options, [
		'blur',
		'resolution',
		'worldUnits',
		'eventPriority',
		'renderPriority',
		'events',
	]);

	protected blur = pick(this.options, 'blur');
	protected eventPriority = pick(this.options, 'eventPriority');
	protected renderPriority = pick(this.options, 'renderPriority');
	protected events = pick(this.options, 'events');
	protected worldUnits = pick(this.options, 'worldUnits');

	materialRef = viewChild.required<ElementRef<InstanceType<typeof MeshPortalMaterial>>>('material');
	protected content = contentChild.required(TemplateRef);

	private store = injectStore();
	protected rootScene = this.store.scene;

	protected materialResolution = computed(() => [
		this.store.size.width() * this.store.viewport.dpr(),
		this.store.size.height() * this.store.viewport.dpr(),
	]);
	private resolution = pick(this.options, 'resolution');

	private parent = signal<THREE.Mesh | null>(null);
	private visible = injectIntersect(this.parent, { source: signal(true) });

	protected renderTextureFrames = computed(() => (this.visible() ? Infinity : 0));

	protected renderTextureCompute = (...args: Parameters<NgtComputeFunction>) => {
		const [parent, material] = [this.parent(), this.materialRef().nativeElement];
		if (!parent) return false;

		const [event, state] = args;

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

	protected priority = signal(0);

	constructor() {
		extend({ MeshPortalMaterial });

		effect(() => {
			const material = this.materialRef().nativeElement;

			const instanceState = getInstanceState(material);
			if (!instanceState) return;

			const materialParent = instanceState.parent();
			if (!materialParent || !is.three<THREE.Mesh>(materialParent, 'isMesh')) return;

			// Since the ref above is not tied to a mesh directly (we're inside a material),
			// it has to be tied to the parent mesh here
			this.parent.set(materialParent);
		});

		effect(() => {
			const events = this.events();
			if (!events) return;

			const setEvents = this.store.setEvents();
			setEvents({ enabled: !events });
		});

		effect(() => {
			const [material, parent] = [this.materialRef().nativeElement, this.parent()];
			if (!parent) return;

			const [resolution, blur, gl] = [this.resolution(), this.blur(), this.store.gl()];

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
