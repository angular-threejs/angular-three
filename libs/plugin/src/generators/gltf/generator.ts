import { formatFiles, logger, names, readJson, readProjectConfiguration, Tree, workspaceRoot } from '@nx/devkit';
import { prompt } from 'enquirer';
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
		const injectGLTF = await import('angular-three-soba/loaders').then((m) => m.injectGLTF);

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

		injectGLTF.preload(() => runtimeGltfPath, {
			useDraco: draco,
			useMeshOpt: meshopt,
			onLoad: (data) => {
				console.log('data', data);
			},
		});

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
