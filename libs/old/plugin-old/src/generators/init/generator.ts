import {
	addDependenciesToPackageJson,
	generateFiles,
	installPackagesTask,
	logger,
	readJson,
	readProjectConfiguration,
	updateJson,
	type Tree,
} from '@nx/devkit';
import { tsquery } from '@phenomnomnominal/tsquery';
import { prompt } from 'enquirer';
import { join } from 'node:path';
import { ArrayLiteralExpression, NoSubstitutionTemplateLiteral } from 'typescript';
import { addMetadataJson } from '../utils';
import { ANGULAR_THREE_VERSION, NGXTENSION_VERSION, THREE_TYPE_VERSION, THREE_VERSION } from '../versions';

type Schema = {
	project?: string;
};

export default async function (tree: Tree, { project }: Schema) {
	logger.log('Initializing Angular Three...');

	const packageJson = readJson(tree, 'package.json');

	const version =
		packageJson['dependencies']?.['angular-three'] ||
		packageJson['devDependencies']?.['angular-three'] ||
		ANGULAR_THREE_VERSION;

	addDependenciesToPackageJson(
		tree,
		{ 'angular-three': version, three: THREE_VERSION, ngxtension: NGXTENSION_VERSION },
		{ '@types/three': THREE_TYPE_VERSION },
	);

	logger.info('Turning on skipLibCheck...');
	const tsConfigPath = tree.exists('tsconfig.base.json') ? 'tsconfig.base.json' : 'tsconfig.json';

	updateJson(tree, tsConfigPath, (json) => {
		if (!('skipLibCheck' in json.compilerOptions) || json.compilerOptions?.skipLibCheck === false) {
			json.compilerOptions.skipLibCheck = true;
		}
		return json;
	});

	addMetadataJson(tree, 'angular-three/metadata.json');

	const { generateExperience } = await prompt<{ generateExperience: 'append' | 'replace' | 'none' }>({
		type: 'select',
		name: 'generateExperience',
		message: 'Generate an Experience component?',
		choices: [
			{ value: 'append', name: 'append', message: 'Append <ngt-canvas /> to AppComponent template' },
			{ value: 'replace', name: 'replace', message: 'Replace AppComponent template with <ngt-canvas />' },
			{ value: 'none', name: 'none', message: 'Do not generate an Experience component' },
		],
		initial: 2,
	});

	if (generateExperience !== 'none') {
		const isNx = tree.exists('nx.json');

		if (!project) {
			if (isNx) {
				const rootProjectJson = readJson(tree, 'project.json');
				if (!rootProjectJson) {
					throw new Error(`
It seems like your workspace is an Integrated workspace but you did not provide a "project" name.
Please retry the generator with a "--project" specified.`);
				}
				const rootName = rootProjectJson['name'];
				if (rootName === packageJson['name']) {
					project = rootName;
				}
			} else {
				const angularJson = readJson(tree, 'angular.json');
				if (!angularJson) {
					throw new Error(`
Cannot find "angular.json" file.
Please retry the generator with a "--project" specified in an Angular workspace.`);
				}
				project = packageJson['name'];
			}
		}

		if (!project) {
			throw new Error(`
Angular Three generator could not find a default "project".
Please retry the generator with a "--project" specified.`);
		}
		const projectConfig = readProjectConfiguration(tree, project);
		let sourceRoot = projectConfig.sourceRoot;
		if (projectConfig['prefix']) {
			sourceRoot += '/' + projectConfig['prefix'];
		}

		if (sourceRoot) {
			// generate Experience component
			generateFiles(tree, join(__dirname, 'files'), sourceRoot, { tmpl: '' });

			let isStandalone = false;

			while (!isStandalone) {
				const answer = await prompt<{ isStandalone: boolean }>({
					type: 'confirm',
					initial: true,
					name: 'isStandalone',
					message: 'Is your project standalone?',
				});
				isStandalone = answer.isStandalone;
				if (!isStandalone) {
					logger.info(`Wrong answer. You should be using Standalone.`);
				}
			}

			const appComponentPath = `${sourceRoot}/app.component.ts`;
			const exist = tree.exists(appComponentPath);
			const appComponentTemplatePath = `${sourceRoot}/app.component.html`;
			const templateExist = tree.exists(appComponentTemplatePath);
			const appComponentContent = exist ? tree.read(appComponentPath, 'utf8') : null;
			const appComponentTemplateContent = templateExist ? tree.read(appComponentTemplatePath, 'utf8') : null;

			if (isStandalone) {
				if (!appComponentContent) {
					logger.warn(`
AppComponent not found at ${appComponentPath}. Angular Three was initialized successfully but an Experience component was not generated.`);
				} else {
					let updatedContent = tsquery.replace(
						appComponentContent,
						'Identifier[name="imports"] ~ ArrayLiteralExpression',
						(node: ArrayLiteralExpression) => {
							return `[${node.elements.map((element) => element['escapedText']).join(', ')}, NgtCanvas]`;
						},
					);

					updatedContent = tsquery.replace(updatedContent, 'SourceFile', (node) => {
						return `
import { NgtCanvas } from 'angular-three';
import { Experience } from './experience/experience.component';

${node.getFullText()}
`;
					});

					const contentNode = tsquery.ast(appComponentContent);
					const classMembersQuery = 'ClassDeclaration > :matches(PropertyDeclaration,MethodDeclaration)';
					const members = tsquery.match(contentNode, classMembersQuery);

					if (members.length === 0) {
						updatedContent = tsquery.replace(updatedContent, 'ClassDeclaration', (node) => {
							const withoutBraces = node.getFullText().slice(0, -1);
							return `
${withoutBraces}
  scene = Experience;
}`;
						});
					} else {
						updatedContent = tsquery.replace(updatedContent, classMembersQuery, (node) => {
							return `
scene = Experience;
${node.getFullText()}`;
						});
					}
					if (appComponentTemplateContent) {
						const updatedTemplateContent =
							generateExperience === 'append'
								? `
${appComponentTemplateContent}
<ngt-canvas [sceneGraph]="scene" />`
								: `<ngt-canvas [sceneGraph]="scene" />`;
						tree.write(appComponentTemplatePath, updatedTemplateContent);
					} else {
						updatedContent = tsquery.replace(
							updatedContent,
							'Identifier[name="template"] ~ NoSubstitutionTemplateLiteral',
							(node: NoSubstitutionTemplateLiteral) => {
								return generateExperience === 'append'
									? `\`
${node.getFullText()}
<ngt-canvas [sceneGraph]="scene" />\``
									: `\`<ngt-canvas [sceneGraph]="scene" />\``;
							},
						);
					}

					tree.write(appComponentPath, updatedContent);
				}
			}
		} else {
			logger.warn(`
"sourceRoot" not found. Angular Three was initialized successfully but an Experience component was not generated.`);
		}
	}

	return () => {
		installPackagesTask(tree);
	};
}
