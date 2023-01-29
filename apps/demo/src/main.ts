import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { extend } from 'angular-three';
import * as THREE from 'three';
import { OrbitControls } from 'three-stdlib';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';

extend(THREE);
extend({ OrbitControls });

bootstrapApplication(AppComponent, { providers: [provideRouter(routes)] }).catch((err) => console.error(err));
