import { bootstrapApplication } from '@angular/platform-browser';
import 'zone.js';

import { extend } from 'angular-three-old';
import * as THREE from 'three';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

extend(THREE);

bootstrapApplication(AppComponent, appConfig).catch((err) => console.error(err));
