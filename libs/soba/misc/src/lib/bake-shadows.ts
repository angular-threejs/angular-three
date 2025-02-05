import { Directive, effect } from '@angular/core';
import { injectStore } from 'angular-three';

@Directive({ selector: 'ngts-bake-shadows' })
export class NgtsBakeShadows {
	constructor() {
		const store = injectStore();
		const gl = store.select('gl');
		effect((onCleanup) => {
			const _gl = gl();
			_gl.shadowMap.autoUpdate = false;
			_gl.shadowMap.needsUpdate = true;
			onCleanup(() => {
				_gl.shadowMap.autoUpdate = _gl.shadowMap.needsUpdate = true;
			});
		});
	}
}
