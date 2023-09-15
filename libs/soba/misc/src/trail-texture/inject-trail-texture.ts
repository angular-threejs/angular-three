import { Injector, computed, runInInjectionContext } from '@angular/core';
import { injectBeforeRender, type NgtThreeEvent } from 'angular-three';
import { assertInjector } from 'ngxtension/assert-injector';
import { TrailTexture, type TrailConfig } from './trail-texture';

export function injectNgtsTrailTexture(
	trailConfigFn: () => Partial<TrailConfig>,
	{ injector }: { injector?: Injector } = {},
) {
	injector = assertInjector(injectNgtsTrailTexture, injector);
	return runInInjectionContext(injector, () => {
		const config = computed(() => trailConfigFn() || {});
		const trail = computed(() => new TrailTexture(config()));
		const texture = computed(() => trail().texture);

		injectBeforeRender(({ delta }) => {
			trail().update(delta);
		});

		const onMove = (ev: NgtThreeEvent<PointerEvent>) => trail().addTouch(ev.uv!);

		return { texture, onMove };
	});
}
