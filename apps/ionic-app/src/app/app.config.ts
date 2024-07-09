import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { appRoutes } from './app.routes';

export const appConfig: ApplicationConfig = {
	providers: [provideRouter(appRoutes), importProvidersFrom(IonicModule.forRoot())],
};
