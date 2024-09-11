export * from './lib/camera-controls';
export * from './lib/orbit-controls';
export * from './lib/scroll-controls';

import {
	NgtsPivotControls as GizmosPivotControls,
	NgtsPivotControlsOptions as GizmosPivotControlsOptions,
} from 'angular-three-soba/gizmos';

/**
 * @deprecated Use `NgtsPivotControls` from `angular-three-soba/gizmos` instead.
 */
export const NgtsPivotControls = GizmosPivotControls;
/**
 * @deprecated Use `NgtsPivotControlsOptions` from `angular-three-soba/gizmos` instead.
 */
export type NgtsPivotControlsOptions = GizmosPivotControlsOptions;
