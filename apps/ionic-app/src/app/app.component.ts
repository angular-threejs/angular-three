
import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';

@Component({
	selector: 'platform-root',
	imports: [IonicModule],
	template: `
		<ion-app>
			<ion-router-outlet></ion-router-outlet>
		</ion-app>
	`,
	styles: ``,
})
export class AppComponent {}
