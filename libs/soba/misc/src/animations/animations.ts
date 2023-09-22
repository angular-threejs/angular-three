import { Injector, computed, effect, runInInjectionContext } from '@angular/core';
import { injectBeforeRender, injectNgtRef, type NgtRef } from 'angular-three';
import { assertInjector } from 'ngxtension/assert-injector';
import * as THREE from 'three';

export function injectNgtsAnimations(
	animationsFactory: () => THREE.AnimationClip[],
	{
		ref,
		injector,
		playFirstClip = true,
	}: { ref?: NgtRef<THREE.Object3D>; playFirstClip?: boolean; injector?: Injector } = {},
) {
	injector = assertInjector(injectNgtsAnimations, injector);

	const mixer = new THREE.AnimationMixer(null!);
	const actions = {} as Record<string, THREE.AnimationAction>;
	let cached = {} as Record<string, THREE.AnimationAction>;
	let object: THREE.Object3D | null = null;
	const names = [] as string[];
	const clips = [] as THREE.AnimationClip[];

	return runInInjectionContext(injector, () => {
		let actualRef = injectNgtRef<THREE.Object3D>();

		if (ref) {
			if (ref instanceof THREE.Object3D) {
				actualRef.nativeElement = ref;
			} else {
				actualRef = ref;
			}
		}

		injectBeforeRender(({ delta }) => mixer.update(delta));

		const ready = computed(() => !!actualRef.nativeElement && !!animationsFactory().length);

		effect((onCleanup) => {
			const actual = actualRef.nativeElement;
			if (!actual) return;
			object = actual;
			const animations = animationsFactory();

			for (let i = 0; i < animations.length; i++) {
				const clip = animations[i];

				names.push(clip.name);
				clips.push(clip);

				Object.defineProperty(actions, clip.name, {
					enumerable: true,
					get: () => {
						return cached[clip.name] || (cached[clip.name] = mixer.clipAction(clip, actual));
					},
				});

				if (i === 0 && playFirstClip) {
					actions[clip.name].play();
				}
			}

			onCleanup(() => {
				// clear cached
				cached = {};
				// stop all actions
				mixer.stopAllAction();
				// uncache actions
				Object.values(actions).forEach((action) => {
					mixer.uncacheAction(action as unknown as THREE.AnimationClip, object!);
				});

				object = null;
			});
		});

		return { ref: actualRef, actions, mixer, names, clips, ready };
	});
}
