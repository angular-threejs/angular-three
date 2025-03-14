import { formatFiles, getProjects, readProjectConfiguration, Tree, visitNotIgnoredFiles } from '@nx/devkit';

export interface MigrateTweakpaneGeneratorSchema {
	project?: string;
}

export async function migrateTweakpane(tree: Tree, options: MigrateTweakpaneGeneratorSchema) {
	if (options.project) {
		const project = readProjectConfiguration(tree, options.project);
		migrateByPath(tree, project.root);
	} else {
		const projects = getProjects(tree);

		for (const projectName of projects.keys()) {
			const projectConfig = projects.get(projectName);
			if (!projectConfig) continue;

			migrateByPath(tree, projectConfig.root);
		}
	}

	await formatFiles(tree);
}

function migrateByPath(tree: Tree, root: string) {
	visitNotIgnoredFiles(tree, root, (path) => {
		const fileContent = tree.read(path, 'utf-8');
		if (fileContent) {
			const updatedContent = fileContent
				.replaceAll('ngt-tweak', 'tweakpane')
				.replace(/NgtTweak([A-Za-z]*)/g, 'Tweakpane$1');
			if (fileContent !== updatedContent) {
				tree.write(path, updatedContent);
			}
		}
	});
}

export default migrateTweakpane;
