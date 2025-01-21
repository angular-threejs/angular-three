import { Directive, Signal } from '@angular/core';
import * as THREE from 'three';

@Directive({ selector: 'ng-template[cameraContent]' })
export class NgtsCameraContent {
	static ngTemplateContextGuard(_: NgtsCameraContent, ctx: unknown): ctx is { $implicit: Signal<THREE.Texture> } {
		return true;
	}
}
