import { Directive } from '@angular/core';
import * as THREE from 'three';

/**
 * A structural directive that provides type-safe access to camera render textures.
 *
 * This directive is used with `ng-template` to receive the rendered texture from
 * camera components like `NgtsCubeCamera`, `NgtsPerspectiveCamera`, or `NgtsOrthographicCamera`.
 *
 * @example
 * ```html
 * <ngts-cube-camera>
 *   <ng-template cameraContent let-texture>
 *     <ngt-mesh>
 *       <ngt-mesh-standard-material [envMap]="texture" />
 *     </ngt-mesh>
 *   </ng-template>
 * </ngts-cube-camera>
 * ```
 */
@Directive({ selector: 'ng-template[cameraContent]' })
export class NgtsCameraContent {
	/**
	 * Type guard that ensures the template context contains a THREE.Texture.
	 *
	 * @param _ - The directive instance (unused)
	 * @param ctx - The template context to check
	 * @returns True, narrowing the context type to `{ $implicit: THREE.Texture }`
	 */
	static ngTemplateContextGuard(_: NgtsCameraContent, ctx: unknown): ctx is { $implicit: THREE.Texture } {
		return true;
	}
}
