import { Tree } from '@nx/devkit';
import { GenerateNGT } from './utils/generate-ngt';

export interface GltfGeneratorSchema {
	modelPath: string;
	output: string;
	className: string;
	selectorPrefix: string;
	draco: boolean;
	bones: boolean;
	meta: boolean;
	shadows: boolean;
	precision: number;
	console: boolean;
	instance: boolean;
	instanceAll: boolean;
	resolution: number;
	keepMeshes: boolean;
	keepMaterials: boolean;
	keepAttributes: boolean;
	format: string;
	simplify: boolean;
	ratio: number;
	error: number;
	verbose: boolean;
}

export async function gltfGenerator(tree: Tree, options: GltfGeneratorSchema) {
	const { loadGLTF, AnalyzedGLTF, gltfTransform, Log, allPruneStrategies } = await import('@rosskevin/gltfjsx');

	const gltf = await loadGLTF('');

	const analyzed = new AnalyzedGLTF(
		gltf,
		{
			log: new Log({ debug: options.verbose, silent: false }),
			bones: options.bones,
			meta: options.meta,
			shadows: options.shadows,
			instance: options.instance,
			instanceall: options.instanceAll,
			keepgroups: false,
			keepnames: true,
			precision: options.precision,
		},
		allPruneStrategies,
	);

	const generateNGT = new GenerateNGT(analyzed, options);

	const test = await generateNGT.print(analyzed.gltf.scene);

	// await formatFiles(tree);
}

export default gltfGenerator;
