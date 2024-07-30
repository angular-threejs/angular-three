import { createWriteStream, existsSync, mkdirSync, unlinkSync, writeFileSync } from 'fs';
import ts from 'typescript';
import { format } from 'util';

export const THREE_MEMBERS_TO_SKIP = ['ngt-primitive'];
export const THREE_ELEMENTS_NAME = 'ThreeElements';
export const THREE_OBJECT_EVENTS_MAP_NAME = 'NgtObject3DEventsMap';

export function removeLogFile() {
	if (existsSync('tmp/log.txt')) {
		unlinkSync('tmp/log.txt');
	}
}

export function createLog() {
	removeLogFile();

	const logFile = createWriteStream('tmp/log.txt', { flags: 'a' });
	// Or 'w' to truncate the file every time the process starts.
	const logStdout = process.stdout;

	function writeToLog() {
		logFile.write(format.apply(null, [`------${new Date().toLocaleDateString()}------`, '\n']));
		// Storing without color codes
		logFile.write(format.apply(null, arguments).replace(/\033\[[0-9;]*m/g, '') + '\n');
		// Display normally, with colors to Stdout
		logStdout.write(format.apply(null, arguments) + '\n');
	}

	return { writeToLog };
}

export const TYPE_CHECKER_FLAGS =
	ts.NodeBuilderFlags.NoTruncation | ts.NodeBuilderFlags.InTypeAlias | ts.NodeBuilderFlags.NoTypeReduction;

const PROPERTIES_TO_SKIP = [
	'__ngt_args__',
	'type',
	'uuid',
	'toJSON',
	'clone',
	'copy',
	'dispatchEvent',
	'addEventListener',
	'removeEventListener',
	'fromArray',
	'toArray',
	'reset',
	'connect',
	'saveState',
];
const skipIs = (str) => str.startsWith('is');
const skipAction = (str) =>
	str.startsWith('set') ||
	str.startsWith('add') ||
	str.startsWith('has') ||
	str.startsWith('apply') ||
	str.startsWith('update') ||
	str.startsWith('_on') ||
	str.startsWith('listen') ||
	str.startsWith('stopListen') ||
	str.startsWith('get');
const skipLastNumber = (str) => str.endsWith('0');

export const commonAttributes = [
	{
		name: 'attach',
		description: 'Property to attach to parent. Can be dotted path',
	},
	{
		name: '[attach]',
		description: 'An array of paths to attach to parent. Can also be an NgtAttachFunction',
	},
	{
		name: '[parameters]',
		description: 'An object of options to pass to the instance',
	},
	{
		name: '(beforeRender)',
		description: 'Register an event to be run in animation loop',
	},
	{
		name: '(attached)',
		description: 'Register an event to be invoked after this node is attached to the parent',
	},
	{
		name: '(updated)',
		description: "Register an event to be invoked after this node's properties are updated",
	},
];
const overlapWithCommonAttributes = (str) =>
	commonAttributes.some((attr) => attr.name === str || attr.name === `[${str}]`);

/**
 * @param {ts.JSDoc | ts.JSDocTag} jsDoc
 * @param {string[]} texts
 * @returns {string}
 */
function concatAllJsDocText(jsDoc, texts = []) {
	if (jsDoc.comment) {
		if (typeof jsDoc.comment === 'string') {
			texts.push(jsDoc.comment);
		} else {
			jsDoc.comment.forEach((cm) => {
				if (cm.name) {
					texts.push(`${cm.name.escapedText || cm.name.text || cm.name} ${cm.text}`);
				} else {
					texts.push(cm.text);
				}
			});
		}
	}

	if (jsDoc.tags) {
		jsDoc.tags.forEach((tag) => {
			concatAllJsDocText(tag, texts);
		});
	}

	return texts.join('\n');
}

export function createProgram(filePaths, sourceFilePath) {
	const program = ts.createProgram(filePaths, {
		module: ts.ModuleKind.ESNext,
		target: ts.ScriptTarget.ESNext,
		strict: true,
		emitDeclarationOnly: true,
		paths: {
			'angular-three': ['libs/core/src/lib/three-types.ts'],
		},
		lib: ['three'],
	});
	const typeChecker = program.getTypeChecker();

	/**
	 * @type {Record<string, {node: ts.InterfaceDeclaration, type: ts.Type, typeNode: ts.TypeNode, typeString: string}>}
	 */
	const typesMap = {};
	const descriptionsMap = {};

	let sourceFile;

	for (const sf of program.getSourceFiles()) {
		try {
			if (sf.fileName.includes(sourceFilePath || filePaths[0])) {
				sourceFile = sf;
			}
		} catch (er) {
			/* ignore */
			console.log('err');
		}

		ts.forEachChild(sf, (node) => {
			if (ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node)) {
				const type = typeChecker.getTypeAtLocation(node);
				const typeNode = typeChecker.typeToTypeNode(type, node, TYPE_CHECKER_FLAGS);
				const typeString = typeChecker.typeToString(type, node, TYPE_CHECKER_FLAGS);
				typesMap[node.name.text] = { type, typeNode, typeString, node };

				if (node.name.text === THREE_ELEMENTS_NAME) {
					const dtsCollection = {};

					for (const member of node.members) {
						if (ts.isPropertySignature(member)) {
							const jsDocs = member['jsDoc'] || [];
							/** @type {ts.JSDocTag[]} */
							const tags = jsDocs[0]?.tags || [];
							const fromTag = tags[0];
							const symbolTag = tags[1];

							if (fromTag) {
								const dtsPath = fromTag.comment;
								const dtsName = symbolTag?.comment || dtsPath.split('/').pop().split('.')[0];
								dtsCollection[member.name.text] = { dtsPath, dtsName };
							}
						}
					}

					const dtsProgram = ts.createProgram(
						Object.values(dtsCollection).map((c) => c.dtsPath),
						{
							module: ts.ModuleKind.ESNext,
							target: ts.ScriptTarget.ESNext,
							strict: true,
							emitDeclarationOnly: true,
						},
					);

					for (const member of node.members) {
						if (ts.isPropertySignature(member)) {
							if (!dtsCollection[member.name.text]) continue;
							const { dtsPath, dtsName } = dtsCollection[member.name.text];

							const dtsSourceFile = dtsProgram.getSourceFiles().find((sf) => sf.fileName.includes(dtsPath));
							if (!dtsSourceFile) continue;

							ts.forEachChild(dtsSourceFile, (dtsNode) => {
								if (ts.isClassDeclaration(dtsNode) && dtsNode.name.text === dtsName) {
									const classJsDocs = dtsNode['jsDoc'] || [];
									/** @type {ts.JSDoc} */
									const classJsDoc = classJsDocs[0];
									const descriptions = {};

									if (classJsDoc) {
										descriptions['classDescription'] = concatAllJsDocText(classJsDoc);
									}

									for (const member of dtsNode.members) {
										if (ts.isConstructorDeclaration(member)) {
											const constructorJsDocs = member['jsDoc'] || [];
											const constructorJsDoc = constructorJsDocs[0];
											if (constructorJsDoc) {
												descriptions['constructorDescription'] = concatAllJsDocText(constructorJsDoc);
											}
										}
									}

									if (Object.keys(descriptions).length) {
										descriptionsMap[member.name.text] = descriptions;
									}
								}
							});
						}
					}
				}
			}
		});
	}

	/**
	 * @param {{name: string, attributes: any[]}} metadata
	 * @param {ts.NodeArray<ts.TypeElement> | string[]} members
	 */
	function processTypeMembers(metadata, members) {
		if (!members?.length) return;
		for (const member of members) {
			/** @type {string} */
			const memberName =
				typeof member === 'string'
					? member
					: member.name?.text ||
						member.name?.escapedText ||
						member.name?.expression?.name?.text ||
						member.name?.expression?.name?.escapedText ||
						member.name;

			const exist =
				memberName && metadata.attributes.find(({ name }) => [memberName, `[${memberName}]`].includes(name));

			if (
				exist ||
				!memberName ||
				PROPERTIES_TO_SKIP.includes(memberName) ||
				skipIs(memberName) ||
				skipAction(memberName) ||
				skipLastNumber(memberName) ||
				overlapWithCommonAttributes(memberName)
			) {
				continue;
			}
			metadata.attributes.push({ name: memberName }, { name: `[${memberName}]` });
		}
	}

	/**
	 * @param {{name: string, attributes: any[]}} metadata
	 * @param {ts.TypeAliasDeclaration | ts.InterfaceDeclaration} typeReferenceNode
	 * @param {Record<string, any>} sobaMap
	 */
	function processTypeReferenceNode(metadata, typeReferenceNode, sobaMap) {
		if (ts.isTypeAliasDeclaration(typeReferenceNode)) {
			if (ts.isIntersectionTypeNode(typeReferenceNode.type)) {
				processIntersectionTypeNode(metadata, typeReferenceNode.type, sobaMap);
			} else {
				processTypeMembers(metadata, typeReferenceNode.type.members);
			}
		} else {
			processTypeMembers(metadata, typeReferenceNode.members);
		}
	}

	/**
	 * @param {{name: string, attributes: any[]}} metadata
	 * @param {ts.IntersectionTypeNode} typeNode
	 * @param {Record<string, any>} sobaMap
	 */
	function processIntersectionTypeNode(metadata, typeNode, sobaMap) {
		for (const type of typeNode.types) {
			if (ts.isTypeReferenceNode(type)) {
				// TODO: we don't know how to get the inheritance of some THREE object without turning the source file into an AST
				const typeReferenceName = type.typeName.text;

				if (typesMap[typeReferenceName]) {
					const typeDeclaration = typesMap[typeReferenceName];
					processTypeReferenceNode(metadata, typeDeclaration, sobaMap);
				}
			} else if (ts.isTypeLiteralNode(type)) {
				// this is the type literal that we pass in as an second type argument to NgtOverwrite for NgtObject3DNode
				// so we'll process it as well
				processTypeMembers(metadata, type.members);
			}
		}
	}

	return {
		program,
		typeChecker,
		sourceFile,
		processTypeMembers,
		processIntersectionTypeNode,
		processTypeReferenceNode,
		typesMap,
		descriptionsMap,
	};
}

export function createBareJsons(packageName = 'angular-three', libName = 'core') {
	const metadataJson = {
		$schema: 'https://raw.githubusercontent.com/microsoft/vscode-html-languageservice/main/docs/customData.schema.json',
		version: 1.1,
		tags: [],
	};

	const webTypesJson = {
		$schema: 'https://raw.githubusercontent.com/JetBrains/web-types/master/schema/web-types.json',
		version: '2.0',
		name: 'angular-three',
		framework: 'angular',
		'js-types-syntax': 'typescript',
		'framework-config': {
			'enable-when': {
				'node-packages': [packageName],
			},
		},
		contributions: {
			html: {
				attributes: commonAttributes,
				elements: [],
				'description-markup': 'markdown',
			},
		},
	};

	function write(metadataJson, webTypesJson) {
		writeFileSync(`dist/libs/${libName}/metadata.json`, JSON.stringify(metadataJson));
		writeFileSync(`dist/libs/${libName}/web-types.json`, JSON.stringify(webTypesJson));

		if (!existsSync(`node_modules/${packageName}`)) {
			mkdirSync(`node_modules/${packageName}`);
		}
		writeFileSync(`node_modules/${packageName}/metadata.json`, JSON.stringify(metadataJson));
		writeFileSync(`node_modules/${packageName}/web-types.json`, JSON.stringify(webTypesJson));
	}

	return { metadataJson, webTypesJson, write };
}
