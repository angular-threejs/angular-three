import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { readdirSync } from 'node:fs';
import { join } from 'path';
import ts from 'typescript';
import { createBareJsons, createProgram } from './utils.mjs';

const coreMetadataJsonPath = 'node_modules/angular-three/metadata.json';

if (!existsSync(coreMetadataJsonPath)) {
	execSync(`node tools/scripts/generate-json.mjs`, { cwd: '.' });
}

const entryPoints = [
	'shaders/src/lib',
	'vanilla-exports/src/index.ts',
	'performances/src/lib/instances/position-mesh.ts',
	'performances/src/lib/points/position-point.ts',
	'performances/src/lib/segments/segment-object.ts',
];

const paths = [];
for (const entryPoint of entryPoints) {
	const entryPointPath = join('libs/soba', entryPoint);

	if (entryPointPath.endsWith('.ts')) {
		paths.push(entryPointPath);
		continue;
	}

	const dirents = readdirSync(entryPointPath, { recursive: true, withFileTypes: true });

	for (const dirent of dirents) {
		if (dirent.isFile() && dirent.name.endsWith('.ts')) {
			paths.push(join(entryPointPath, dirent.name));
		}
	}
}

const { metadataJson, webTypesJson, write } = createBareJsons('angular-three-soba', 'soba');

for (const path of paths) {
	const { sourceFile, processIntersectionTypeNode, processTypeMembers, processTypeReferenceNode, typesMap } =
		createProgram([path]);

	ts.forEachChild(sourceFile, (node) => {
		if (ts.isModuleDeclaration(node) && ts.isModuleBlock(node.body)) {
			const statement = node.body.statements[0];
			if (ts.isInterfaceDeclaration(statement) && statement.name.escapedText === 'HTMLElementTagNameMap') {
				for (const member of statement.members) {
					if (ts.isPropertySignature(member)) {
						const metadataAtMember = { name: member.name.text || member.name.escapedText, attributes: [], extends: '' };

						/**
						 * @type {ts.JSDoc[]}
						 */
						const jsDocs = member['jsDoc'] || [];
						const jsDocComment = jsDocs[0];

						let parametersTypeName;
						let rawParameters = [];

						if (jsDocComment) {
							for (const tag of jsDocComment.tags) {
								if (ts.isJSDocAugmentsTag(tag) && tag.tagName.text === 'extends') {
									metadataAtMember.extends = `/html/elements/${tag.class.expression.escapedText}`;
									continue;
								}

								if (tag.tagName.text === 'options') {
									parametersTypeName = tag.comment;
									continue;
								}

								if (tag.tagName.text === 'rawOptions') {
									rawParameters = tag.comment.split('|');
								}
							}
						}

						if (parametersTypeName) {
							const parametersTypeDeclaration = typesMap[parametersTypeName];
							if (parametersTypeDeclaration) {
								if (ts.isInterfaceDeclaration(parametersTypeDeclaration.node)) {
									processTypeMembers(metadataAtMember, parametersTypeDeclaration.node.members);
								} else {
									processTypeReferenceNode(metadataAtMember, parametersTypeDeclaration.typeNode);
								}
							}
						} else if (rawParameters.length) {
							processTypeMembers(metadataAtMember, rawParameters);
						} else if (ts.isIntersectionTypeNode(member.type)) {
							processIntersectionTypeNode(metadataAtMember, member.type);
						} else if (ts.isTypeReferenceNode(member.type)) {
							const typeDeclaration = typesMap[member.type.typeName.text];
							if (typeDeclaration) {
								processTypeReferenceNode(metadataAtMember, typeDeclaration.typeNode || typeDeclaration.type);
							}
						}

						metadataJson.tags.push(metadataAtMember);
						webTypesJson.contributions.html.elements.push(metadataAtMember);
					}
				}
			}
		}
	});
}

write(metadataJson, webTypesJson);
