import '@analogjs/vitest-angular/setup-zone';
// vitest-webgl-canvas-mock is incompatible with Vitest 4.0 (cannot reassign global.window)
// Import the mock setup directly instead
import mockWindow from 'vitest-webgl-canvas-mock/src/window.js';
mockWindow(window);

import { getTestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';

getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
