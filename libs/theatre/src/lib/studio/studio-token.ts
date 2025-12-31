import { InjectionToken, Signal } from '@angular/core';
import type { IStudio } from '@theatre/studio';

/**
 * Injection token for accessing the Theatre.js Studio instance.
 *
 * The studio provides a visual editor for creating and editing animations.
 * This token is provided by the TheatreStudio directive and can be injected
 * into child components.
 *
 * @example
 * ```typescript
 * import { THEATRE_STUDIO } from 'angular-three-theatre';
 *
 * @Component({...})
 * export class MyComponent {
 *   private studio = inject(THEATRE_STUDIO, { optional: true });
 *
 *   selectObject() {
 *     this.studio()?.setSelection([mySheetObject]);
 *   }
 * }
 * ```
 */
export const THEATRE_STUDIO = new InjectionToken<Signal<IStudio>>('Theatre Studio');
