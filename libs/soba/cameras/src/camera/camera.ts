import { Directive, effect, Input } from '@angular/core';
import { injectNgtRef, injectNgtStore, signalStore, type NgtCamera } from 'angular-three';
import { injectNgtsFBO } from 'angular-three-soba/misc';

export type NgtsCameraState = {
	makeDefault: boolean;
	manual: boolean;
	frames: number;
	resolution: number;
	envMap?: THREE.Texture;
};

@Directive()
export abstract class NgtsCamera<TCamera extends NgtCamera> {
	protected inputs = signalStore<NgtsCameraState>({
		resolution: 256,
		frames: Infinity,
		makeDefault: false,
		manual: false,
	});

	@Input() set makeDefault(makeDefault: boolean) {
		this.inputs.set({ makeDefault });
	}

	@Input() set manual(manual: boolean) {
		this.inputs.set({ manual });
	}

	@Input() set frames(frames: number) {
		this.inputs.set({ frames });
	}

	@Input() set resolution(resolution: number) {
		this.inputs.set({ resolution });
	}

	@Input() set envMap(envMap: THREE.Texture) {
		this.inputs.set({ envMap });
	}

	@Input() cameraRef = injectNgtRef<TCamera>();

	protected store = injectNgtStore();
	private cameraResolution = this.inputs.select('resolution');
	protected fboRef = injectNgtsFBO(() => ({ width: this.cameraResolution() }));

	constructor() {
		this.setDefaultCamera();
		this.updateProjectionMatrix();
	}

	private setDefaultCamera() {
		const makeDefault = this.inputs.select('makeDefault');
		effect((onCleanup) => {
			const camera = this.cameraRef.nativeElement;
			if (camera && makeDefault()) {
				const { camera: oldCamera } = this.store.get();
				this.store.set({ camera });
				onCleanup(() => this.store.set({ camera: oldCamera }));
			}
		});
	}

	private updateProjectionMatrix() {
		const manual = this.inputs.select('manual');
		effect(() => {
			const camera = this.cameraRef.nativeElement;
			if (!manual() && camera) camera.updateProjectionMatrix();
		});
	}
}
