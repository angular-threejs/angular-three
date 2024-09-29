import { computed, effect, ElementRef, Injector, isSignal, Signal, signal, untracked } from '@angular/core';
import { injectBeforeRender, resolveRef } from 'angular-three';
import { assertInjector } from 'ngxtension/assert-injector';
import { AnimationAction, AnimationClip, AnimationMixer, Object3D } from 'three';

type NgtsAnimationApi<T extends string> = {
	clips: AnimationClip[];
	mixer: AnimationMixer;
	names: T[];
	actions: { [key in T]: AnimationAction | null };
};

export type NgtsAnimation = AnimationClip[] | { animations: AnimationClip[] };

/**
 * Use afterNextRender
 */
export function injectAnimations<TAnimations extends string>(
	animations: () => NgtsAnimation | undefined | null,
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
		const actions = {} as NgtsAnimationApi<TAnimations>['actions'];
		const clips = [] as NgtsAnimationApi<TAnimations>['clips'];
		const names = [] as NgtsAnimationApi<TAnimations>['names'];

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

				names.push(clip.name as TAnimations);
				clips.push(clip);

				if (!actions[clip.name as TAnimations]) {
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

		return { clips, mixer, actions, names, ready } as NgtsAnimationApi<TAnimations> & { ready: Signal<boolean> };
	});
}
