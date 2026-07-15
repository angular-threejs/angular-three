import {
	ChangeDetectionStrategy,
	Component,
	CUSTOM_ELEMENTS_SCHEMA,
	DestroyRef,
	effect,
	inject,
	input,
} from '@angular/core';
import { NgtArgs } from 'angular-three';
import type { NgteEcctrlAnimationStateValue } from 'angular-three-ecctrl/animation';
import { gltfResource } from 'angular-three-soba/loaders';
import { animations, NgtsAnimationClips } from 'angular-three-soba/misc';
import { AnimationAction, FrontSide, LoopOnce, LoopRepeat, Mesh, MeshStandardMaterial } from 'three';
import type { GLTF } from 'three-stdlib';

// Source: https://github.com/pmndrs/ecctrl/blob/main/public/AnimationLibrary.glb
// Upstream NOTICE credits its animation clips to Quaternius UAL / CC0.
type HumanAnimationName = 'Idle_Loop' | 'Walk_Loop' | 'Jog_Fwd_Loop' | 'Jump_Start' | 'Jump_Loop' | 'Jump_Land';
type HumanGLTF = GLTF & {
	animations: NgtsAnimationClips<HumanAnimationName>[];
	materials: { M_Main: MeshStandardMaterial; M_Joints: MeshStandardMaterial };
};

const ANIMATION_MAP: Record<NgteEcctrlAnimationStateValue, { action: HumanAnimationName; loop: boolean }> = {
	IDLE: { action: 'Idle_Loop', loop: true },
	WALK: { action: 'Walk_Loop', loop: true },
	RUN: { action: 'Jog_Fwd_Loop', loop: true },
	JUMP_START: { action: 'Jump_Start', loop: false },
	JUMP_IDLE: { action: 'Jump_Loop', loop: true },
	JUMP_FALL: { action: 'Jump_Loop', loop: true },
	JUMP_LAND: { action: 'Jump_Land', loop: false },
};

@Component({
	selector: 'app-ecctrl-human-model',
	template: `
		@if (gltf.scene(); as scene) {
			<ngt-group [position]="[0, -0.8, 0]" [dispose]="null">
				<ngt-primitive *args="[scene]" />
			</ngt-group>
		}
	`,
	imports: [NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EcctrlHumanModel {
	state = input.required<NgteEcctrlAnimationStateValue>();
	timeScale = input(1);

	protected readonly gltf = gltfResource<HumanGLTF>(() => '/AnimationLibrary.glb');
	private readonly animation = animations(this.gltf.value, this.gltf.scene);
	private currentActionName: HumanAnimationName | null = null;
	private lockedActionName: HumanAnimationName | null = null;

	constructor() {
		effect(() => {
			const gltf = this.gltf.value();
			if (!gltf) return;

			gltf.materials.M_Main.color.set('#dedede');
			gltf.materials.M_Joints.color.set('#00ffff');
			gltf.materials.M_Main.side = FrontSide;
			gltf.materials.M_Joints.side = FrontSide;
			gltf.materials.M_Main.needsUpdate = true;
			gltf.materials.M_Joints.needsUpdate = true;
			gltf.scene.traverse((object) => {
				if (!(object instanceof Mesh)) return;
				object.castShadow = true;
				object.receiveShadow = true;
			});
		});

		effect(() => {
			this.animation.mixer.timeScale = Math.max(0, this.timeScale());
		});

		effect(() => {
			if (!this.animation.isReady) return;
			const state = this.state();
			if (this.lockedActionName === 'Jump_Land' && (state === 'WALK' || state === 'RUN')) {
				this.lockedActionName = null;
			}
			if (!this.lockedActionName) this.playState(state);
		});

		const onFinished = (event: { action: AnimationAction }) => {
			if (!this.animation.isReady || this.lockedActionName === null) return;
			if (event.action !== this.animation.actions[this.lockedActionName]) return;
			this.lockedActionName = null;
			this.playState(this.state());
		};
		this.animation.mixer.addEventListener('finished', onFinished);
		inject(DestroyRef).onDestroy(() => this.animation.mixer.removeEventListener('finished', onFinished));
	}

	private playState(state: NgteEcctrlAnimationStateValue) {
		if (!this.animation.isReady) return;
		const { action: actionName, loop } = ANIMATION_MAP[state];
		if (actionName === this.currentActionName) return;

		const action = this.animation.actions[actionName];
		const previousAction = this.currentActionName ? this.animation.actions[this.currentActionName] : null;
		const fadeDuration = loop ? 0.2 : 0.1;
		action.reset().setLoop(loop ? LoopRepeat : LoopOnce, loop ? Infinity : 1);
		action.timeScale = loop ? 1 : 1.6;
		action.clampWhenFinished = !loop;
		if (previousAction) action.crossFadeFrom(previousAction, fadeDuration, false);
		else action.fadeIn(fadeDuration);
		action.play();

		this.currentActionName = actionName;
		this.lockedActionName = loop ? null : actionName;
	}
}
