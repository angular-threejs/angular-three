import devkit from '@nx/devkit';
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';
import ts from 'typescript';
import { createBareJsons, createProgram } from './utils.mjs';

const coreMetadataJsonPath = 'node_modules/angular-three/metadata.json';

if (!existsSync(coreMetadataJsonPath)) {
	execSync(`node tools/scripts/generate-json.mjs`, { cwd: '.' });
}

const coreMetadataJson = devkit.readJsonFile(coreMetadataJsonPath);
const coreTags = coreMetadataJson.tags;

const externals = ['three-stdlib'];
const externalsMap = {
	OrbitControls: 'node_modules/three-stdlib/controls/OrbitControls.d.ts',
};

const sobaMap = {
	shaders: {
		NgtsGridMaterialState: 'grid-material',
	},
};

const entryPoints = {
	controls: ['orbit-controls'],
	abstractions: ['billboard', 'text', 'grid'],
	cameras: ['perspective-camera', 'orthographic-camera'],
};

const paths = [];
for (const [entryPoint, entryPointEntities] of Object.entries(entryPoints)) {
	for (const entity of entryPointEntities) {
		paths.push(join('libs/soba', entryPoint, 'src', entity, `${entity}.ts`));
	}
}

const { metadataJson, webTypesJson, write } = createBareJsons('angular-three-soba', 'soba');

for (const path of paths) {
	const { sourceFile, processIntersectionTypeNode, processTypeMembers } = createProgram([path]);

	ts.forEachChild(sourceFile, (node) => {
		if (ts.isModuleDeclaration(node)) {
			const nodeBody = node.body;
			if (ts.isModuleBlock(nodeBody)) {
				const statement = nodeBody.statements[0];
				if (ts.isInterfaceDeclaration(statement)) {
					for (const member of statement.members) {
						if (ts.isPropertySignature(member)) {
							const metadataAtMember = { name: member.name.text, attributes: [] };

							/**
							 * @type {ts.JSDocComment[]}
							 */
							const jsDocs = member['jsDoc'] || [];
							const jsDocComment = jsDocs[0];

							if (jsDocComment) {
								for (const tag of jsDocComment.tags) {
									if (ts.isJSDocAugmentsTag(tag)) {
										const extendTag = tag.class.expression.escapedText;

										if (externals.includes(extendTag) && tag.comment) {
											const externalSymbolName = tag.comment.substring(1);
											const externalDtsPath = externalsMap[externalSymbolName];
											if (externalDtsPath) {
												const { sourceFile: externalSourceFile } = createProgram([
													externalDtsPath,
												]);
												ts.forEachChild(externalSourceFile, (externalChildNode) => {
													if (
														ts.isClassDeclaration(externalChildNode) &&
														externalChildNode.name.text === externalSymbolName
													) {
														processTypeMembers(metadataAtMember, externalChildNode.members);
													}
												});
											}
											continue;
										}

										const foundCoreTag = coreTags.find((coreTag) => coreTag.name === extendTag);
										if (foundCoreTag) {
											metadataAtMember.attributes.push(...foundCoreTag.attributes);
										}
									}
								}
							}

							const memberType = member.type;

							if (ts.isIntersectionTypeNode(memberType)) {
								processIntersectionTypeNode(metadataAtMember, memberType, sobaMap);
							}

							metadataJson.tags.push(metadataAtMember);
							webTypesJson.contributions.html.elements.push(metadataAtMember);
						}
					}
				}
			}
		}
	});
}

write(metadataJson, webTypesJson);