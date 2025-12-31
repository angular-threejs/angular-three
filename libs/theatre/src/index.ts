/**
 * Angular Three Theatre.js integration library
 *
 * This library provides Angular components and directives for integrating
 * Theatre.js animation toolkit with Angular Three applications.
 *
 * @packageDocumentation
 */

export * from './lib/project';
export * from './lib/sheet-object';
export * from './lib/studio/studio';

export * from './lib/sequence';
export { TheatreSheet as TheatreSheetImpl } from './lib/sheet';

import { TheatreSequence } from './lib/sequence';
import { TheatreSheet as Impl } from './lib/sheet';

/**
 * Combined array of TheatreSheet and TheatreSequence directives for convenient importing.
 *
 * @example
 * ```typescript
 * import { TheatreSheet } from 'angular-three-theatre';
 *
 * @Component({
 *   imports: [TheatreSheet],
 *   template: `<ng-container sheet="mySheet" sequence />`
 * })
 * export class MyComponent {}
 * ```
 */
export const TheatreSheet = [Impl, TheatreSequence] as const;
