import { SceneGraph as BasicSceneGraph } from '../basic/scene';
import { SceneGraph as BrunoSceneGraph } from '../bruno-simons-20k/scene';
import { SceneGraph as InstancedVertexColorsSceneGraph } from '../instanced-vertex-colors/scene';
import { SceneGraph as LodSceneGraph } from '../lod/scene';
import { SceneGraph as LowpolyEarthSceneGraph } from '../lowpoly-earth/scene';
import { SceneGraph as ShakySceneGraph } from '../shaky/scene';
import { SceneGraph as StarsSceneGraph } from '../stars/scene';

export const Scenes = {
	basic: BasicSceneGraph,
	instancedVertexColors: InstancedVertexColorsSceneGraph,
	lowpolyEarth: LowpolyEarthSceneGraph,
	shaky: ShakySceneGraph,
	stars: StarsSceneGraph,
	lod: LodSceneGraph,
	bruno: BrunoSceneGraph,
} as const;
