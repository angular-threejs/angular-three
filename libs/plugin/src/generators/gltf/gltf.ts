import { formatFiles, generateFiles, names, Tree } from '@nx/devkit';
import { dirname, join, relative, resolve } from 'node:path';
import { GenerateNGT } from './generate-ngt';

/**
 * Schema options for the GLTF generator.
 */
export interface GltfGeneratorSchema {
	/** Path to the GLTF/GLB model file */
	modelPath: string;
	/** Output path for the generated component */
	output: string;
	/** Name for the generated component class */
	className: string;
	/** Prefix for the component selector */
	selectorPrefix: string;
	/** Whether to use DracoLoader for compressed models */
	draco: boolean;
	/** Whether to layout bones declaratively */
	bones: boolean;
	/** Whether to include metadata as userData */
	meta: boolean;
	/** Whether meshes should cast and receive shadows */
	shadows: boolean;
	/** Number of fractional digits for numeric values */
	precision: number;
	/** Whether to print output to console instead of file */
	console: boolean;
	/** Whether to instance re-occurring geometry */
	instance: boolean;
	/** Whether to instance every geometry */
	instanceAll: boolean;
	/** Whether to transform meshes via gltf-transform */
	transform: boolean;
	/** Degrade meshes via gltf-transform */
	degrade: string;
	/** Resolution for mesh degradation */
	degradeResolution: number;
	/** Resolution for texture resizing */
	resolution: number;
	/** Whether to keep meshes separate (don't join) */
	keepMeshes: boolean;
	/** Whether to keep materials separate (don't palette join) */
	keepMaterials: boolean;
	/** Whether to keep unused vertex attributes */
	keepAttributes: boolean;
	/** Whether to keep object names */
	keepNames: boolean;
	/** Whether to keep groups */
	keepGroups: boolean;
	/** Texture format for transformed models */
	format: 'jpeg' | 'png' | 'webp' | 'avif';
	/** Whether to simplify meshes */
	simplify: boolean;
	/** Simplifier ratio */
	ratio: number;
	/** Simplifier error threshold */
	error: number;
	/** Custom header to add to generated file */
	header: string;
	/** Whether to enable verbose logging */
	verbose: boolean;
}

/**
 * Normalizes and processes generator options into a format suitable for gltfjsx.
 *
 * @param tree - The Nx virtual file system tree
 * @param options - Raw generator options
 * @param gltfJsx - The gltfjsx library module
 * @returns Normalized options including paths, names, and configuration objects
 */
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

/**
 * Generates an Angular component from a GLTF/GLB 3D model file.
 *
 * This generator uses gltfjsx to analyze the model and creates a fully-typed
 * Angular component with:
 * - Proper Three.js type definitions for nodes, materials, and bones
 * - Animation support with typed animation clips and API
 * - Optional mesh transformation and optimization via gltf-transform
 * - Draco compression support
 * - Shadow casting/receiving configuration
 *
 * @param tree - The Nx virtual file system tree
 * @param options - Generator options for model processing and output
 *
 * @example
 * ```bash
 * nx g angular-three-plugin:gltf --modelPath=src/assets/model.glb --output=src/app/model.ts
 * nx g angular-three-plugin:gltf path/to/model.gltf --output=src/app/model.ts --transform --shadows
 * ```
 */
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

		generateFiles(
			tree,
			join(__dirname, 'files'),
			outputDir,
			Object.assign(generateOptions, {
				tmpl: '',
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
			}),
		);

		await formatFiles(tree);

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
}

export default gltfGenerator;
