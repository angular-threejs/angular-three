import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
	selector: 'platform-core',
	standalone: true,
	imports: [CommonModule],
	templateUrl: './core.component.html',
	styleUrls: ['./core.component.css'],
})
export class CoreComponent {}
