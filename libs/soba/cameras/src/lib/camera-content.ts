import { Directive, Signal } from '@angular/core';
import { Texture } from 'three';

@Directive({ standalone: true, selector: 'ng-template[withTexture]' })
export class NgtsCameraContentWithFboTexture {
	static ngTemplateContextGuard(
		_: NgtsCameraContentWithFboTexture,
		ctx: unknown,
	): ctx is { $implicit: Signal<Texture> } {
		return true;
	}
}
