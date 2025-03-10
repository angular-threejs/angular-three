import { existsSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cache for the analyzed types
let threeTypesCache = null;

// Find the @types/three package directory
const findThreeTypesDir = () => {
	const possiblePaths = [
		resolve(__dirname, '../../../node_modules/@types/three'),
		resolve(__dirname, '../../../node_modules/three/types'),
	];

	for (const path of possiblePaths) {
		if (existsSync(path)) {
			return path;
		}
	}

	throw new Error('Could not find Three.js type definitions');
};

// Get all TypeScript definition files in the Three.js types directory
function getAllTypeFiles(baseDir) {
	const result = [];

	function scanDir(dir) {
		const entries = readdirSync(dir, { withFileTypes: true });

		for (const entry of entries) {
			const fullPath = join(dir, entry.name);

			if (entry.isDirectory()) {
				scanDir(fullPath);
			} else if (entry.name.endsWith('.d.ts')) {
				result.push(fullPath);
			}
		}
	}

	scanDir(baseDir);
	return result;
}

// Extract properties from a type
function getPropertiesFromType(type, checker) {
	const properties = new Map();

	// Get symbol and properties
	const symbol = type.symbol;
	if (!symbol) return properties;

	// Get properties from this type
	const typeProperties = checker.getPropertiesOfType(type);
	for (const prop of typeProperties) {
		const propName = prop.getName();

		// Skip methods and private properties
		if (propName.startsWith('_')) continue;

		const declarations = prop.getDeclarations();
		if (!declarations || declarations.length === 0) continue;

		const declaration = declarations[0];
		if (ts.isMethodDeclaration(declaration) || ts.isMethodSignature(declaration)) continue;

		// Get the type of the property
		const propType = checker.getTypeOfSymbolAtLocation(prop, declaration);
		const typeString = checker.typeToString(propType);

		properties.set(propName, {
			name: propName,
			type: mapTypeToSimpleType(typeString),
			typeString,
			description: `Property from type definition: ${typeString}`,
		});
	}

	// Get properties from base types
	const baseTypes = type.getBaseTypes() || [];
	for (const baseType of baseTypes) {
		const baseProperties = getPropertiesFromType(baseType, checker);
		for (const [name, info] of baseProperties) {
			if (!properties.has(name)) {
				properties.set(name, info);
			}
		}
	}

	return properties;
}

// Map TypeScript types to simpler types for our metadata
function mapTypeToSimpleType(typeString) {
	if (typeString.includes('number')) return 'number';
	if (typeString.includes('string')) return 'string';
	if (typeString.includes('boolean')) return 'boolean';
	if (typeString.includes('Vector2')) return 'THREE.Vector2';
	if (typeString.includes('Vector3')) return 'THREE.Vector3';
	if (typeString.includes('Vector4')) return 'THREE.Vector4';
	if (typeString.includes('Color')) return 'THREE.Color';
	if (typeString.includes('Euler')) return 'THREE.Euler';
	if (typeString.includes('Matrix3')) return 'THREE.Matrix3';
	if (typeString.includes('Matrix4')) return 'THREE.Matrix4';
	if (typeString.includes('Quaternion')) return 'THREE.Quaternion';
	if (typeString.includes('Material')) return 'THREE.Material';
	if (typeString.includes('Texture')) return 'THREE.Texture';
	if (typeString.includes('Object3D')) return 'THREE.Object3D';
	if (typeString.includes('BufferGeometry')) return 'THREE.BufferGeometry';
	if (typeString.includes('BufferAttribute')) return 'THREE.BufferAttribute';
	if (typeString.includes('Array') || typeString.includes('[]')) return 'array';
	return 'any';
}

// Analyze Three.js types and extract properties
export function analyzeThreeTypes() {
	// Return cached result if available
	if (threeTypesCache) {
		return threeTypesCache;
	}

	console.log('Analyzing Three.js type definitions...');

	const threeTypesDir = findThreeTypesDir();
	const typeFiles = getAllTypeFiles(threeTypesDir);

	// Create a TypeScript program with all type files
	const program = ts.createProgram(typeFiles, {
		target: ts.ScriptTarget.ES2020,
		module: ts.ModuleKind.ESNext,
	});

	const checker = program.getTypeChecker();
	const threeClasses = new Map();

	// Process each source file
	for (const sourceFile of program.getSourceFiles()) {
		if (!sourceFile) continue;
		if (
			!sourceFile.fileName.includes('node_modules/@types/three') &&
			!sourceFile.fileName.includes('node_modules/three/types')
		) {
			continue;
		}

		// Process top-level declarations
		ts.forEachChild(sourceFile, (node) => {
			// Handle class declarations
			if (ts.isClassDeclaration(node) && node.name) {
				const className = node.name.text;
				const classType = checker.getTypeAtLocation(node);
				const properties = getPropertiesFromType(classType, checker);

				threeClasses.set(className, Array.from(properties.values()));
			}
			// Handle interface declarations
			else if (ts.isInterfaceDeclaration(node) && node.name) {
				const interfaceName = node.name.text;
				const interfaceType = checker.getTypeAtLocation(node);
				const properties = getPropertiesFromType(interfaceType, checker);

				threeClasses.set(interfaceName, Array.from(properties.values()));
			}
			// Handle namespace/module declarations (for THREE namespace)
			else if (
				ts.isModuleDeclaration(node) &&
				node.name.kind === ts.SyntaxKind.Identifier &&
				node.name.text === 'THREE'
			) {
				processThreeNamespace(node);
			}
		});
	}

	function processThreeNamespace(node) {
		// Get the module body
		const body = node.body;
		if (!body || !ts.isModuleBlock(body)) return;

		// Process each declaration in the module
		body.statements.forEach((statement) => {
			if (ts.isClassDeclaration(statement) && statement.name) {
				const className = statement.name.text;
				const classType = checker.getTypeAtLocation(statement);
				const properties = getPropertiesFromType(classType, checker);

				threeClasses.set(className, Array.from(properties.values()));
			} else if (ts.isInterfaceDeclaration(statement) && statement.name) {
				const interfaceName = statement.name.text;
				const interfaceType = checker.getTypeAtLocation(statement);
				const properties = getPropertiesFromType(interfaceType, checker);

				threeClasses.set(interfaceName, Array.from(properties.values()));
			}
		});
	}

	// Cache the result
	threeTypesCache = threeClasses;
	console.log(`Analyzed ${threeClasses.size} Three.js classes and interfaces`);

	return threeClasses;
}

// Export a function to get properties for a specific Three class
export function getThreeClassProperties(className) {
	const allClasses = analyzeThreeTypes();
	return allClasses.get(className) || [];
}

// Export a function to get all Three classes and their properties
export function getAllThreeClassProperties() {
	return analyzeThreeTypes();
}
