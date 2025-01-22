import { Directive, effect } from '@angular/core';
import { injectStore } from 'angular-three';

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
