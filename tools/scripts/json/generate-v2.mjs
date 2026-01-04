/**
 * Angular Three Web-Types & Metadata Generator v2
 *
 * Improvements over v1:
 * - Proper Angular web-types structure with js.properties and js.events
 * - Auto-discovers THREE classes from @types/three
 * - Single source of truth for element definitions
 * - Proper type references with module info
 * - Source references for go-to-definition
 * - Doc URLs pointing to Three.js documentation
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
	packageName: 'angular-three',
	version: '3.0.0',
	threeDocsBaseUrl: 'https://threejs.org/docs/#api/en',
	outputPaths: {
		dist: 'dist/libs/core',
		nodeModules: 'node_modules/angular-three',
	},
};

// Properties to skip when extracting from THREE classes
const PROPERTIES_TO_SKIP = new Set([
	'type',
	'uuid',
	'id',
	'parent',
	'children',
	'userData',
	// Methods
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
	'dispose',
]);

// Prefixes that indicate methods we should skip
const METHOD_PREFIXES = ['set', 'add', 'has', 'apply', 'update', 'get', 'is', '_on', 'listen', 'stopListen'];

// Math types that accept special Angular Three input formats
const MATH_TYPE_MAP = {
	Vector2: {
		ngtType: 'NgtVector2',
		accepts: 'THREE.Vector2 | [number, number] | number',
	},
	Vector3: {
		ngtType: 'NgtVector3',
		accepts: 'THREE.Vector3 | [number, number, number] | number',
	},
	Vector4: {
		ngtType: 'NgtVector4',
		accepts: 'THREE.Vector4 | [number, number, number, number] | number',
	},
	Color: {
		ngtType: 'NgtColor',
		accepts: 'THREE.Color | string | number | [number, number, number]',
	},
	Euler: {
		ngtType: 'NgtEuler',
		accepts: 'THREE.Euler | [number, number, number] | [number, number, number, EulerOrder]',
	},
	Quaternion: {
		ngtType: 'NgtQuaternion',
		accepts: 'THREE.Quaternion | [number, number, number, number]',
	},
	Matrix3: {
		ngtType: 'NgtMatrix3',
		accepts: 'THREE.Matrix3 | number[]',
	},
	Matrix4: {
		ngtType: 'NgtMatrix4',
		accepts: 'THREE.Matrix4 | number[]',
	},
	Layers: {
		ngtType: 'NgtLayers',
		accepts: 'THREE.Layers | number',
	},
};

// THREE.js class categories for documentation URLs
const THREE_CATEGORIES = {
	// Objects
	Object3D: 'core',
	Scene: 'scenes',
	Group: 'objects',
	Mesh: 'objects',
	InstancedMesh: 'objects',
	SkinnedMesh: 'objects',
	Bone: 'objects',
	Line: 'objects',
	LineLoop: 'objects',
	LineSegments: 'objects',
	Points: 'objects',
	Sprite: 'objects',
	LOD: 'objects',

	// Cameras
	Camera: 'cameras',
	PerspectiveCamera: 'cameras',
	OrthographicCamera: 'cameras',
	CubeCamera: 'cameras',
	ArrayCamera: 'cameras',

	// Lights
	Light: 'lights',
	AmbientLight: 'lights',
	DirectionalLight: 'lights',
	HemisphereLight: 'lights',
	PointLight: 'lights',
	SpotLight: 'lights',
	RectAreaLight: 'lights',
	LightProbe: 'lights',

	// Materials
	Material: 'materials',
	MeshBasicMaterial: 'materials',
	MeshStandardMaterial: 'materials',
	MeshPhysicalMaterial: 'materials',
	MeshPhongMaterial: 'materials',
	MeshLambertMaterial: 'materials',
	MeshToonMaterial: 'materials',
	MeshNormalMaterial: 'materials',
	MeshDepthMaterial: 'materials',
	MeshDistanceMaterial: 'materials',
	MeshMatcapMaterial: 'materials',
	LineBasicMaterial: 'materials',
	LineDashedMaterial: 'materials',
	PointsMaterial: 'materials',
	SpriteMaterial: 'materials',
	ShaderMaterial: 'materials',
	RawShaderMaterial: 'materials',
	ShadowMaterial: 'materials',

	// Geometries
	BufferGeometry: 'core',
	BoxGeometry: 'geometries',
	CapsuleGeometry: 'geometries',
	CircleGeometry: 'geometries',
	ConeGeometry: 'geometries',
	CylinderGeometry: 'geometries',
	DodecahedronGeometry: 'geometries',
	EdgesGeometry: 'geometries',
	ExtrudeGeometry: 'geometries',
	IcosahedronGeometry: 'geometries',
	LatheGeometry: 'geometries',
	OctahedronGeometry: 'geometries',
	PlaneGeometry: 'geometries',
	PolyhedronGeometry: 'geometries',
	RingGeometry: 'geometries',
	ShapeGeometry: 'geometries',
	SphereGeometry: 'geometries',
	TetrahedronGeometry: 'geometries',
	TorusGeometry: 'geometries',
	TorusKnotGeometry: 'geometries',
	TubeGeometry: 'geometries',
	WireframeGeometry: 'geometries',
	InstancedBufferGeometry: 'core',

	// Textures
	Texture: 'textures',
	CanvasTexture: 'textures',
	CompressedTexture: 'textures',
	CubeTexture: 'textures',
	DataTexture: 'textures',
	Data3DTexture: 'textures',
	DepthTexture: 'textures',
	VideoTexture: 'textures',

	// Helpers
	ArrowHelper: 'helpers',
	AxesHelper: 'helpers',
	BoxHelper: 'helpers',
	Box3Helper: 'helpers',
	CameraHelper: 'helpers',
	DirectionalLightHelper: 'helpers',
	GridHelper: 'helpers',
	HemisphereLightHelper: 'helpers',
	PlaneHelper: 'helpers',
	PointLightHelper: 'helpers',
	PolarGridHelper: 'helpers',
	SkeletonHelper: 'helpers',
	SpotLightHelper: 'helpers',

	// Audio
	Audio: 'audio',
	AudioListener: 'audio',
	PositionalAudio: 'audio',

	// Math
	Vector2: 'math',
	Vector3: 'math',
	Vector4: 'math',
	Euler: 'math',
	Matrix3: 'math',
	Matrix4: 'math',
	Quaternion: 'math',
	Color: 'math',

	// Other
	Raycaster: 'core',
	BufferAttribute: 'core',
	InstancedBufferAttribute: 'core',
	Fog: 'scenes',
	FogExp2: 'scenes',
	Shape: 'extras/core',
};

// Object3D event handlers (pointer events)
const OBJECT3D_EVENTS = [
	{ name: 'click', type: 'NgtThreeEvent<MouseEvent>', description: 'Fires when the object is clicked' },
	{ name: 'contextmenu', type: 'NgtThreeEvent<MouseEvent>', description: 'Fires on right-click' },
	{ name: 'dblclick', type: 'NgtThreeEvent<MouseEvent>', description: 'Fires on double-click' },
	{ name: 'pointerup', type: 'NgtThreeEvent<PointerEvent>', description: 'Fires when pointer is released' },
	{ name: 'pointerdown', type: 'NgtThreeEvent<PointerEvent>', description: 'Fires when pointer is pressed' },
	{ name: 'pointerover', type: 'NgtThreeEvent<PointerEvent>', description: 'Fires when pointer enters object' },
	{ name: 'pointerout', type: 'NgtThreeEvent<PointerEvent>', description: 'Fires when pointer leaves object' },
	{ name: 'pointerenter', type: 'NgtThreeEvent<PointerEvent>', description: 'Fires when pointer enters (no bubble)' },
	{ name: 'pointerleave', type: 'NgtThreeEvent<PointerEvent>', description: 'Fires when pointer leaves (no bubble)' },
	{ name: 'pointermove', type: 'NgtThreeEvent<PointerEvent>', description: 'Fires when pointer moves over object' },
	{ name: 'pointermissed', type: 'MouseEvent', description: 'Fires when click misses all objects' },
	{ name: 'pointercancel', type: 'NgtThreeEvent<PointerEvent>', description: 'Fires when pointer is cancelled' },
	{ name: 'wheel', type: 'NgtThreeEvent<WheelEvent>', description: 'Fires on mouse wheel' },
];

// Common node events (available on all elements)
const NODE_EVENTS = [
	{ name: 'attached', type: 'NgtAfterAttach', description: 'Fires after the element is attached to its parent' },
	{ name: 'updated', type: 'T', description: 'Fires when the element properties are updated' },
	{ name: 'created', type: 'T', description: 'Fires when the element is created' },
	{ name: 'disposed', type: 'ThreeDisposeEvent', description: 'Fires when the element is disposed' },
	{ name: 'beforeRender', type: 'NgtBeforeRenderEvent<T>', description: 'Fires every frame in the animation loop' },
];

// Common attributes available on all ngt-* elements
const COMMON_ATTRIBUTES = [
	{
		name: 'attach',
		description: 'Property path to attach to parent (e.g., "material", "geometry")',
		value: { kind: 'plain', type: 'string' },
	},
	{
		name: '[attach]',
		description: 'Dynamic attach path or attach function',
		value: { kind: 'expression', type: 'string | string[] | NgtAttachFunction' },
	},
	{
		name: '[parameters]',
		description: 'Object of properties to apply to the instance',
		value: { kind: 'expression', type: 'Partial<T>' },
	},
	{
		name: '[dispose]',
		description: 'Custom dispose function or null to prevent auto-dispose',
		value: { kind: 'expression', type: '(() => void) | null' },
	},
];

// ============================================================================
// Type Analysis
// ============================================================================

/**
 * Find the @types/three directory
 */
function findThreeTypesDir() {
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
}

/**
 * Get all .d.ts files recursively
 */
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

/**
 * Map TypeScript type string to a simpler type for metadata
 */
function mapTypeToSimple(typeString) {
	// Check for math types first
	for (const [mathType, info] of Object.entries(MATH_TYPE_MAP)) {
		if (typeString.includes(mathType)) {
			return info.ngtType;
		}
	}

	if (typeString.includes('number')) return 'number';
	if (typeString.includes('string')) return 'string';
	if (typeString.includes('boolean')) return 'boolean';
	if (typeString.includes('Material')) return 'THREE.Material';
	if (typeString.includes('Texture')) return 'THREE.Texture';
	if (typeString.includes('Object3D')) return 'THREE.Object3D';
	if (typeString.includes('BufferGeometry')) return 'THREE.BufferGeometry';
	if (typeString.includes('BufferAttribute')) return 'THREE.BufferAttribute';
	if (typeString.includes('Array') || typeString.includes('[]')) return 'array';

	return 'any';
}

/**
 * Check if a property name should be skipped
 */
function shouldSkipProperty(name) {
	if (PROPERTIES_TO_SKIP.has(name)) return true;
	if (name.startsWith('_')) return true;
	if (name.endsWith('0')) return true; // Skip things like matrix0

	for (const prefix of METHOD_PREFIXES) {
		if (name.startsWith(prefix) && name.length > prefix.length) {
			// Check if next char is uppercase (indicating method like setPosition)
			const nextChar = name[prefix.length];
			if (nextChar === nextChar.toUpperCase()) return true;
		}
	}

	return false;
}

/**
 * Extract properties from a TypeScript type
 */
function getPropertiesFromType(type, checker) {
	const properties = new Map();

	const typeProperties = checker.getPropertiesOfType(type);
	for (const prop of typeProperties) {
		const propName = prop.getName();

		if (shouldSkipProperty(propName)) continue;

		const declarations = prop.getDeclarations();
		if (!declarations || declarations.length === 0) continue;

		const declaration = declarations[0];
		// Skip methods
		if (ts.isMethodDeclaration(declaration) || ts.isMethodSignature(declaration)) continue;

		const propType = checker.getTypeOfSymbolAtLocation(prop, declaration);
		const typeString = checker.typeToString(propType);

		// Check if it's a math type
		let isMathType = false;
		let mathTypeInfo = null;
		for (const [mathTypeName, info] of Object.entries(MATH_TYPE_MAP)) {
			if (typeString.includes(mathTypeName)) {
				isMathType = true;
				mathTypeInfo = info;
				break;
			}
		}

		properties.set(propName, {
			name: propName,
			type: isMathType ? mathTypeInfo.ngtType : mapTypeToSimple(typeString),
			rawType: typeString,
			isMathType,
			accepts: isMathType ? mathTypeInfo.accepts : undefined,
		});
	}

	return properties;
}

/**
 * Analyze Three.js types and build a map of class -> properties
 */
function analyzeThreeTypes() {
	console.log('Analyzing Three.js type definitions...');

	const threeTypesDir = findThreeTypesDir();
	const typeFiles = getAllTypeFiles(threeTypesDir);

	const program = ts.createProgram(typeFiles, {
		target: ts.ScriptTarget.ES2020,
		module: ts.ModuleKind.ESNext,
	});

	const checker = program.getTypeChecker();
	const threeClasses = new Map();

	// Track inheritance
	const inheritance = new Map();

	for (const sourceFile of program.getSourceFiles()) {
		if (!sourceFile) continue;
		if (
			!sourceFile.fileName.includes('node_modules/@types/three') &&
			!sourceFile.fileName.includes('node_modules/three/types')
		) {
			continue;
		}

		ts.forEachChild(sourceFile, (node) => {
			if (ts.isClassDeclaration(node) && node.name) {
				const className = node.name.text;
				const classType = checker.getTypeAtLocation(node);
				const properties = getPropertiesFromType(classType, checker);

				// Check for extends clause
				if (node.heritageClauses) {
					for (const clause of node.heritageClauses) {
						if (clause.token === ts.SyntaxKind.ExtendsKeyword) {
							for (const type of clause.types) {
								const baseTypeName = type.expression.getText();
								inheritance.set(className, baseTypeName);
							}
						}
					}
				}

				threeClasses.set(className, {
					properties: Array.from(properties.values()),
					extends: inheritance.get(className),
				});
			}
		});
	}

	console.log(`Analyzed ${threeClasses.size} Three.js classes`);
	return { threeClasses, inheritance };
}

// ============================================================================
// Element Definition
// ============================================================================

/**
 * Convert PascalCase to kebab-case
 */
function toKebabCase(str) {
	return str
		.replace(/([a-z])([A-Z])/g, '$1-$2')
		.replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
		.toLowerCase();
}

/**
 * Read element name mappings from three-types.ts
 * This ensures we use the exact same naming as defined in the library
 */
function getElementMappingsFromThreeTypes() {
	const threeTypesPath = resolve(__dirname, '../../../libs/core/src/lib/three-types.ts');
	const content = readFileSync(threeTypesPath, 'utf8');

	const mappings = new Map();

	// Match patterns like: 'ngt-mesh': NgtThreeElementsImpl['Mesh'];
	const regex = /'(ngt-[^']+)':\s*NgtThreeElementsImpl\['([^']+)'\]/g;
	let match;

	while ((match = regex.exec(content)) !== null) {
		const [, elementName, threeName] = match;
		mappings.set(threeName, elementName);
	}

	return mappings;
}

/**
 * Check if a class extends Object3D (directly or indirectly)
 */
function isObject3D(className, inheritance) {
	if (className === 'Object3D') return true;

	let current = className;
	const visited = new Set();

	while (current && !visited.has(current)) {
		visited.add(current);
		if (current === 'Object3D') return true;
		current = inheritance.get(current);
	}

	return false;
}

/**
 * Get the documentation URL for a THREE class
 */
function getDocUrl(className) {
	const category = THREE_CATEGORIES[className];
	if (!category) return undefined;
	return `${CONFIG.threeDocsBaseUrl}/${category}/${className}`;
}

/**
 * Build element definitions from THREE classes
 */
function buildElementDefinitions(threeClasses, inheritance) {
	const elements = [];

	// Define which THREE classes to expose as elements
	const exposedClasses = [
		// Core
		'Object3D',
		'Scene',

		// Objects
		'Mesh',
		'InstancedMesh',
		'SkinnedMesh',
		'Bone',
		'Group',
		'LOD',
		'Line',
		'LineLoop',
		'LineSegments',
		'Points',
		'Sprite',

		// Cameras
		'Camera',
		'PerspectiveCamera',
		'OrthographicCamera',
		'CubeCamera',
		'ArrayCamera',

		// Lights
		'AmbientLight',
		'DirectionalLight',
		'HemisphereLight',
		'PointLight',
		'SpotLight',
		'RectAreaLight',
		'LightProbe',

		// Materials
		'Material',
		'MeshBasicMaterial',
		'MeshStandardMaterial',
		'MeshPhysicalMaterial',
		'MeshPhongMaterial',
		'MeshLambertMaterial',
		'MeshToonMaterial',
		'MeshNormalMaterial',
		'MeshDepthMaterial',
		'MeshDistanceMaterial',
		'MeshMatcapMaterial',
		'LineBasicMaterial',
		'LineDashedMaterial',
		'PointsMaterial',
		'SpriteMaterial',
		'ShaderMaterial',
		'RawShaderMaterial',
		'ShadowMaterial',

		// Geometries
		'BufferGeometry',
		'BoxGeometry',
		'CapsuleGeometry',
		'CircleGeometry',
		'ConeGeometry',
		'CylinderGeometry',
		'DodecahedronGeometry',
		'EdgesGeometry',
		'ExtrudeGeometry',
		'IcosahedronGeometry',
		'InstancedBufferGeometry',
		'LatheGeometry',
		'OctahedronGeometry',
		'PlaneGeometry',
		'PolyhedronGeometry',
		'RingGeometry',
		'ShapeGeometry',
		'SphereGeometry',
		'TetrahedronGeometry',
		'TorusGeometry',
		'TorusKnotGeometry',
		'TubeGeometry',
		'WireframeGeometry',

		// Textures
		'Texture',
		'CanvasTexture',
		'CompressedTexture',
		'CubeTexture',
		'DataTexture',
		'Data3DTexture',
		'DepthTexture',
		'VideoTexture',

		// Helpers
		'ArrowHelper',
		'AxesHelper',
		'BoxHelper',
		'Box3Helper',
		'CameraHelper',
		'DirectionalLightHelper',
		'GridHelper',
		'HemisphereLightHelper',
		'PlaneHelper',
		'PointLightHelper',
		'PolarGridHelper',
		'SkeletonHelper',
		'SpotLightHelper',

		// Audio
		'Audio',
		'AudioListener',
		'PositionalAudio',

		// Math (as elements)
		'Vector2',
		'Vector3',
		'Vector4',
		'Euler',
		'Matrix3',
		'Matrix4',
		'Quaternion',
		'Color',

		// Other
		'Raycaster',
		'BufferAttribute',
		'Float16BufferAttribute',
		'Float32BufferAttribute',
		'Int8BufferAttribute',
		'Int16BufferAttribute',
		'Int32BufferAttribute',
		'Uint8BufferAttribute',
		'Uint16BufferAttribute',
		'Uint32BufferAttribute',
		'InstancedBufferAttribute',
		'Fog',
		'FogExp2',
		'Shape',
	];

	// Get element name mappings from three-types.ts to ensure exact naming match
	const elementMappings = getElementMappingsFromThreeTypes();

	for (const className of exposedClasses) {
		const classInfo = threeClasses.get(className);
		// Use mapping from three-types.ts if available, otherwise generate kebab-case
		const elementName = elementMappings.get(className) || `ngt-${toKebabCase(className)}`;
		const isObj3D = isObject3D(className, inheritance);

		elements.push({
			elementName,
			threeName: className,
			isObject3D: isObj3D,
			properties: classInfo?.properties || [],
			docUrl: getDocUrl(className),
		});
	}

	// Add special elements
	elements.push({
		elementName: 'ngt-primitive',
		threeName: null,
		isObject3D: true,
		properties: [],
		description: 'Container for pre-made THREE objects. Use [object] to pass the THREE instance.',
		special: true,
	});

	elements.push({
		elementName: 'ngt-value',
		threeName: null,
		isObject3D: false,
		properties: [{ name: 'rawValue', type: 'any', description: 'Raw value to attach to parent' }],
		description: 'Attaches arbitrary values to parent using the attach property.',
		special: true,
	});

	return elements;
}

// ============================================================================
// Web-Types Generation (JetBrains)
// ============================================================================

/**
 * Generate proper Angular web-types JSON
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
			name: element.elementName,
			description: element.description || `Three.js ${element.threeName || element.elementName} element`,
			'doc-url': element.docUrl,
			attributes: [...COMMON_ATTRIBUTES],
			js: {
				properties: [],
				events: [],
			},
		};

		// Add source reference if it's a THREE class
		if (element.threeName) {
			htmlElement.source = {
				module: 'three',
				symbol: element.threeName,
			};
		}

		// Add properties
		for (const prop of element.properties) {
			const jsProp = {
				name: prop.name,
				description: prop.isMathType
					? `Accepts: ${prop.accepts}`
					: prop.description || `${element.threeName}.${prop.name}`,
				type: prop.type,
			};

			// Add type reference for complex types
			if (prop.isMathType) {
				jsProp.type = {
					name: prop.type,
					module: CONFIG.packageName,
				};
			}

			htmlElement.js.properties.push(jsProp);
		}

		// Add events
		// Node events (available on all elements)
		for (const event of NODE_EVENTS) {
			htmlElement.js.events.push({
				name: event.name,
				description: event.description,
				type: event.type === 'T' ? `THREE.${element.threeName || 'Object3D'}` : event.type,
			});
		}

		// Object3D events (only for Object3D descendants)
		if (element.isObject3D) {
			for (const event of OBJECT3D_EVENTS) {
				htmlElement.js.events.push({
					name: event.name,
					description: event.description,
					type: {
						name: event.type,
						module: CONFIG.packageName,
					},
				});
			}
		}

		webTypes.contributions.html.elements.push(htmlElement);
	}

	return webTypes;
}

// ============================================================================
// VSCode Metadata Generation
// ============================================================================

/**
 * Generate VSCode custom data JSON
 */
function generateVSCodeMetadata(elements) {
	const metadata = {
		$schema:
			'https://raw.githubusercontent.com/AliasIO/AliasIO/master/packages/vscode-html-languageservice/docs/customData.schema.json',
		version: 1.1,
		tags: [],
	};

	for (const element of elements) {
		const tag = {
			name: element.elementName,
			description: {
				kind: 'markdown',
				value: element.description || `Three.js \`${element.threeName || element.elementName}\` element`,
			},
			attributes: [],
		};

		// Add common attributes
		for (const attr of COMMON_ATTRIBUTES) {
			tag.attributes.push({
				name: attr.name,
				description: attr.description,
			});
		}

		// Add properties as attributes (both plain and bound versions)
		for (const prop of element.properties) {
			const description = prop.isMathType
				? `${prop.name} - Accepts: ${prop.accepts}`
				: prop.description || `${element.threeName}.${prop.name}`;

			// Plain attribute
			tag.attributes.push({
				name: prop.name,
				description,
			});

			// Bound attribute [prop]
			tag.attributes.push({
				name: `[${prop.name}]`,
				description: `Bound ${prop.name} property`,
			});
		}

		// Add events
		for (const event of NODE_EVENTS) {
			tag.attributes.push({
				name: `(${event.name})`,
				description: event.description,
			});
		}

		if (element.isObject3D) {
			for (const event of OBJECT3D_EVENTS) {
				tag.attributes.push({
					name: `(${event.name})`,
					description: event.description,
				});
			}
		}

		metadata.tags.push(tag);
	}

	return metadata;
}

// ============================================================================
// Main
// ============================================================================

function main() {
	console.log('Angular Three Web-Types Generator v2\n');

	// Analyze THREE types
	const { threeClasses, inheritance } = analyzeThreeTypes();

	// Build element definitions
	const elements = buildElementDefinitions(threeClasses, inheritance);
	console.log(`Built ${elements.length} element definitions\n`);

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

	console.log('Generated files:');
	console.log(`  - ${CONFIG.outputPaths.dist}/web-types.json`);
	console.log(`  - ${CONFIG.outputPaths.dist}/metadata.json`);
	console.log(`  - ${CONFIG.outputPaths.nodeModules}/web-types.json`);
	console.log(`  - ${CONFIG.outputPaths.nodeModules}/metadata.json`);

	// Print summary
	const obj3dCount = elements.filter((e) => e.isObject3D).length;
	const totalProps = elements.reduce((sum, e) => sum + e.properties.length, 0);
	console.log(`\nSummary:`);
	console.log(`  - ${elements.length} elements (${obj3dCount} Object3D descendants)`);
	console.log(`  - ${totalProps} total properties`);
	console.log(`  - ${OBJECT3D_EVENTS.length} Object3D events`);
	console.log(`  - ${NODE_EVENTS.length} node events`);
}

main();
