import { Tree, getProjects, visitNotIgnoredFiles } from '@nx/devkit';
import { tsquery } from '@phenomnomnominal/tsquery';
import { ImportDeclaration } from 'typescript';

export default function update(host: Tree) {
	const projects = getProjects(host);

	for (const [, projectConfiguration] of projects.entries()) {
		visitNotIgnoredFiles(host, projectConfiguration.root, (path) => {
			if (path.endsWith('.ts')) {
				migrateApi(host, path, 'createInjectionToken', 'create-injection-token');
				migrateApi(host, path, 'assertInjector', 'assert-injector');
				migrateApi(host, path, 'NgtRepeat', 'repeat', 'Repeat');
			}
		});
	}
}

function migrateApi(host: Tree, path: string, apiName: string, apiImport: string, alias?: string) {
	const content = host.read(path, 'utf8');
	let updatedContent = tsquery.replace(
		content,
		`ImportDeclaration:has(StringLiteral[value="angular-three"]):has(Identifier[name="${apiName}"])`,
		(node: ImportDeclaration) => node.getText().replace(`${apiName},`, '').replace(apiName, ''),
	);

	if (content === updatedContent) {
		// NOTE: transformer did not run
		return;
	}

	if (
		updatedContent.includes("import {} from 'angular-three'") ||
		updatedContent.includes('import {} from "angular-three"')
	) {
		updatedContent = updatedContent
			.replace("import {} from 'angular-three';", '')
			.replace("import {} from 'angular-three'", '')
			.replace('import {} from "angular-three";', '')
			.replace('import {} from "angular-three"', '');
	}

	const updatedImport = alias ? `${alias} as ${apiName}` : apiName;

	updatedContent = tsquery.replace(updatedContent, 'SourceFile', (sf) => {
		return `
import { ${updatedImport} } from 'ngxtension/${apiImport}';
${sf.getFullText()}`;
	});

	host.write(path, updatedContent);
}
