import { DestroyRef, Injector, effect, inject, runInInjectionContext } from '@angular/core';
import { assertInjectionContext, injectBeforeRender, injectNgtRef, type NgtInjectedRef } from 'angular-three';
import * as THREE from 'three';

export function injectNgtsAnimations(
    animationsFactory: () => THREE.AnimationClip[],
    { ref, injector }: { ref?: NgtInjectedRef<THREE.Object3D> | THREE.Object3D; injector?: Injector }
) {
    injector = assertInjectionContext(injectNgtsAnimations, injector);
    return runInInjectionContext(injector, () => {
        let actualRef = injectNgtRef<THREE.Object3D>();

        if (ref) {
            if (ref instanceof THREE.Object3D) {
                actualRef.nativeElement = ref;
            } else {
                actualRef = ref;
            }
        }

        const mixer = new THREE.AnimationMixer(null!);
        const actions = {} as Record<string, THREE.AnimationAction>;
        let cached = {} as Record<string, THREE.AnimationAction>;

        const clips = [] as THREE.AnimationClip[];
        const names = [] as string[];

        inject(DestroyRef).onDestroy(() => {
            // clear cached
            cached = {};
            // uncache actions
            Object.values(actions).forEach((action) => {
                mixer.uncacheAction(action as unknown as THREE.AnimationClip, actualRef.untracked);
            });
            // stop all actions
            mixer.stopAllAction();
        });

        injectBeforeRender(({ delta }) => mixer.update(delta));

        requestAnimationFrame(() => {
            effect(
                () => {
                    const actual = actualRef.nativeElement;
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

                        if (i === 0) {
                            actions[clip.name].play();
                        }
                    }
                },
                { injector }
            );
        });

        return { ref: actualRef, actions, mixer, names, clips };
    });
}
