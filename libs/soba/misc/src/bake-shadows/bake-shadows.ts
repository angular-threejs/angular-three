import { Directive, effect, inject } from '@angular/core';
import { NgtStore } from 'angular-three';

@Directive({ selector: 'ngts-bake-shadows', standalone: true })
export class NgtsBakeShadows {
    constructor() {
        const store = inject(NgtStore);
        effect((onCleanup) => {
            const gl = store.select('gl')();
            gl.shadowMap.autoUpdate = false;
            gl.shadowMap.needsUpdate = true;
            onCleanup(() => {
                gl.shadowMap.autoUpdate = gl.shadowMap.needsUpdate = true;
            });
        });
    }
}
