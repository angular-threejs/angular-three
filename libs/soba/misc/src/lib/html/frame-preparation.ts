import type { NgtState, SignalState } from 'angular-three';

interface HTMLFramePreparation {
	references: number;
	unsubscribe: () => void;
}

const framePreparations = new WeakMap<SignalState<NgtState>, HTMLFramePreparation>();

/**
 * Installs one scene/camera matrix preparation callback per store, regardless of
 * how many HTML labels consume it.
 */
export function acquireHTMLFramePreparation(store: SignalState<NgtState>) {
	let preparation = framePreparations.get(store);
	if (!preparation) {
		preparation = {
			references: 0,
			unsubscribe: store.snapshot.internal.subscribe(
				({ scene, camera }) => {
					scene.updateWorldMatrix(true, true);
					camera.updateWorldMatrix(true, false);
				},
				0,
				store,
			),
		};
		framePreparations.set(store, preparation);
	}

	preparation.references++;
	let released = false;
	return () => {
		if (released) return;
		released = true;

		const current = framePreparations.get(store);
		if (!current || --current.references > 0) return;
		current.unsubscribe();
		framePreparations.delete(store);
	};
}
