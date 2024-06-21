import { ElementRef, Injector, afterNextRender, computed, isSignal, signal, untracked } from '@angular/core';
import { injectBeforeRender, is } from 'angular-three';
import { assertInjector } from 'ngxtension/assert-injector';
import { injectAutoEffect } from 'ngxtension/auto-effect';
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

export function injectAnimations<TAnimation extends AnimationClip>(
	animations: () => NgtsAnimation<TAnimation> | undefined | null,
	object: ElementRef<Object3D> | Object3D | (() => ElementRef<Object3D> | Object3D | undefined | null),
	{ injector }: { injector?: Injector } = {},
) {
	return assertInjector(injectAnimations, injector, () => {
		const autoEffect = injectAutoEffect();

		const mixer = new AnimationMixer(null!);
		injectBeforeRender(({ delta }) => mixer.update(delta));

		let cached = {} as Record<string, AnimationAction>;
		const actions = {} as NgtsAnimationApi<TAnimation>['actions'];
		const clips = [] as NgtsAnimationApi<TAnimation>['clips'];
		const names = [] as NgtsAnimationApi<TAnimation>['names'];

		const actualObject = computed(() => {
			if (is.ref(object)) {
				return object.nativeElement;
			}

			if (isSignal(object) || typeof object === 'function') {
				const value = object();
				if (is.ref(value)) {
					return value.nativeElement;
				}
				return value;
			}

			return object;
		});

		const ready = signal(false);

		afterNextRender(() => {
			autoEffect(() => {
				const obj = actualObject();
				if (!obj) return;
				Object.assign(mixer, { _root: obj });

				const maybeAnimationClips = animations();
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
								return cached[clip.name] || (cached[clip.name] = mixer.clipAction(clip, obj));
							},
						});
					}
				}

				untracked(() => {
					if (!ready()) {
						ready.set(true);
					}
				});

				return () => {
					// clear cached
					cached = {};
					// stop all actions
					mixer.stopAllAction();
					// uncache actions
					Object.values(actions).forEach((action) => {
						mixer.uncacheAction(action as AnimationClip, obj);
					});
				};
			});
		});

		return { clips, mixer, actions, names, ready };
	});
}
