import { Experience as BasicExperience } from '../basic/experience';
import { Experience as BrunoExperience } from '../bruno-simons-20k/experience';
import { Experience as InstancedVertexColorsExperience } from '../instanced-vertex-colors/experience';
import { Experience as LodExperience } from '../lod/experience';
import { Experience as LowpolyEarthExperience } from '../lowpoly-earth/experience';
import { Experience as ShakyExperience } from '../shaky/experience';
import { Experience as StarsExperience } from '../stars/experience';

export const Scenes = {
	basic: BasicExperience,
	instancedVertexColors: InstancedVertexColorsExperience,
	lowpolyEarth: LowpolyEarthExperience,
	shaky: ShakyExperience,
	stars: StarsExperience,
	lod: LodExperience,
	bruno: BrunoExperience,
} as const;
