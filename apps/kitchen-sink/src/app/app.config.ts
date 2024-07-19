import { ApplicationConfig, provideExperimentalZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { appRoutes } from './app.routes';

export const appConfig: ApplicationConfig = {
	providers: [
		provideExperimentalZonelessChangeDetection(),
		// provideZoneChangeDetection({ eventCoalescing: true, runCoalescing: true }),
		provideRouter(appRoutes),
	],
};
