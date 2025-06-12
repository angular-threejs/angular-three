import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideNgtRenderer } from 'angular-three/dom';
import { appRoutes } from './app.routes';

export const appConfig: ApplicationConfig = {
	providers: [
		provideZonelessChangeDetection(),
		provideRouter(appRoutes, withComponentInputBinding()),
		provideNgtRenderer(),
	],
};
