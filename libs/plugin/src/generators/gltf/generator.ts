import {
	formatFiles,
	getProjects,
	logger,
	names,
	readJson,
	readProjectConfiguration,
	Tree,
	workspaceRoot,
} from '@nx/devkit';
import { prompt } from 'enquirer';
import { join } from 'node:path';
import { addSobaGenerator } from '../add-soba/generator';
import { parse } from './utils';

export interface GltfGeneratorSchema {
	gltfPath: string;
	console: boolean;
	modelName: string;
	meshopt: boolean;
	outputPath?: string;
	draco?: boolean | string;
}

function normalizeOptions(options: GltfGeneratorSchema) {
	let { gltfPath, console, modelName, outputPath, draco, meshopt } = options;

	if (draco == null) {
		draco = true;
	}

	return { gltfPath, console, modelName, outputPath, draco, meshopt };
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

	const projects = getProjects(tree);
	const applicationProjects = Array.from(projects.entries()).reduce((acc, [projectName, project]) => {
		if (project.projectType === 'application') {
			acc.push(projectName);
		}
		return acc;
	}, [] as string[]);

	let { project } = await prompt<{ project: string }>({
		type: 'select',
		name: 'project',
		message: 'What project would you like to generate the model component for?',
		choices: [...applicationProjects, 'custom'],
		required: true,
	});

	if (project === 'custom') {
		const { projectName } = await prompt<{ projectName: string }>({
			type: 'input',
			name: 'projectName',
			message: 'What is the name of the project to generate the model component for?',
			required: true,
		});
		project = projectName;
	}

	const projectConfig = readProjectConfiguration(tree, project);

	if (!projectConfig) {
		logger.error(`[NGT] ${project} is not a project`);
		return;
	}

	try {
		const { gltfPath, console: toConsole, modelName, outputPath, draco, meshopt } = normalizeOptions(options);

		let runtimeGltfPath: string;

		if (!gltfPath.startsWith('http')) {
			const { path } = await prompt<{ path: string }>({
				type: 'input',
				name: 'path',
				message: 'What is the path to the asset file to be used at runtime with injectGLTF?',
				required: true,
			});
			runtimeGltfPath = path;
		} else {
			runtimeGltfPath = join(workspaceRoot, gltfPath);
		}

		const data = await parse(runtimeGltfPath, draco, meshopt);

		console.log(data);

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
