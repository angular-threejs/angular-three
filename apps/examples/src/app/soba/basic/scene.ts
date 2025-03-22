import {
	CUSTOM_ELEMENTS_SCHEMA,
	ChangeDetectionStrategy,
	Component,
	Directive,
	ElementRef,
	booleanAttribute,
	computed,
	effect,
	inject,
	input,
	signal,
	viewChild,
} from '@angular/core';
import { NgtArgs } from 'angular-three';
import { NgtpBloom, NgtpEffectComposer, NgtpGlitch } from 'angular-three-postprocessing';
import { NgtsOrbitControls } from 'angular-three-soba/controls';
import { gltfResource } from 'angular-three-soba/loaders';
import { NgtsAnimation, animations } from 'angular-three-soba/misc';
import { matcapTextureResource } from 'angular-three-soba/staging';
import {
	TweakpaneCheckbox,
	TweakpaneColor,
	TweakpaneFolder,
	TweakpaneList,
	TweakpaneNumber,
	TweakpanePane,
} from 'angular-three-tweakpane';
import { Bone, Group, MeshStandardMaterial, Object3D, SRGBColorSpace, SkinnedMesh } from 'three';
import { GLTF } from 'three-stdlib';

export const selectedAction = signal('Strut');
export const bloom = signal(false);
export const glitch = signal(false);

type BotGLTF = GLTF & {
	nodes: { 'Y-Bot': Object3D; YB_Body: SkinnedMesh; YB_Joints: SkinnedMesh; mixamorigHips: Bone };
	materials: { YB_Body: MeshStandardMaterial; YB_Joints: MeshStandardMaterial };
};

@Directive({ selector: '[animations]' })
export class BotAnimations {
	animations = input.required<NgtsAnimation>();
	referenceRef = input.required<ElementRef<Object3D> | undefined>();

	constructor() {
		const groupRef = inject<ElementRef<Group>>(ElementRef);
		const host = computed(() => (this.referenceRef() ? groupRef : null));

		// NOTE: the consumer controls the timing of injectAnimations. It's not afterNextRender anymore
		//  but when the reference is resolved which in this particular case, it is the Bone mixamorigHips
		//  that the animations are referring to.
		const animationsApi = animations(this.animations, host);
		effect((onCleanup) => {
			if (animationsApi.isReady) {
				const actionName = selectedAction();
				animationsApi.actions[actionName].reset().fadeIn(0.5).play();
				onCleanup(() => {
					animationsApi.actions[actionName].fadeOut(0.5);
				});
			}
		});
	}
}

@Component({
	selector: 'app-bot',
	template: `
		<ngt-group [position]="[0, -1, 0]">
			<ngt-grid-helper *args="[10, 20]" />
			@if (gltf.value(); as gltf) {
				<ngt-group [dispose]="null" [animations]="gltf" [referenceRef]="boneRef()">
					<ngt-group [rotation]="[Math.PI / 2, 0, 0]" [scale]="0.01">
						<ngt-primitive #bone *args="[gltf.nodes.mixamorigHips]" />
						<ngt-skinned-mesh
							[geometry]="gltf.nodes.YB_Body.geometry"
							[skeleton]="gltf.nodes.YB_Body.skeleton"
						>
							<ngt-mesh-matcap-material [matcap]="matcapBody.resource.value()" />
						</ngt-skinned-mesh>
						<ngt-skinned-mesh
							[geometry]="gltf.nodes.YB_Joints.geometry"
							[skeleton]="gltf.nodes.YB_Joints.skeleton"
						>
							<ngt-mesh-matcap-material [matcap]="matcapJoints.resource.value()" />
						</ngt-skinned-mesh>
					</ngt-group>
				</ngt-group>
			}
		</ngt-group>
	`,
	imports: [NgtArgs, BotAnimations],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Bot {
	protected Math = Math;

	protected gltf = gltfResource<BotGLTF>(() => './ybot.glb');
	protected matcapBody = matcapTextureResource(() => '293534_B2BFC5_738289_8A9AA7', {
		onLoad: (texture) => (texture.colorSpace = SRGBColorSpace),
	});
	protected matcapJoints = matcapTextureResource(() => '3A2412_A78B5F_705434_836C47', {
		onLoad: (texture) => (texture.colorSpace = SRGBColorSpace),
	});

	protected boneRef = viewChild<ElementRef<Bone>>('bone');
}

@Component({
	selector: 'app-basic-scene-graph',
	template: `
		<ngt-color *args="[backgroundColor()]" attach="background" />
		<ngt-ambient-light [intensity]="0.8" />
		<ngt-point-light [intensity]="Math.PI" [decay]="0" [position]="[0, 6, 0]" />

		<app-bot />

		@if (!asRenderTexture()) {
			<ngtp-effect-composer>
				@if (bloom()) {
					<ngtp-bloom
						[options]="{
							kernelSize: 3,
							luminanceThreshold: luminanceThreshold(),
							luminanceSmoothing: luminanceSmoothing(),
							intensity: intensity(),
						}"
					/>
				}

				@if (glitch()) {
					<ngtp-glitch />
				}
			</ngtp-effect-composer>

			<ngts-orbit-controls [options]="{ makeDefault: true, autoRotate: true }" />

			<tweakpane-pane title="Soba Basic">
				<tweakpane-folder title="Bloom">
					<tweakpane-checkbox [(value)]="bloom" label="Enabled" />
					<tweakpane-number
						[(value)]="luminanceThreshold"
						label="luminanceThreshold"
						[params]="{ min: 0, max: 1, step: 0.01 }"
					/>
					<tweakpane-number
						[(value)]="luminanceSmoothing"
						label="luminanceSmoothing"
						[params]="{ min: 0, max: 1, step: 0.01 }"
					/>
					<tweakpane-number
						[(value)]="intensity"
						label="bloomIntensity"
						[params]="{ min: 0, max: 10, step: 0.5 }"
					/>
				</tweakpane-folder>
				<tweakpane-folder title="Glitch">
					<tweakpane-checkbox [(value)]="glitch" label="Enabled" />
				</tweakpane-folder>

				<tweakpane-list [(value)]="selectedAction" [options]="['Strut', 'Dance', 'Idle']" label="Animation" />
				<tweakpane-color [(value)]="backgroundColor" label="Background" />
			</tweakpane-pane>
		}
	`,
	imports: [
		NgtsOrbitControls,
		NgtArgs,
		Bot,
		NgtpEffectComposer,
		NgtpBloom,
		NgtpGlitch,
		TweakpanePane,
		TweakpaneFolder,
		TweakpaneCheckbox,
		TweakpaneList,
		TweakpaneColor,
		TweakpaneNumber,
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	host: { class: 'soba-experience' },
})
export class SceneGraph {
	protected Math = Math;
	protected bloom = bloom;
	protected glitch = glitch;
	protected selectedAction = selectedAction;

	protected backgroundColor = signal('#303030');

	protected luminanceThreshold = signal(0);
	protected luminanceSmoothing = signal(0.4);
	protected intensity = signal(1.5);

	asRenderTexture = input(false, { transform: booleanAttribute });
}
