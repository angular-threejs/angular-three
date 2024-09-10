import { Basic } from './basic/basic';
import { InstancedMeshExample } from './instanced-mesh/instanced-mesh';
import { PerformanceExample } from './performance/performance';

export const SCENES_MAP = {
	basic: Basic,
	instancedMesh: InstancedMeshExample,
	performance: PerformanceExample,
} as const;
