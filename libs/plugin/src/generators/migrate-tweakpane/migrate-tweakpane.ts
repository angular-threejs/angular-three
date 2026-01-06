import { formatFiles, getProjects, readProjectConfiguration, Tree, visitNotIgnoredFiles } from '@nx/devkit';

/**
 * Schema options for the migrate-tweakpane generator.
 */
export interface MigrateTweakpaneGeneratorSchema {
	/** Optional project name to limit migration scope */
	project?: string;
}

/**
 * Migrates old NgtTweak* components to the new Tweakpane* naming convention.
 *
 * This generator performs the following replacements across all files:
 * - `ngt-tweak*` selectors → `tweakpane*`
 * - `NgtTweak*` class names → `Tweakpane*`
 *
 * @param tree - The Nx virtual file system tree
 * @param options - Generator options, optionally limiting to a specific project
 *
 * @example
 * ```bash
 * nx g angular-three-plugin:migrate-tweakpane
 * nx g angular-three-plugin:migrate-tweakpane --project=my-app
 * ```
 */
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

/**
 * Performs the actual file migration for a given project root.
 *
 * @param tree - The Nx virtual file system tree
 * @param root - The root path of the project to migrate
 */
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
