import { Directive, Input } from '@angular/core';
import { NgtInjectedRef } from '../di/ref';
import { NgtCommonDirective } from './common';

@Directive({ selector: '[parent]', standalone: true })
export class NgtParent extends NgtCommonDirective {
    #injectedParent: string | THREE.Object3D | NgtInjectedRef<THREE.Object3D> = null!;

    @Input() set parent(parent: string | THREE.Object3D | NgtInjectedRef<THREE.Object3D>) {
        if (!parent) return;
        this.injected = false;
        this.#injectedParent = parent;
        this.createView();
    }

    get parent() {
        if (this.validate()) {
            this.injected = true;
            return this.#injectedParent;
        }
        return null!;
    }

    validate(): boolean {
        return !this.injected && !!this.#injectedParent;
    }
}
