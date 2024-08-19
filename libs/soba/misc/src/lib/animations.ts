import { computed, effect, ElementRef, Injector, isSignal, signal, untracked } from '@angular/core';
import { injectBeforeRender, resolveRef } from 'angular-three';
import { assertInjector } from 'ngxtension/assert-injector';
import { AnimationAction, AnimationClip, AnimationMixer, Object3D } from 'three';

type NgtsAnimationApi<T extends AnimationClip> = {
	clips: AnimationClip[];
	mixer: AnimationMixer;
	names: T['name'][];
	actions: { [key in T['name']]: AnimationAction | null };
};

export type NgtsAnimation<TAnimation extends AnimationClip = AnimationClip> =
	| TAnimation[]
	| { animations: TAnimation[] };

/**
 * Use afterNextRender
 */
export function injectAnimations<TAnimation extends AnimationClip>(
	animations: () => NgtsAnimation<TAnimation> | undefined | null,
	object: ElementRef<Object3D> | Object3D | (() => ElementRef<Object3D> | Object3D | undefined | null),
	{ injector }: { injector?: Injector } = {},
) {
	return assertInjector(injectAnimations, injector, () => {
		const mixer = new AnimationMixer(null!);
		injectBeforeRender(({ delta }) => {
			if (!mixer.getRoot()) return;
			mixer.update(delta);
		});

		let cached = {} as Record<string, AnimationAction>;
		const actions = {} as NgtsAnimationApi<TAnimation>['actions'];
		const clips = [] as NgtsAnimationApi<TAnimation>['clips'];
		const names = [] as NgtsAnimationApi<TAnimation>['names'];

		const actualObject = computed(() => {
			if (isSignal(object) || typeof object === 'function') {
				return resolveRef(object());
			}

			return resolveRef(object);
		});

		const ready = signal(false);

		effect((onCleanup) => {
			const obj = actualObject() as Object3D | undefined;
			if (!obj) return;
			Object.assign(mixer, { _root: obj });

			const maybeAnimationClips = animations();
			if (!maybeAnimationClips) return;

			const animationClips = Array.isArray(maybeAnimationClips) ? maybeAnimationClips : maybeAnimationClips.animations;

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

			untracked(() => {
				if (!ready()) {
					ready.set(true);
				}
			});

			onCleanup(() => {
				// clear cached
				cached = {};
				// stop all actions
				mixer.stopAllAction();
				// uncache actions
				Object.values(actions).forEach((action) => {
					mixer.uncacheAction(action as AnimationClip, obj);
				});
			});
		});

		return { clips, mixer, actions, names, ready };
	});
}
