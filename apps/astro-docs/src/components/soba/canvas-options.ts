import { InjectionToken } from '@angular/core';
import { type NgtPerformance, type NgtSignalStore, signalStore } from 'angular-three';

export interface OrthographicCameraOptions {
	orthographic: true;
	camera: { position?: [number, number, number]; zoom?: number };
}

export interface PerspectiveCameraOptions {
	orthographic: false;
	camera: { position?: [number, number, number]; fov?: number };
}

export type SetupCanvasOptions = {
	performance: Partial<Omit<NgtPerformance, 'regress'>>;
	background: string;
	controls: boolean | { makeDefault?: boolean };
	lights: boolean;
} & (OrthographicCameraOptions | PerspectiveCameraOptions);

export const defaultCanvasOptions: SetupCanvasOptions = {
	camera: { position: [-5, 5, 5], fov: 75 },
	orthographic: false,
	performance: { current: 1, min: 0.5, max: 1, debounce: 200 },
	background: 'black',
	controls: true,
	lights: true,
};

export const CANVAS_OPTIONS = new InjectionToken<NgtSignalStore<SetupCanvasOptions>>('canvas options');

export function provideCanvasOptions() {
	return { provide: CANVAS_OPTIONS, useFactory: () => signalStore<SetupCanvasOptions>(defaultCanvasOptions) };
}
