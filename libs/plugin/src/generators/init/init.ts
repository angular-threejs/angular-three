import {
	addDependenciesToPackageJson,
	generateFiles,
	getProjects,
	logger,
	ProjectConfiguration,
	readJson,
	Tree,
	updateJson,
} from '@nx/devkit';
import { prompt } from 'enquirer';
import { dirname, join, relative } from 'node:path';
import {
	ArrayLiteralExpression,
	CallExpression,
	Node,
	NoSubstitutionTemplateLiteral,
	ObjectLiteralExpression,
	Project,
	PropertyAssignment,
	ScriptKind,
	StringLiteral,
	SyntaxKind,
} from 'ts-morph';
import { addMetadataJson } from '../../utils';
import { ANGULAR_THREE_VERSION, NGXTENSION_VERSION, THREE_TYPE_VERSION, THREE_VERSION } from '../../versions';
import { finishSetup, handleAppConfig, stopSetup } from './utils';

export interface InitGeneratorSchema {
	sceneGraph: 'append' | 'replace' | 'generate-only' | 'none';
}

// TODO: (chau) add tests when there are better testing strategy for prompt
export async function initGenerator(tree: Tree, options: InitGeneratorSchema) {
	logger.log('[NGT] Initializing Angular Three...');

	const packageJson = readJson(tree, 'package.json');

	let version = packageJson['dependencies']?.['angular-three'] || packageJson['devDependencies']?.['angular-three'];

	if (version) {
		logger.info(`[NGT] Angular Three is already installed: ${version}.`);
		return;
	}

	addDependenciesToPackageJson(
		tree,
		{ 'angular-three': ANGULAR_THREE_VERSION, three: THREE_VERSION, ngxtension: NGXTENSION_VERSION },
		{ '@types/three': THREE_TYPE_VERSION },
	);

	logger.info('[NGT] Turning on skipLibCheck...');

	const baseTsConfigPath = tree.exists('tsconfig.base.json') ? 'tsconfig.base.json' : 'tsconfig.json';

	updateJson(tree, baseTsConfigPath, (json) => {
		if (!('skipLibCheck' in json.compilerOptions) || json.compilerOptions?.skipLibCheck === false) {
			json.compilerOptions.skipLibCheck = true;
		}
		return json;
	});

	addMetadataJson(tree, 'angular-three/metadata.json');

	const tsProject = new Project({
		useInMemoryFileSystem: true,
		skipAddingFilesFromTsConfig: true,
		skipLoadingLibFiles: true,
	});

	const projects = getProjects(tree);
	const applications: Record<string, ProjectConfiguration> = {};

	for (const [projectName, project] of projects.entries()) {
		if (!project.sourceRoot || project.projectType !== 'application') continue;
		applications[project.name || projectName] = project;
	}

	const { appName } = await prompt<{ appName: string }>({
		type: 'select',
		message: 'Which application to continue with the set up?',
		name: 'appName',
		choices: Object.keys(applications),
	});

	const app = applications[appName];
	const mainTsPath = join(app.sourceRoot, 'main.ts');
	if (!tree.exists(mainTsPath)) {
		logger.info(`[NGT] Could not locate main.ts for ${app}`);
		return await stopSetup(tree, `Could not locate main.ts for ${app}`);
	}

	const mainTsContent = tree.read(mainTsPath, 'utf8');

	if (!mainTsContent.includes('bootstrapApplication')) {
		return await stopSetup(tree, `Could not locate bootstrapApplication in ${mainTsPath}`);
	}

	const mainSourceFile = tsProject.createSourceFile(mainTsPath, mainTsContent, {
		overwrite: true,
		scriptKind: ScriptKind.TS,
	});

	const expressionStatement = mainSourceFile.getStatement((statement) => Node.isExpressionStatement(statement));
	let maybeBootstrapCall = expressionStatement.getExpression();

	let foundBootstrapCall = false;
	while (!foundBootstrapCall) {
		const expression =
			'getExpression' in maybeBootstrapCall && typeof maybeBootstrapCall['getExpression'] === 'function'
				? maybeBootstrapCall.getExpression()
				: null;

		if (!expression) {
			return await stopSetup(tree, `Could not locate bootstrapApplication in ${mainTsPath}`);
		}

		if (
			Node.isCallExpression(maybeBootstrapCall) &&
			Node.isIdentifier(expression) &&
			expression.getText() === 'bootstrapApplication'
		) {
			foundBootstrapCall = true;
			break;
		}

		maybeBootstrapCall = expression;
	}

	const bootstrapCall = maybeBootstrapCall as CallExpression;
	const [_, configArgument] = bootstrapCall.getArguments();

	if (!configArgument) {
		return await stopSetup(tree, `Could not locate config argument for bootstrapApplication in ${mainTsPath}`);
	}

	// if configArgument is a external ApplicationConfig
	if (Node.isIdentifier(configArgument)) {
		if (configArgument.getText() !== 'appConfig') {
			return await stopSetup(
				tree,
				`Non-default config in ${mainTsPath} as second argument to bootstrapApplication is not appConfig. Please add "provideNgtRenderer()" to your bootstrapApplication configuration`,
			);
		}

		// find the appConfig import
		const appConfigImport = mainSourceFile.getImportDeclaration((importDeclaration) => {
			return importDeclaration.getModuleSpecifierValue() === './app/app.config';
		});

		if (!appConfigImport) {
			return await stopSetup(
				tree,
				`Non-default config in ${mainTsPath} as external config import path is not ./app/app.config. Please add "provideNgtRenderer()" to your bootstrapApplication configuration`,
			);
		}

		const appConfigPath = join(app.sourceRoot, 'app', 'app.config.ts');
		if (!tree.exists(appConfigPath)) {
			return await stopSetup(tree, `Could not locate app.config.ts for ${app}`);
		}

		const appConfigContent = tree.read(appConfigPath, 'utf8');
		const appConfigSourceFile = tsProject.createSourceFile(appConfigPath, appConfigContent, {
			overwrite: true,
			scriptKind: ScriptKind.TS,
		});
		const appConfigVariable = appConfigSourceFile.getVariableDeclaration('appConfig');
		if (!appConfigVariable) {
			return await stopSetup(tree, `Could not locate appConfig variable in ${appConfigPath}`);
		}

		const configObject = appConfigVariable.getInitializer();
		if (!configObject || !Node.isObjectLiteralExpression(configObject)) {
			return await stopSetup(tree, `Could not locate appConfig object in ${appConfigPath}`);
		}

		const endSetup = await handleAppConfig(tree, configObject, appConfigSourceFile);
		if (endSetup) {
			return await endSetup();
		}
		tree.write(appConfigPath, appConfigSourceFile.getFullText());
	}

	if (Node.isObjectLiteralExpression(configArgument)) {
		const endSetup = await handleAppConfig(tree, configArgument, mainSourceFile);
		if (endSetup) {
			return await endSetup();
		}
		tree.write(mainTsPath, mainSourceFile.getFullText());
	}

	if (options.sceneGraph === 'none') {
		return await finishSetup(tree);
	}

	const { path: sceneGraphPath } = await prompt<{ path: string }>({
		type: 'input',
		name: 'path',
		message: `Where to generate the SceneGraph component (from ${app.sourceRoot}) ?`,
		result(value) {
			if (value.endsWith('.ts')) {
				value = value.slice(0, -3);
			}
			return join(app.sourceRoot, value);
		},
		validate(value) {
			if (tree.exists(value + '.ts')) {
				return `${value}.ts already exists.`;
			}
			return true;
		},
	});

	generateFiles(tree, join(__dirname, 'files'), sceneGraphPath, { tmpl: '' });

	if (options.sceneGraph === 'generate-only') {
		return await finishSetup(tree);
	}

	const { componentPath } = await prompt<{ componentPath: string }>({
		type: 'input',
		message: `Enter the path to the component (from ${app.sourceRoot})`,
		name: 'componentPath',
		validate(value) {
			const fullPath = join(app.sourceRoot, value);
			if (!value.endsWith('.ts') || !tree.exists(fullPath)) {
				return `[NGT] Please use the path to the component TS file.`;
			}
			return true;
		},
		result(value) {
			return join(app.sourceRoot, value);
		},
	});

	const componentContent = tree.read(componentPath, 'utf-8');
	const componentSourceFile = tsProject.createSourceFile(componentPath, componentContent, {
		overwrite: true,
		scriptKind: ScriptKind.TS,
	});

	const decorators = componentSourceFile.getDescendantsOfKind(SyntaxKind.Decorator);
	const componentDecorators = decorators.filter((decorator) => decorator.getName() === 'Component');
	if (componentDecorators.length !== 1) {
		return await stopSetup(tree, `There are no Component or more than one Component in ${componentPath}`);
	}

	// standalone is true or not exist
	const isStandalone = componentContent.includes(`standalone: true`) || !componentContent.includes('standalone');
	if (!isStandalone) {
		return await stopSetup(tree, `Component at ${componentPath} must be a standalone component.`);
	}

	const componentDecorator = componentDecorators[0];
	const componentMetadata = componentDecorator.getArguments()[0] as ObjectLiteralExpression;

	const templateUrlMetadata = componentMetadata.getFirstDescendant((node): node is PropertyAssignment => {
		return Node.isPropertyAssignment(node) && node.getName() === 'templateUrl';
	});

	if (templateUrlMetadata) {
		const templateUrl = (
			templateUrlMetadata.getInitializer() as StringLiteral | NoSubstitutionTemplateLiteral
		).getLiteralValue?.();

		if (!templateUrl) {
			return await stopSetup(tree, `Could not locate templateUrl in ${componentPath}`);
		}

		const templateUrlPath = join(dirname(componentPath), templateUrl);
		const templateContent = tree.read(templateUrlPath, 'utf8');

		tree.write(
			templateUrlPath,
			`${options.sceneGraph === 'append' ? templateContent : ''}
<ngt-canvas>
  <app-scene-graph *canvasContent />
</ngt-canvas>`,
		);
	} else {
		const templateMetadata = componentMetadata.getFirstDescendant((node): node is PropertyAssignment => {
			return Node.isPropertyAssignment(node) && node.getName() === 'template';
		});

		const template = templateMetadata.getInitializer() as NoSubstitutionTemplateLiteral;
		template.setLiteralValue(`
${options.sceneGraph === 'append' ? template.getLiteralValue() : ''}
<ngt-canvas>
  <app-scene-graph *canvasContent />
</ngt-canvas>
`);
	}

	// update import statements
	let relativeSceneGraphPath = relative(dirname(componentPath), join(sceneGraphPath, 'scene-graph'));
	if (!relativeSceneGraphPath.startsWith('.')) {
		relativeSceneGraphPath = `./${relativeSceneGraphPath}`;
	}
	componentSourceFile.addImportDeclarations([
		{ moduleSpecifier: 'angular-three/dom', namedImports: ['NgtCanvas'] },
		{ moduleSpecifier: relativeSceneGraphPath, namedImports: ['SceneGraph'] },
	]);

	// update imports array
	const importsMetadata = componentMetadata.getFirstDescendant((node): node is PropertyAssignment => {
		return Node.isPropertyAssignment(node) && node.getName() === 'imports';
	});

	if (importsMetadata) {
		const currentImportsExpression = importsMetadata.getInitializer() as ArrayLiteralExpression;
		currentImportsExpression.addElements(['NgtCanvas', 'SceneGraph']);
	} else {
		componentMetadata.addPropertyAssignment({
			name: 'imports',
			initializer: `[NgtCanvas, SceneGraph]`,
		});
	}

	await componentSourceFile.save();
	tree.write(componentPath, componentSourceFile.getFullText());
	return await finishSetup(tree);
}

export default initGenerator;
