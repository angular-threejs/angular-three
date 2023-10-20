import { effect, untracked, type Injector } from '@angular/core';
import type { RayMode, RayOptions, RayhitEvent } from '@pmndrs/cannon-worker-api';
import { makeId, type NgtAnyRecord } from 'angular-three';
import { injectNgtcPhysicsApi } from 'angular-three-cannon';
import { assertInjector } from 'ngxtension/assert-injector';

export type NgtcRayOptions = {
	options: () => RayOptions;
	callback: (e: RayhitEvent) => void;
	injector?: Injector;
	deps?: () => NgtAnyRecord;
};

export function injectRaycastClosest(opts: NgtcRayOptions) {
	return injectRay('Closest', opts);
}

export function injectRaycastAny(opts: NgtcRayOptions) {
	return injectRay('Any', opts);
}

export function useRaycastAll(opts: NgtcRayOptions) {
	return injectRay('All', opts);
}

function injectRay(mode: RayMode, { options, callback, deps = () => ({}), injector }: NgtcRayOptions) {
	return assertInjector(injectRay, injector, () => {
		const physicsApi = injectNgtcPhysicsApi();
		const [worker, events] = [physicsApi.select('worker'), physicsApi.get('events')];
		const uuid = makeId();

		effect((onCleanup) => {
			deps();
			events[uuid] = { rayhit: callback };
			worker().addRay({ props: { ...untracked(options), mode }, uuid });
			onCleanup(() => {
				worker().removeRay({ uuid });
				delete events[uuid];
			});
		});
	});
}
