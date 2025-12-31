import { Directive, effect } from '@angular/core';
import { injectStore } from 'angular-three';

/**
 * Disables automatic shadow map updates for performance optimization.
 *
 * When added to the scene, this directive sets `shadowMap.autoUpdate` to `false`
 * and triggers a single `needsUpdate` to bake the current shadow state. This is
 * useful for static scenes where shadows don't need to update every frame.
 *
 * On cleanup, automatic shadow updates are restored.
 *
 * @example
 * ```html
 * <ngt-group>
 *   <ngts-bake-shadows />
 *   <!-- static meshes with shadows -->
 * </ngt-group>
 * ```
 */
@Directive({ selector: 'ngts-bake-shadows' })
export class NgtsBakeShadows {
	constructor() {
		const store = injectStore();
		effect((onCleanup) => {
			const gl = store.gl();
			gl.shadowMap.autoUpdate = false;
			gl.shadowMap.needsUpdate = true;
			onCleanup(() => {
				gl.shadowMap.autoUpdate = gl.shadowMap.needsUpdate = true;
			});
		});
	}
}
