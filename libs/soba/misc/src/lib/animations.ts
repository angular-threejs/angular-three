import { computed, DestroyRef, ElementRef, inject, Injector, isSignal } from '@angular/core';
import { beforeRender, resolveRef } from 'angular-three';
import { assertInjector } from 'ngxtension/assert-injector';
import * as THREE from 'three';

/**
 * Animation clip type with flexible name typing.
 * Allows consumers to pass in type-safe animation clips with custom name types.
 * @internal
 */
type NgtsAnimationClipWithoutName = Omit<THREE.AnimationClip, 'name'> & { name: any };

/**
 * Extended animation clip type with proper clone signature.
 * Wraps THREE.AnimationClip with modified name and clone types for type safety.
 */
export type NgtsAnimationClip = Omit<NgtsAnimationClipWithoutName, 'clone'> & { clone: () => NgtsAnimationClip };

/**
 * Type helper for creating a union of animation clips with specific names.
 * Useful for type-safe access to animations by name.
 *
 * @typeParam TAnimationNames - Union of animation name strings
 */
export type NgtsAnimationClips<TAnimationNames extends string> = {
	[Name in TAnimationNames]: Omit<NgtsAnimationClip, 'name'> & { name: Name };
}[TAnimationNames];

/**
 * API returned by the `animations` function.
 * Provides access to clips, mixer, action map, and ready state.
 *
 * @typeParam T - The animation clip type
 */
export type NgtsAnimationApi<T extends NgtsAnimationClip> = {
	/** Array of all animation clips */
	clips: T[];
	/** The THREE.AnimationMixer instance managing all animations */
	mixer: THREE.AnimationMixer;
	/** Array of animation names for easy iteration */
	names: T['name'][];
} & (
	| {
			/**
			 * Whether the animations have finished initializing.
			 * When `true`, the `actions` property is available.
			 */
			get isReady(): true;
			/** Map of animation names to their corresponding AnimationAction instances */
			actions: { [key in T['name']]: THREE.AnimationAction };
	  }
	| {
			/**
			 * Whether the animations have finished initializing.
			 * When `false`, the `actions` property is not yet available.
			 */
			get isReady(): false;
	  }
);

/**
 * Input type for the `animations` function.
 * Accepts either an array of clips or an object with an `animations` property.
 *
 * @typeParam TAnimation - The animation clip type
 */
export type NgtsAnimation<TAnimation extends NgtsAnimationClip = NgtsAnimationClip> =
	| TAnimation[]
	| { animations: TAnimation[] };

/**
 * Creates an animation API for managing THREE.js animation clips on an object.
 *
 * Sets up an AnimationMixer, processes animation clips, and provides a reactive
 * API for controlling animations. The mixer is automatically updated each frame
 * and cleaned up on destroy.
 *
 * @param animationsFactory - Signal of animation clips or object with animations
 * @param object - The Object3D to attach animations to (or ref/factory returning one)
 * @param options - Optional configuration
 * @param options.injector - Custom injector for dependency injection context
 * @returns Animation API with clips, mixer, actions, and ready state
 *
 * @example
 * ```typescript
 * const gltf = injectGLTF(() => 'model.glb');
 * const api = animations(
 *   () => gltf()?.animations,
 *   () => gltf()?.scene
 * );
 *
 * effect(() => {
 *   if (api.isReady) {
 *     api.actions['walk'].play();
 *   }
 * });
 * ```
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
 * @deprecated Use `animations` instead. Will be removed in v5.0.0.
 * @since v4.0.0
 * @see animations
 */
export const injectAnimations = animations;
