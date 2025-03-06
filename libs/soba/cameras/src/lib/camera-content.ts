import { Directive } from '@angular/core';
import * as THREE from 'three';

@Directive({ selector: 'ng-template[cameraContent]' })
export class NgtsCameraContent {
	static ngTemplateContextGuard(_: NgtsCameraContent, ctx: unknown): ctx is { $implicit: THREE.Texture } {
		return true;
	}
}
