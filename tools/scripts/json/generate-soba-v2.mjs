/**
 * Angular Three Soba Web-Types & Metadata Generator v2
 *
 * Generates web-types for angular-three-soba custom elements.
 *
 * NOTE: This only generates metadata for custom elements declared in
 * HTMLElementTagNameMap (like ngt-grid-material, ngt-position-mesh, etc.)
 *
 * Angular components (ngts-*) are NOT included because they are already
 * handled by Angular Language Service.
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
	packageName: 'angular-three-soba',
	version: '3.0.0',
	outputPaths: {
		dist: 'dist/libs/soba',
		nodeModules: 'node_modules/angular-three-soba',
	},
};

// Soba library entry points to scan for HTMLElementTagNameMap declarations
const SOBA_ENTRY_POINTS = [
	'libs/soba/abstractions/src/lib',
	'libs/soba/performances/src/lib',
	'libs/soba/shaders/src/lib',
	'libs/soba/vanilla-exports/src',
	'libs/soba/materials/src/lib',
	'libs/soba/staging/src/lib',
];

// ============================================================================
// TypeScript Analysis
// ============================================================================

/**
 * Get all TypeScript files from entry points
 */
function getAllSobaFiles() {
	const files = [];

	for (const entryPoint of SOBA_ENTRY_POINTS) {
		const fullPath = resolve(__dirname, '../../..', entryPoint);
		if (!existsSync(fullPath)) continue;

		if (fullPath.endsWith('.ts')) {
			files.push(fullPath);
			continue;
		}

		const scanDir = (dir) => {
			const entries = readdirSync(dir, { withFileTypes: true });
			for (const entry of entries) {
				const entryPath = join(dir, entry.name);
				if (entry.isDirectory()) {
					scanDir(entryPath);
				} else if (
					entry.name.endsWith('.ts') &&
					!entry.name.endsWith('.spec.ts') &&
					!entry.name.endsWith('.stories.ts')
				) {
					files.push(entryPath);
				}
			}
		};

		scanDir(fullPath);
	}

	return files;
}

/**
 * Extract JSDoc comment from a node
 */
function getJsDocComment(node) {
	const jsDocs = node['jsDoc'] || [];
	if (jsDocs.length === 0) return null;

	const jsDoc = jsDocs[0];
	let comment = '';

	if (jsDoc.comment) {
		if (typeof jsDoc.comment === 'string') {
			comment = jsDoc.comment;
		} else if (Array.isArray(jsDoc.comment)) {
			comment = jsDoc.comment.map((c) => c.text || '').join('');
		}
	}

	return {
		comment,
		tags: jsDoc.tags || [],
	};
}

/**
 * Extract properties from an interface declaration
 */
function extractInterfaceProperties(node, sourceFile) {
	const properties = [];

	if (!node.members) return properties;

	for (const member of node.members) {
		if (!ts.isPropertySignature(member)) continue;

		const name = member.name?.getText(sourceFile);
		if (!name || name.startsWith('_')) continue;

		// Get type
		let type = 'any';
		if (member.type) {
			type = member.type.getText(sourceFile);
		}

		// Get JSDoc
		const jsDoc = getJsDocComment(member);
		let description = jsDoc?.comment || `${name} property`;
		let defaultValue;

		// Look for @default tag
		if (jsDoc?.tags) {
			for (const tag of jsDoc.tags) {
				if (tag.tagName?.getText(sourceFile) === 'default') {
					defaultValue = typeof tag.comment === 'string' ? tag.comment : tag.comment?.[0]?.text;
				}
			}
		}

		// Check if optional
		const optional = !!member.questionToken;

		properties.push({
			name,
			type: simplifyType(type),
			description,
			optional,
			defaultValue,
		});
	}

	return properties;
}

/**
 * Simplify TypeScript types for display
 */
function simplifyType(type) {
	// Remove import paths
	type = type.replace(/import\([^)]+\)\./g, '');
	// Simplify THREE namespace
	type = type.replace(/THREE\./g, '');
	return type;
}

/**
 * Parse a file and extract custom elements from HTMLElementTagNameMap
 */
function parseFile(filePath, program) {
	const sourceFile = program.getSourceFile(filePath);
	if (!sourceFile) return [];

	const elements = [];

	ts.forEachChild(sourceFile, (node) => {
		// Look for: declare global { interface HTMLElementTagNameMap { ... } }
		if (ts.isModuleDeclaration(node) && node.name?.getText(sourceFile) === 'global') {
			const body = node.body;
			if (body && ts.isModuleBlock(body)) {
				for (const statement of body.statements) {
					if (
						ts.isInterfaceDeclaration(statement) &&
						statement.name.getText(sourceFile) === 'HTMLElementTagNameMap'
					) {
						for (const member of statement.members) {
							if (ts.isPropertySignature(member)) {
								const elementInfo = parseCustomElement(member, sourceFile);
								if (elementInfo) {
									elements.push(elementInfo);
								}
							}
						}
					}
				}
			}
		}
	});

	return elements;
}

/**
 * Parse a custom element from HTMLElementTagNameMap
 */
function parseCustomElement(member, sourceFile) {
	const name = member.name?.getText(sourceFile)?.replace(/['"]/g, '');
	if (!name) return null;

	const jsDoc = getJsDocComment(member);
	let extendsElement;
	let optionsTypeName;

	if (jsDoc?.tags) {
		for (const tag of jsDoc.tags) {
			const tagName = tag.tagName?.getText(sourceFile);
			if (tagName === 'extends') {
				// Handle @extends tag
				if (ts.isJSDocAugmentsTag(tag)) {
					extendsElement = tag.class?.expression?.getText(sourceFile);
				}
			} else if (tagName === 'options') {
				optionsTypeName = typeof tag.comment === 'string' ? tag.comment : tag.comment?.[0]?.text;
			}
		}
	}

	// Find the options interface in the same file
	let properties = [];
	if (optionsTypeName) {
		ts.forEachChild(sourceFile, (node) => {
			if (ts.isInterfaceDeclaration(node) && node.name.getText(sourceFile) === optionsTypeName) {
				properties = extractInterfaceProperties(node, sourceFile);
			}
		});
	}

	// Get description from the interface JSDoc if available
	let description = jsDoc?.comment || `${name} element`;

	// Try to find description from the exported const/class with same name
	const baseName = name.replace('ngt-', '').replace(/-./g, (x) => x[1].toUpperCase());
	const pascalName = baseName.charAt(0).toUpperCase() + baseName.slice(1);

	ts.forEachChild(sourceFile, (node) => {
		if (ts.isVariableStatement(node)) {
			for (const decl of node.declarationList.declarations) {
				if (decl.name?.getText(sourceFile) === pascalName) {
					const varJsDoc = getJsDocComment(node);
					if (varJsDoc?.comment) {
						description = varJsDoc.comment;
					}
				}
			}
		}
	});

	return {
		name,
		description,
		properties,
		extendsElement,
	};
}

/**
 * Analyze all soba files and extract custom element metadata
 */
function analyzeSobaElements() {
	console.log('Analyzing Soba custom elements...');

	const files = getAllSobaFiles();
	console.log(`Scanning ${files.length} TypeScript files for HTMLElementTagNameMap declarations`);

	const program = ts.createProgram(files, {
		target: ts.ScriptTarget.ES2020,
		module: ts.ModuleKind.ESNext,
		strict: true,
	});

	const allElements = [];

	for (const file of files) {
		const elements = parseFile(file, program);
		allElements.push(...elements);
	}

	console.log(`Found ${allElements.length} custom elements`);
	return allElements;
}

// ============================================================================
// Web-Types Generation
// ============================================================================

/**
 * Generate web-types JSON for soba custom elements
 */
function generateWebTypes(elements) {
	const webTypes = {
		$schema: 'https://raw.githubusercontent.com/JetBrains/web-types/master/schema/web-types.json',
		name: CONFIG.packageName,
		version: CONFIG.version,
		framework: 'angular',
		'js-types-syntax': 'typescript',
		'description-markup': 'markdown',
		'framework-config': {
			'enable-when': {
				'node-packages': [CONFIG.packageName],
			},
		},
		contributions: {
			html: {
				elements: [],
			},
		},
	};

	for (const element of elements) {
		const htmlElement = {
			name: element.name,
			description: element.description,
			source: {
				module: CONFIG.packageName,
				symbol: element.name,
			},
			js: {
				properties: [],
				events: [],
			},
		};

		// Add extends reference if present
		if (element.extendsElement) {
			htmlElement.extends = {
				path: `/html/elements/${element.extendsElement}`,
			};
		}

		// Add properties
		for (const prop of element.properties) {
			htmlElement.js.properties.push({
				name: prop.name,
				description: prop.description + (prop.defaultValue ? ` (default: ${prop.defaultValue})` : ''),
				type: prop.type,
			});
		}

		webTypes.contributions.html.elements.push(htmlElement);
	}

	return webTypes;
}

/**
 * Generate VSCode metadata JSON for soba custom elements
 */
function generateVSCodeMetadata(elements) {
	const metadata = {
		$schema:
			'https://raw.githubusercontent.com/microsoft/vscode-html-languageservice/main/docs/customData.schema.json',
		version: 1.1,
		tags: [],
	};

	for (const element of elements) {
		const tag = {
			name: element.name,
			description: {
				kind: 'markdown',
				value: element.description,
			},
			attributes: [],
		};

		// Add properties as attributes (both plain and bound)
		for (const prop of element.properties) {
			const desc = prop.description + (prop.defaultValue ? ` (default: ${prop.defaultValue})` : '');

			tag.attributes.push({
				name: prop.name,
				description: desc,
			});
			tag.attributes.push({
				name: `[${prop.name}]`,
				description: `Bound ${prop.name} property`,
			});
		}

		metadata.tags.push(tag);
	}

	return metadata;
}

// ============================================================================
// Main
// ============================================================================

function main() {
	console.log('Angular Three Soba Web-Types Generator v2\n');
	console.log('NOTE: Only generating metadata for custom elements (ngt-*),');
	console.log('      not Angular components (ngts-*) which are handled by Angular LS.\n');

	// Ensure core web-types exist
	const coreWebTypesPath = 'node_modules/angular-three/web-types.json';
	if (!existsSync(coreWebTypesPath)) {
		console.log('Core web-types not found, generating...');
		execSync('node tools/scripts/json/generate-v2.mjs', { cwd: resolve(__dirname, '../../..') });
	}

	// Analyze soba custom elements
	const elements = analyzeSobaElements();

	if (elements.length === 0) {
		console.log('\nNo custom elements found. Skipping file generation.');
		return;
	}

	// Generate outputs
	const webTypes = generateWebTypes(elements);
	const metadata = generateVSCodeMetadata(elements);

	// Ensure output directories exist
	for (const dir of Object.values(CONFIG.outputPaths)) {
		if (!existsSync(dir)) {
			mkdirSync(dir, { recursive: true });
		}
	}

	// Write files
	const webTypesJson = JSON.stringify(webTypes, null, 2);
	const metadataJson = JSON.stringify(metadata, null, 2);

	writeFileSync(`${CONFIG.outputPaths.dist}/web-types.json`, webTypesJson);
	writeFileSync(`${CONFIG.outputPaths.dist}/metadata.json`, metadataJson);
	writeFileSync(`${CONFIG.outputPaths.nodeModules}/web-types.json`, webTypesJson);
	writeFileSync(`${CONFIG.outputPaths.nodeModules}/metadata.json`, metadataJson);

	console.log('\nGenerated files:');
	console.log(`  - ${CONFIG.outputPaths.dist}/web-types.json`);
	console.log(`  - ${CONFIG.outputPaths.dist}/metadata.json`);
	console.log(`  - ${CONFIG.outputPaths.nodeModules}/web-types.json`);
	console.log(`  - ${CONFIG.outputPaths.nodeModules}/metadata.json`);

	// Print summary
	const withProps = elements.filter((e) => e.properties.length > 0).length;
	const withExtends = elements.filter((e) => e.extendsElement).length;
	const totalProps = elements.reduce((sum, e) => sum + e.properties.length, 0);

	console.log(`\nSummary:`);
	console.log(`  - ${elements.length} custom elements`);
	console.log(`  - ${withProps} with properties`);
	console.log(`  - ${withExtends} with extends`);
	console.log(`  - ${totalProps} total properties`);
}

main();
