import { formatFiles, generateFiles, names, Tree } from '@nx/devkit';
import { dirname, join } from 'node:path';
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
	keepNames: boolean;
	keepGroups: boolean;
	format: string;
	simplify: boolean;
	ratio: number;
	error: number;
	verbose: boolean;
}

export async function gltfGenerator(tree: Tree, options: GltfGeneratorSchema) {
	const { loadGLTF, AnalyzedGLTF, gltfTransform, Log, allPruneStrategies } = await import('@rosskevin/gltfjsx');

	const modelPath = join(tree.root, options.modelPath);

	const gltf = await loadGLTF(modelPath);

	const analyzed = new AnalyzedGLTF(
		gltf,
		{
			log: new Log({ debug: options.verbose, silent: false }),
			bones: options.bones,
			meta: options.meta,
			shadows: options.shadows,
			instance: options.instance,
			instanceall: options.instanceAll,
			keepgroups: options.keepGroups,
			keepnames: options.keepNames,
			precision: options.precision,
		},
		allPruneStrategies,
	);

	const generateNGT = new GenerateNGT(analyzed, options);

	const scene = await generateNGT.generate();

	const args = generateNGT.args;
	const perspective = generateNGT.ngtTypes.has('PerspectiveCamera');
	const orthographic = generateNGT.ngtTypes.has('OrthographicCamera');

	const { className, fileName } = names(options.className);
	const gltfExtras = analyzed.gltf.parser.json.asset && analyzed.gltf.parser.json.asset.extras;
	const extras = gltfExtras
		? Object.keys(gltfExtras)
				.map((key) => `${key.charAt(0).toUpperCase() + key.slice(1)}: ${gltfExtras[key]}`)
				.join('\n')
		: '';

	const ngtTypesArr = Array.from(generateNGT.ngtTypes).filter(
		(t) =>
			// group always is the top-level object
			t !== 'Group' &&
			// we render ngts-perspective-camera instead of ngt-perspective-camera
			t !== 'PerspectiveCamera' &&
			// we render ngts-orthographic-camera instead of ngt-orthographic-camera
			t !== 'OrthographicCamera' &&
			// we don't render ngt-bone
			t !== 'Bone' &&
			// we don't render ngt-object3D
			t !== 'Object3D',
	);
	const threeImports = ngtTypesArr.length ? `, ${ngtTypesArr.join(',')}` : '';
	const gltfAnimationTypeName = className + 'AnimationClips';
	const gltfAnimationApiTypeName = className + 'AnimationApi';
	const gltfName = className + 'GLTF';
	const gltfResultTypeName = gltfName + 'GLTFResult';

	const angularImports = [];

	if (args) {
		angularImports.push('NgtArgs');
	}

	if (perspective) {
		angularImports.push('NgtsPerspectiveCamera');
	}

	if (perspective) {
		angularImports.push('NgtsOrthographicCamera');
	}

	const gltfOptions = options.draco ? `{ useDraco: true }` : '';
	const meshes = analyzed.getMeshes();
	const bones = analyzed.getBones();
	const materials = analyzed.getMaterials();

	generateFiles(tree, join(__dirname, 'files'), dirname(options.output), {
		tmpl: '',
		scene,
		fileName,
		className,
		selector: `${options.selectorPrefix}-${fileName}`,
		animations: analyzed.gltf.animations || [],
		extras,
		threeImports,
		args,
		perspective,
		orthographic,
		useImportAttribute: !modelPath.startsWith('http'),
		preload: true,
		gltfName,
		gltfAnimationTypeName,
		gltfAnimationApiTypeName,
		gltfResultTypeName,
		url: modelPath,
		gltfOptions,
		meshes,
		bones,
		materials,
	});

	await formatFiles(tree);
}

export default gltfGenerator;
