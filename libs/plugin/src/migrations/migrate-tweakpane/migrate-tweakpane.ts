import { formatFiles, getProjects, Tree, visitNotIgnoredFiles } from '@nx/devkit';

export default async function update(host: Tree) {
	const projects = getProjects(host);

	for (const projectName of projects.keys()) {
		const projectConfig = projects.get(projectName);
		if (!projectConfig) continue;

		visitNotIgnoredFiles(host, projectConfig.root, (path) => {
			const fileContent = host.read(path, 'utf-8');
			if (fileContent) {
				const updatedContent = fileContent
					.replaceAll('ngt-tweak', 'tweakpane')
					.replace(/NgtTweak([A-Za-z]*)/g, 'Tweakpane$1');
				if (fileContent !== updatedContent) {
					host.write(path, updatedContent);
				}
			}
		});
	}

	await formatFiles(host);
}
