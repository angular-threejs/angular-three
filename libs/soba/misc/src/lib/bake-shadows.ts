import { Directive } from '@angular/core';
import { injectStore } from 'angular-three';
import { injectAutoEffect } from 'ngxtension/auto-effect';

@Directive({ standalone: true, selector: 'ngts-bake-shadows' })
export class NgtsBakeShadows {
	constructor() {
		const autoEffect = injectAutoEffect();
		const store = injectStore();
		const gl = store.select('gl');
		autoEffect(() => {
			const _gl = gl();
			_gl.shadowMap.autoUpdate = false;
			_gl.shadowMap.needsUpdate = true;
			return () => {
				_gl.shadowMap.autoUpdate = _gl.shadowMap.needsUpdate = true;
			};
		});
	}
}
