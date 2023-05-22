import { bootstrapApplication } from '@angular/platform-browser';
import 'zone.js';

import { extend } from 'angular-three';
import * as THREE from 'three';
import { appConfig } from './app.config';
import { App } from './app/app';

// add entire THREE namespace to NGT Catalogue
extend(THREE);

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
