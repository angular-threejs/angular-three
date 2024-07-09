import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';

@Component({
	selector: 'platform-root',
	standalone: true,
	imports: [CommonModule, IonicModule],
	template: `
		<ion-app>
			<ion-router-outlet></ion-router-outlet>
		</ion-app>
	`,
	styles: ``,
})
export class AppComponent {}
