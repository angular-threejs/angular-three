import { TheatreSheetObject as Impl } from './sheet-object';
import { TheatreSheetObjectSync } from './sync';
import { TheatreSheetObjectTransform } from './transform';

export { TheatreSheetObject as TheatreSheetObjectImpl } from './sheet-object';
export * from './sync';
export * from './transform';

/**
 * Combined array of sheet object directives for convenient importing.
 *
 * Includes:
 * - `TheatreSheetObject` - Base directive for creating sheet objects
 * - `TheatreSheetObjectTransform` - Component for animating transform properties
 * - `TheatreSheetObjectSync` - Directive for syncing arbitrary object properties
 *
 * @example
 * ```typescript
 * import { TheatreSheetObject } from 'angular-three-theatre';
 *
 * @Component({
 *   imports: [TheatreSheetObject],
 *   template: `
 *     <ng-template sheetObject="myObject">
 *       <theatre-transform>
 *         <ngt-mesh />
 *       </theatre-transform>
 *     </ng-template>
 *   `
 * })
 * export class MyComponent {}
 * ```
 */
export const TheatreSheetObject = [Impl, TheatreSheetObjectTransform, TheatreSheetObjectSync];
