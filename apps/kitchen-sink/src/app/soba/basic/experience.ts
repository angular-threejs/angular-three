import {
	CUSTOM_ELEMENTS_SCHEMA,
	ChangeDetectionStrategy,
	Component,
	Directive,
	ElementRef,
	Signal,
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
import { injectGLTF } from 'angular-three-soba/loaders';
import { NgtsAnimation, injectAnimations } from 'angular-three-soba/misc';
import { injectMatcapTexture } from 'angular-three-soba/staging';
import { Bone, Group, MeshStandardMaterial, Object3D, SkinnedMesh } from 'three';
import { GLTF } from 'three-stdlib';

export const selectedAction = signal('Strut');
export const bloom = signal(false);
export const glitch = signal(false);

type BotGLTF = GLTF & {
	nodes: { 'Y-Bot': Object3D; YB_Body: SkinnedMesh; YB_Joints: SkinnedMesh; mixamorigHips: Bone };
	materials: { YB_Body: MeshStandardMaterial; YB_Joints: MeshStandardMaterial };
};

@Directive({ selector: '[animations]', standalone: true })
export class BotAnimations {
	animations = input.required<NgtsAnimation>();
	referenceRef = input.required<ElementRef<Object3D> | undefined>();

	constructor() {
		const groupRef = inject<ElementRef<Group>>(ElementRef);
		const host = computed(() => (this.referenceRef() ? groupRef : null));

		// NOTE: the consumer controls the timing of injectAnimations. It's not afterNextRender anymore
		//  but when the reference is resolved which in this particular case, it is the Bone mixamorigHips
		//  that the animations are referring to.
		const animationsApi = injectAnimations(this.animations, host);
		effect((onCleanup) => {
			if (animationsApi.ready()) {
				const actionName = selectedAction();
				// animationsApi.actions[actionName];
				animationsApi.actions[actionName]?.reset().fadeIn(0.5).play();
				onCleanup(() => {
					animationsApi.actions[actionName]?.fadeOut(0.5);
				});
			}
		});
	}
}

@Component({
	selector: 'app-bot',
	standalone: true,
	template: `
		<ngt-group [position]="[0, -1, 0]">
			<ngt-grid-helper *args="[10, 20]" />
			@if (gltf(); as gltf) {
				<ngt-group [dispose]="null" [animations]="gltf" [referenceRef]="boneRef()">
					<ngt-group [rotation]="[Math.PI / 2, 0, 0]" [scale]="0.01">
						<ngt-primitive #bone *args="[gltf.nodes.mixamorigHips]" />
						<ngt-skinned-mesh [geometry]="gltf.nodes.YB_Body.geometry" [skeleton]="gltf.nodes.YB_Body.skeleton">
							<ngt-mesh-matcap-material [matcap]="matcapBody.texture()" />
						</ngt-skinned-mesh>
						<ngt-skinned-mesh [geometry]="gltf.nodes.YB_Joints.geometry" [skeleton]="gltf.nodes.YB_Joints.skeleton">
							<ngt-mesh-matcap-material [matcap]="matcapJoints.texture()" />
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

	protected gltf = injectGLTF(() => './ybot.glb') as Signal<BotGLTF | null>;
	protected matcapBody = injectMatcapTexture(() => '293534_B2BFC5_738289_8A9AA7');
	protected matcapJoints = injectMatcapTexture(() => '3A2412_A78B5F_705434_836C47');

	protected boneRef = viewChild<ElementRef<Bone>>('bone');
}

@Component({
	standalone: true,
	template: `
		<ngt-color *args="['#303030']" attach="background" />
		<ngt-ambient-light [intensity]="0.8" />
		<ngt-point-light [intensity]="Math.PI" [decay]="0" [position]="[0, 6, 0]" />

		<app-bot />

		<ngtp-effect-composer>
			@if (bloom()) {
				<ngtp-bloom [options]="{ kernelSize: 3, luminanceThreshold: 0, luminanceSmoothing: 0.4, intensity: 1.5 }" />
			}

			@if (glitch()) {
				<ngtp-glitch />
			}
		</ngtp-effect-composer>

		<ngts-orbit-controls [options]="{ makeDefault: true, autoRotate: true }" />
	`,
	imports: [NgtsOrbitControls, NgtArgs, Bot, NgtpEffectComposer, NgtpBloom, NgtpGlitch],
	changeDetection: ChangeDetectionStrategy.OnPush,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	host: { class: 'soba-experience' },
})
export class Experience {
	protected Math = Math;
	protected bloom = bloom;
	protected glitch = glitch;
}
