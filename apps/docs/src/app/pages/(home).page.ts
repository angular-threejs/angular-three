import { Component } from '@angular/core';

import { AnalogWelcomeComponent } from './analog-welcome.component';

@Component({
	selector: 'docs-home',
	standalone: true,
	imports: [AnalogWelcomeComponent],
	template: `
		<docs-analog-welcome />
	`,
})
export default class HomeComponent {}
