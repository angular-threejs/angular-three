import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { extend } from 'angular-three';
import * as THREE from 'three';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';

extend(THREE);

bootstrapApplication(AppComponent, { providers: [provideRouter(routes)] }).catch((err) => console.error(err));
