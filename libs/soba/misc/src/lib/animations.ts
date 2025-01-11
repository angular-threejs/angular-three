import { computed, effect, ElementRef, Injector, isSignal, Signal, signal, untracked } from '@angular/core';
import { injectBeforeRender, resolveRef } from 'angular-three';
import { assertInjector } from 'ngxtension/assert-injector';
import { AnimationAction, AnimationClip, AnimationMixer, Object3D } from 'three';

/**
 * name: any to allow consumers to pass in type-safe animation clips
 */
type NgtsAnimationClipWithoutName = Omit<AnimationClip, 'name'> & { name: any };
export type NgtsAnimationClip = Omit<NgtsAnimationClipWithoutName, 'clone'> & { clone: () => NgtsAnimationClip };
export type NgtsAnimationClips<TAnimationNames extends string> = {
	[Name in TAnimationNames]: Omit<NgtsAnimationClip, 'name'> & { name: Name };
}[TAnimationNames];
export type NgtsAnimationApi<T extends NgtsAnimationClip> = {
	/**
	 * Whether or not the animations finishes initialized
	 *
	 * @deprecated 3.5.0 - use `isReady` getter for better type-narrow instead. Will be removed in 4.0.0
	 */
	ready: Signal<boolean>;
	clips: T[];
	mixer: AnimationMixer;
	names: T['name'][];
} & ({ get isReady(): true; actions: { [key in T['name']]: AnimationAction } } | { get isReady(): false });

export type NgtsAnimation<TAnimation extends NgtsAnimationClip = NgtsAnimationClip> =
	| TAnimation[]
	| { animations: TAnimation[] };

/**
 * Use afterNextRender
 */
export function injectAnimations<TAnimation extends NgtsAnimationClip>(
	animations: () => NgtsAnimation<TAnimation> | undefined | null,
	object: ElementRef<Object3D> | Object3D | (() => ElementRef<Object3D> | Object3D | undefined | null),
	{ injector }: { injector?: Injector } = {},
): NgtsAnimationApi<TAnimation> {
	return assertInjector(injectAnimations, injector, () => {
		const mixer = new AnimationMixer(null!);
		injectBeforeRender(({ delta }) => {
			if (!mixer.getRoot()) return;
			mixer.update(delta);
		});

		let cached = {} as Record<string, AnimationAction>;
		const actions = {} as { [key in TAnimation['name']]: AnimationAction };
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

			if (!untracked(ready)) {
				ready.set(true);
			}

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

		const result = { ready, clips, mixer, actions, names } as unknown as NgtsAnimationApi<TAnimation>;

		Object.defineProperty(result, 'isReady', { get: ready });

		return result;
	});
}
