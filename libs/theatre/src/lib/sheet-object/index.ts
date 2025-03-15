import { TheatreSheetObject as Impl } from './sheet-object';
import { TheatreSheetObjectSync } from './sync';
import { TheatreSheetObjectTransform } from './transform';

export { TheatreSheetObject as TheatreSheetObjectImpl } from './sheet-object';
export * from './sync';
export * from './transform';

export const TheatreSheetObject = [Impl, TheatreSheetObjectTransform, TheatreSheetObjectSync];
