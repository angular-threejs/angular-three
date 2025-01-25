import { Basic } from './basic/basic';
import { ClusterExample } from './cluster/cluster';
import { InstancedMeshExample } from './instanced-mesh/instanced-mesh';
import { JointsExample } from './joints/joints';
import { PerformanceExample } from './performance/performance';
import { RopeJointExample } from './rope-joint/rope-joint';
import { SpringExample } from './spring/spring';

export const SCENES_MAP = {
	basic: Basic,
	instancedMesh: InstancedMeshExample,
	performance: PerformanceExample,
	joints: JointsExample,
	cluster: ClusterExample,
	ropeJoint: RopeJointExample,
	spring: SpringExample,
} as const;
