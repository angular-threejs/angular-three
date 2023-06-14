import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
    selector: 'ngt-core',
    standalone: true,
    imports: [CommonModule],
    template: `<p>core works!</p>`,
    styles: [],
})
export class CoreComponent {}
