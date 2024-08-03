import {
	addDependenciesToPackageJson,
	formatFiles,
	generateFiles,
	getProjects,
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
import { type ArrayLiteralExpression, type NoSubstitutionTemplateLiteral } from 'typescript';
import { addMetadataJson } from '../utils';
import { ANGULAR_THREE_VERSION, NGXTENSION_VERSION, THREE_TYPE_VERSION, THREE_VERSION } from '../version';

export interface InitGeneratorOptions {
	skipGenerateExperience: boolean;
}

export async function initGenerator(
	tree: Tree,
	{ skipGenerateExperience = false }: Partial<InitGeneratorOptions> = {},
) {
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

	if (skipGenerateExperience) {
		await formatFiles(tree);

		return () => {
			installPackagesTask(tree);
		};
	}

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
		const projects = getProjects(tree);
		const applicationProjects = Array.from(projects.entries()).reduce((acc, [projectName, project]) => {
			if (project.projectType === 'application') {
				acc.push({ name: projectName, ...project });
			}
			return acc;
		}, []);
		let selectedProject: string;
		if (applicationProjects.length === 1) {
			selectedProject = applicationProjects[0].name;
		} else {
			// prompt
			const { projectName } = await prompt<{ projectName: string }>({
				type: 'select',
				name: 'projectName',
				message: 'Add Experience to which project?',
				choices: applicationProjects.map((appProject) => ({ value: appProject.name, name: appProject.name })),
			});
			selectedProject = projectName;
		}

		if (!selectedProject) {
			return warnExperienceWasNotGenerated(tree, 'Unable to locate a project');
		}

		const projectConfiguration = readProjectConfiguration(tree, selectedProject);

		let sourceRoot = projectConfiguration.sourceRoot;
		if (projectConfiguration['prefix']) {
			sourceRoot += '/' + projectConfiguration['prefix'];
		}

		if (!sourceRoot) {
			return warnExperienceWasNotGenerated(tree, `sourceRoot for ${selectedProject} was not found`);
		}

		// generate Experience component
		generateFiles(tree, join(__dirname, 'files'), sourceRoot, { tmpl: '' });

		const appComponentPath = `${sourceRoot}/app.component.ts`;
		const exist = tree.exists(appComponentPath);

		const appComponentTemplatePath = `${sourceRoot}/app.component.html`;
		const templateExist = tree.exists(appComponentTemplatePath);

		const appComponentContent = exist ? tree.read(appComponentPath, 'utf8') : null;
		const appComponentTemplateContent = templateExist ? tree.read(appComponentTemplatePath, 'utf8') : null;

		if (!appComponentContent) {
			return warnExperienceWasNotGenerated(tree, `AppComponent was not found`);
		}

		// TODO (chau): revisit if standalone:true becomes the default
		const isStandalone = appComponentContent.includes(`standalone: true`);
		if (!isStandalone) {
			return warnExperienceWasNotGenerated(tree, `AppComponent is not a Standalone Component`);
		}

		let updatedContent = tsquery.replace(
			appComponentContent,
			'PropertyAssignment:has(Identifier[name="imports"]) ArrayLiteralExpression',
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

		const appComponentContentAst = tsquery.ast(appComponentContent);
		const classMembersQuery = 'ClassDeclaration > :matches(PropertyDeclaration,MethodDeclaration)';
		const members = tsquery.match(appComponentContentAst, classMembersQuery);

		if (members.length === 0 || generateExperience === 'replace') {
			updatedContent = tsquery.replace(updatedContent, 'ClassDeclaration', (node) => {
				const withoutBraces = node.getFullText().slice(0, -1);
				return `
${withoutBraces}
  sceneGraph = Experience;
}`;
			});
		} else {
			updatedContent = tsquery.replace(updatedContent, classMembersQuery, (node) => {
				return `
sceneGraph = Experience;
${node.getFullText()}`;
			});
		}

		if (appComponentTemplateContent) {
			const updatedTemplateContent =
				generateExperience === 'append'
					? `
${appComponentTemplateContent}
<ngt-canvas [sceneGraph]="sceneGraph" />`
					: `<ngt-canvas [sceneGraph]="sceneGraph" />`;
			tree.write(appComponentTemplatePath, updatedTemplateContent);
		} else {
			updatedContent = tsquery.replace(
				updatedContent,
				'PropertyAssignment:has(Identifier[name="template"]) NoSubstitutionTemplateLiteral',
				(node: NoSubstitutionTemplateLiteral) => {
					const fullText = node.getFullText().trim().slice(1, -1);
					return generateExperience === 'append'
						? `\`
${fullText}
<ngt-canvas [sceneGraph]="sceneGraph" />\``
						: `\`<ngt-canvas [sceneGraph]="sceneGraph" />\``;
				},
			);
		}

		tree.write(appComponentPath, updatedContent);
	}

	await formatFiles(tree);

	return () => {
		installPackagesTask(tree);
	};
}

function warnExperienceWasNotGenerated(tree: Tree, message: string) {
	logger.warn(
		`[NGT] ${message}. Angular Three was initialized successfully, but an Experience component was not generated.`,
	);

	return () => {
		installPackagesTask(tree);
	};
}

export default initGenerator;
