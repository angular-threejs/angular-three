export * from './lib/project';
export * from './lib/sheet-object';
export * from './lib/studio/studio';

export * from './lib/sequence';
export { TheatreSheet as TheatreSheetImpl } from './lib/sheet';

import { TheatreSequence } from './lib/sequence';
import { TheatreSheet as Impl } from './lib/sheet';

export const TheatreSheet = [Impl, TheatreSequence] as const;
