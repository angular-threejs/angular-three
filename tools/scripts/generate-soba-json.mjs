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

const sobaRoot = 'libs/soba';

const abstractionsRoot = 'abstractions/src';
const abstractions = ['billboard/billboard.ts', 'text/text.ts'].map((path) => join(sobaRoot, abstractionsRoot, path));

const paths = [...abstractions];

const { metadataJson, webTypesJson, write } = createBareJsons('angular-three-soba', 'soba');

for (const path of paths) {
	const { sourceFile, processIntersectionTypeNode } = createProgram([path]);

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
										const foundCoreTag = coreTags.find((coreTag) => coreTag.name === extendTag);
										if (foundCoreTag) {
											metadataAtMember.attributes.push(...foundCoreTag.attributes);
										}
									}
								}
							}

							const memberType = member.type;

							if (ts.isIntersectionTypeNode(memberType)) {
								processIntersectionTypeNode(metadataAtMember, memberType);
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
