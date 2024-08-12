import { formatFiles, logger, names, readJson, readProjectConfiguration, Tree, workspaceRoot } from '@nx/devkit';
import { prompt } from 'enquirer';
import { readFileSync } from 'node:fs';
import { DRACOLoader, GLTFLoader, MeshoptDecoder } from 'three-stdlib';
import { addSobaGenerator } from '../add-soba/generator';

export interface GltfGeneratorSchema {
	gltfPath: string;
	project: string;
	console: boolean;
	modelName: string;
	meshopt: boolean;
	outputPath?: string;
	draco?: boolean | string;
}

function normalizeOptions(options: GltfGeneratorSchema) {
	let { gltfPath, project, console, modelName, outputPath, draco, meshopt } = options;

	if (draco == null) {
		draco = true;
	}

	return { gltfPath, project, console, modelName, outputPath, draco, meshopt };
}

function buildSelector(fileName: string, prefix: string) {
	return `${prefix}-${fileName}`;
}

function toArrayBuffer(buf: Buffer) {
	const ab = new ArrayBuffer(buf.length);
	const view = new Uint8Array(ab);
	for (let i = 0; i < buf.length; ++i) view[i] = buf[i];
	return ab;
}

let dracoLoader: DRACOLoader | null = null;
let decoderPath = 'https://www.gstatic.com/draco/versioned/decoders/1.5.5/';
const loader = new GLTFLoader();

function load(input: string, draco: boolean | string, meshopt: boolean) {
	if (draco) {
		if (!dracoLoader) {
			dracoLoader = new DRACOLoader();
		}

		dracoLoader.setDecoderPath(typeof draco === 'string' ? draco : decoderPath);
		(loader as GLTFLoader).setDRACOLoader(dracoLoader);
	}

	if (meshopt) {
		(loader as GLTFLoader).setMeshoptDecoder(typeof MeshoptDecoder === 'function' ? MeshoptDecoder() : MeshoptDecoder);
	}

	const data = input.startsWith('http')
		? null
		: (() => {
				const fileContent = readFileSync(input);
				return toArrayBuffer(fileContent);
			})();
	const operationFactory = (onLoad: (data: any) => void, onError: (error: ErrorEvent) => void) => {
		return input.startsWith('http')
			? loader.load.call(loader, input, onLoad, () => {}, onError)
			: loader.parse.call(loader, data, input, onLoad, onError);
	};

	return new Promise((resolve, reject) => {
		operationFactory(resolve, reject);
	});
}

export async function gltfGenerator(tree: Tree, options: GltfGeneratorSchema) {
	const packageJson = readJson(tree, 'package.json');
	const hasAngularThreeSoba =
		packageJson['dependencies']['angular-three-soba'] || packageJson['devDependencies']['angular-three-soba'];

	if (!hasAngularThreeSoba) {
		logger.warn(`[NGT] angular-three-soba must be installed to use the GLTF generator`);
		const { initSoba } = await prompt<{ initSoba: boolean }>({
			type: 'confirm',
			name: 'initSoba',
			message: 'Would you like to initialize angular-three-soba?',
			initial: true,
		});
		if (!initSoba) return;
		await addSobaGenerator(tree);
	}

	try {
		// const injectGLTF = await loadEsmModule<typeof import('angular-three-soba/loaders')>(
		// 	'angular-three-soba/loaders',
		// ).then((m) => m.injectGLTF);
		// // const injectGLTF = await import('angular-three-soba/loaders').then((m) => m.injectGLTF);
		// const injectGLTF = require('angular-three-soba/loaders').injectGLTF;

		const { gltfPath, project, console: toConsole, modelName, outputPath, draco, meshopt } = normalizeOptions(options);

		let runtimeGltfPath: string;

		if (!gltfPath.startsWith('http')) {
			const { path } = await prompt<{ path: string }>({
				type: 'input',
				name: 'path',
				message: 'What is the path to the asset file to be used at runtime (with injectGLTF)?',
				required: true,
			});
			runtimeGltfPath = path;
		} else {
			runtimeGltfPath = gltfPath;
		}

		await load(runtimeGltfPath, draco, meshopt);

		// injectGLTF.preload(() => runtimeGltfPath, {
		// 	useDraco: draco,
		// 	useMeshOpt: meshopt,
		// 	onLoad: (data) => {
		// 		console.log('data', data);
		// 	},
		// });

		const projectConfig = readProjectConfiguration(tree, project);
		const modelNames = names(modelName);
		const tmpPath = `${workspaceRoot}/tmp/ngt-gltf/${modelNames.fileName}`;
		const output = toConsole ? tmpPath : (outputPath ?? (projectConfig.sourceRoot || `${projectConfig.root}/src`));

		// NOTE: even if user passes in "console", we still generate the files.
		//  But we generate them to a temporary destination then we'll remove them printing to console.
		// generateFiles(tree, 'files', output, {
		// 	tmpl: '',
		// 	fileName: modelNames.fileName,
		// 	className: modelNames.className,
		// 	selector: buildSelector(
		// 		modelNames.fileName,
		// 		'prefix' in projectConfig && typeof projectConfig.prefix === 'string' ? projectConfig.prefix : 'app',
		// 	),
		// 	runtimeGltfPath,
		// });

		await formatFiles(tree);

		if (toConsole) {
			// print to console
			// delete the files in tmp
		}
	} catch (e) {
		logger.error(`[NGT] Error generating GLTF files: ${e}`);
	}
}

export default gltfGenerator;
