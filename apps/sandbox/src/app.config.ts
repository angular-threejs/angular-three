import { provideFileRouter } from '@analogjs/router';
import { ApplicationConfig } from '@angular/core';
import { provideClientHydration } from '@angular/platform-browser';

export const appConfig: ApplicationConfig = {
    providers: [provideFileRouter(), provideClientHydration()],
};
