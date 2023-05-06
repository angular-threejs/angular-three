import { Directive, Input } from '@angular/core';
import { NgtCommonDirective } from './common';

@Directive({ selector: '[args]', standalone: true })
export class NgtArgs extends NgtCommonDirective {
    private injectedArgs: any[] = [];

    @Input() set args(args: any[] | null) {
        if (args == null || !Array.isArray(args) || (args.length === 1 && args[0] === null)) return;
        this.injected = false;
        this.injectedArgs = args;
        this.createView();
    }

    get args() {
        if (this.validate()) {
            this.injected = true;
            return this.injectedArgs;
        }
        return null;
    }

    validate() {
        return !this.injected && !!this.injectedArgs.length;
    }
}
