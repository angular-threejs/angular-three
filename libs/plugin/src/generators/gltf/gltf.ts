import { formatFiles, generateFiles, names, Tree } from '@nx/devkit';
import { dirname, join, relative, resolve } from 'node:path';
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
	transform: boolean;
	degrade: string;
	degradeResolution: number;
	resolution: number;
	keepMeshes: boolean;
	keepMaterials: boolean;
	keepAttributes: boolean;
	keepNames: boolean;
	keepGroups: boolean;
	format: 'jpeg' | 'png' | 'webp' | 'avif';
	simplify: boolean;
	ratio: number;
	error: number;
	header: string;
	verbose: boolean;
}

// @ts-expect-error - type only import
function normalizeOptions(tree: Tree, options: GltfGeneratorSchema, gltfJsx: typeof import('@rosskevin/gltfjsx')) {
	const { Log } = gltfJsx;

	const { fileName, className } = names(options.className);
	const log = new Log({ debug: options.verbose, silent: false });

	const gltfJsxOptions = {
		log,
		bones: options.bones,
		meta: options.meta,
		shadows: options.shadows,
		instance: options.instance,
		instanceall: options.instanceAll,
		keepgroups: options.keepGroups,
		keepnames: options.keepNames,
		precision: options.precision,
	};

	const transformOptions = {
		format: options.format,
		degrade: options.degrade,
		degraderesolution: options.degradeResolution,
		simplify: options.simplify ? { ratio: options.ratio, error: options.error } : false,
		keepattributes: options.keepAttributes,
		keepmeshes: options.keepMeshes,
		keepmaterials: options.keepMaterials,
		resolution: options.resolution,
	};

	const modelPathFromRoot = join(tree.root, options.modelPath);
	const outputDir = dirname(options.output);

	const injectGLTFOptions =
		options.transform && options.draco != null
			? `{ useDraco: ${options.draco} }`
			: options.transform
				? '{ useDraco: true }'
				: '';

	const selector = `${options.selectorPrefix}-${fileName}`;

	const gltfAnimationTypeName = className + 'AnimationClips';
	const gltfAnimationApiTypeName = className + 'AnimationApi';
	const gltfName = className + 'GLTF';
	const gltfResultTypeName = gltfName + 'GLTFResult';

	return {
		log,
		selector,
		fileName,
		className,
		gltfJsxOptions,
		transformOptions,
		modelPathFromRoot,
		outputDir,
		injectGLTFOptions,
		gltfAnimationTypeName,
		gltfAnimationApiTypeName,
		gltfName,
		gltfResultTypeName,
	};
}

export async function gltfGenerator(tree: Tree, options: GltfGeneratorSchema) {
	const gltfjsx = await import('@rosskevin/gltfjsx');
	const { loadGLTF, AnalyzedGLTF, gltfTransform, compareFileSizes } = gltfjsx;

	const {
		selector,
		className,
		fileName,
		modelPathFromRoot,
		log,
		gltfJsxOptions,
		transformOptions,
		outputDir,
		injectGLTFOptions,
		gltfAnimationTypeName,
		gltfAnimationApiTypeName,
		gltfName,
		gltfResultTypeName,
	} = normalizeOptions(tree, options, gltfjsx);

	//
	// Transform the GLTF file if necessary using gltf-transform
	//
	let size = '';
	let transformedModelPath: string | undefined = undefined;
	let dracoLoader: import('node-three-gltf').DRACOLoader | undefined = undefined; // global instance, instantiate once, dispose once

	if (options.transform) {
		transformedModelPath = resolve(modelPathFromRoot + '-transformed.glb');
		await gltfTransform(modelPathFromRoot, transformedModelPath, Object.assign(transformOptions, gltfJsxOptions));
		size = compareFileSizes(modelPathFromRoot, transformedModelPath);

		log.debug('Instantiating DracoLoader');
		const { DRACOLoader } = await import('node-three-gltf');
		dracoLoader = new DRACOLoader();
	}

	const modelPath = transformedModelPath || modelPathFromRoot;

	//
	// Read the model
	//
	log.debug('Loading model: ', modelPath);

	try {
		const gltf = await loadGLTF(modelPath, dracoLoader);
		const analyzed = new AnalyzedGLTF(gltf, gltfJsxOptions);
		const generateNGT = new GenerateNGT(analyzed, gltfjsx, options);

		const scene = generateNGT.generate();
		const generateOptions = generateNGT.getGenerateOptions();

		let gltfPath =
			!transformedModelPath && modelPath.startsWith('http') ? modelPath : relative(outputDir, modelPath);

		if (!gltfPath.startsWith('http') && !gltfPath.startsWith('.')) {
			gltfPath = `./${gltfPath}`;
		}

		generateFiles(tree, join(__dirname, 'files'), outputDir, {
			tmpl: '',
			...generateOptions,
			scene,
			fileName,
			className,
			selector,
			animations: analyzed.gltf.animations || [],
			useImportAttribute: !modelPath.startsWith('http'),
			preload: true,
			gltfName,
			gltfAnimationTypeName,
			gltfAnimationApiTypeName,
			gltfResultTypeName,
			gltfPath,
			gltfOptions: injectGLTFOptions,
			header: options.header,
			size,
		});

		if (options.console) {
			const outputPath = join(outputDir, `${fileName}.ts`);
			const outputContent = tree.read(outputPath, 'utf8');
			console.log(outputContent);
			tree.delete(outputPath);
		}
	} catch (err) {
		log.error(err);
		dracoLoader?.dispose();
		return process.exit(1);
	} finally {
		log.debug('Disposing of DracoLoader');
		dracoLoader?.dispose();
	}

	await formatFiles(tree);
}

export default gltfGenerator;
