import { Directive } from '@angular/core';

/**
 * generic content directive for Ngts components
 */
@Directive({ standalone: true, selector: 'ng-template[ngtsContent]' })
export class NgtsContent {}
