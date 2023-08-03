import { Directive, effect } from '@angular/core';
import { injectNgtStore } from 'angular-three';

@Directive({ selector: 'ngts-bake-shadows', standalone: true })
export class NgtsBakeShadows {
	constructor() {
		const store = injectNgtStore();
		const glShadowMap = store.select('gl', 'shadowMap');
		effect((onCleanup) => {
			const shadowMap = glShadowMap();
			shadowMap.autoUpdate = false;
			shadowMap.needsUpdate = true;
			onCleanup(() => {
				shadowMap.autoUpdate = shadowMap.needsUpdate = true;
			});
		});
	}
}
