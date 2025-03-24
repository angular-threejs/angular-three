import { computed, DestroyRef, ElementRef, inject, Injector, isSignal } from '@angular/core';
import { beforeRender, resolveRef } from 'angular-three';
import { assertInjector } from 'ngxtension/assert-injector';
import * as THREE from 'three';

/**
 * name: any to allow consumers to pass in type-safe animation clips
 */
type NgtsAnimationClipWithoutName = Omit<THREE.AnimationClip, 'name'> & { name: any };
export type NgtsAnimationClip = Omit<NgtsAnimationClipWithoutName, 'clone'> & { clone: () => NgtsAnimationClip };
export type NgtsAnimationClips<TAnimationNames extends string> = {
	[Name in TAnimationNames]: Omit<NgtsAnimationClip, 'name'> & { name: Name };
}[TAnimationNames];
export type NgtsAnimationApi<T extends NgtsAnimationClip> = {
	clips: T[];
	mixer: THREE.AnimationMixer;
	names: T['name'][];
} & (
	| {
			/**
			 * Whether or not the animations finishes initialized
			 */
			get isReady(): true;
			actions: { [key in T['name']]: THREE.AnimationAction };
	  }
	| {
			/**
			 * Whether or not the animations finishes initialized
			 */
			get isReady(): false;
	  }
);

export type NgtsAnimation<TAnimation extends NgtsAnimationClip = NgtsAnimationClip> =
	| TAnimation[]
	| { animations: TAnimation[] };

/**
 * Use afterNextRender
 */
export function animations<TAnimation extends NgtsAnimationClip>(
	animationsFactory: () => NgtsAnimation<TAnimation> | undefined | null,
	object:
		| ElementRef<THREE.Object3D>
		| THREE.Object3D
		| (() => ElementRef<THREE.Object3D> | THREE.Object3D | undefined | null),
	{ injector }: { injector?: Injector } = {},
): NgtsAnimationApi<TAnimation> {
	return assertInjector(animations, injector, () => {
		const mixer = new THREE.AnimationMixer(null!);
		beforeRender(({ delta }) => {
			if (!mixer.getRoot()) return;
			mixer.update(delta);
		});

		let cached = {} as Record<string, THREE.AnimationAction>;
		const actions = {} as { [key in TAnimation['name']]: THREE.AnimationAction };
		const clips = [] as NgtsAnimationApi<TAnimation>['clips'];
		const names = [] as NgtsAnimationApi<TAnimation>['names'];

		const actualObject = computed(() =>
			isSignal(object) || typeof object === 'function' ? resolveRef(object()) : resolveRef(object),
		);

		const isReady = computed(() => {
			const obj = actualObject() as THREE.Object3D | undefined;
			if (!obj) return false;

			Object.assign(mixer, { _root: obj });

			const maybeAnimationClips = animationsFactory();
			if (!maybeAnimationClips) return;

			const animationClips = Array.isArray(maybeAnimationClips)
				? maybeAnimationClips
				: maybeAnimationClips.animations;

			for (let i = 0; i < animationClips.length; i++) {
				const clip = animationClips[i];

				names.push(clip.name);
				clips.push(clip);

				if (!actions[clip.name as TAnimation['name']]) {
					Object.defineProperty(actions, clip.name, {
						enumerable: true,
						get: () => {
							if (!cached[clip.name]) {
								cached[clip.name] = mixer.clipAction(clip, obj);
							}

							return cached[clip.name];
						},
					});
				}
			}

			return true;
		});

		inject(DestroyRef).onDestroy(() => {
			const obj = actualObject() as THREE.Object3D | undefined;

			// clear cached
			cached = {};
			// stop all actions
			mixer.stopAllAction();
			// uncache actions
			Object.values(actions).forEach((action) => {
				mixer.uncacheAction(action as THREE.AnimationClip, obj);
			});
		});

		return {
			clips,
			mixer,
			actions,
			names,
			get isReady() {
				return isReady();
			},
		} as NgtsAnimationApi<TAnimation>;
	});
}

/**
 * @deprecated use animations instead. Will be removed in v5.0.0
 * @since v4.0.0
 */
export const injectAnimations = animations;
