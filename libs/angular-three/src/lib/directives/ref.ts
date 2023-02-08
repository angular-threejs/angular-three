import { Directive, Input } from '@angular/core';
import { NgtInjectedRef } from '../di/ref';
import { NgtCommonDirective } from './common';

@Directive({ selector: '[ref]', standalone: true })
export class NgtRef<T> extends NgtCommonDirective {
    private injectedRef?: NgtInjectedRef<T>;

    @Input() set ref(ref: NgtInjectedRef<T> | null) {
        if (!ref || ref == null) return;
        this.injected = false;
        this.injectedRef = ref;
        this.createView();
    }

    get ref(): NgtInjectedRef<T> | null {
        if (this.validate()) {
            this.injected = true;
            return this.injectedRef as NgtInjectedRef<T>;
        }
        return null;
    }

    override validate(): boolean {
        return !this.injected && !!this.injectedRef && !this.injectedRef.nativeElement;
    }
}
