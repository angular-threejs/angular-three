import { provideFileRouter } from '@analogjs/router';
import { ApplicationConfig } from '@angular/core';
import { provideClientHydration } from '@angular/platform-browser';
import { withComponentInputBinding } from '@angular/router';

export const appConfig: ApplicationConfig = {
    providers: [provideFileRouter(withComponentInputBinding()), provideClientHydration()],
};
