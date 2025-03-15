import { InjectionToken, Signal } from '@angular/core';
import type { IStudio } from '@theatre/studio';

export const THEATRE_STUDIO = new InjectionToken<Signal<IStudio>>('Theatre Studio');
