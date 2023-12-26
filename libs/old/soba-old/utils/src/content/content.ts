import { Directive, Injector, TemplateRef, inject } from '@angular/core';

@Directive({ selector: 'ng-template[ngtsSobaContent]', standalone: true, exportAs: 'sobaContent' })
export class NgtsSobaContent {
	injector = inject(Injector);
	template = inject(TemplateRef);
}
