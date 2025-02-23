import { existsSync, mkdirSync, writeFileSync } from 'fs';
import * as THREE from 'three';
import {
	AnimationClip,
	Bone,
	Box3,
	BufferAttribute,
	BufferGeometry,
	Camera,
	Color,
	Curve,
	Euler,
	Layers,
	Light,
	Line3,
	Material,
	Matrix3,
	Matrix4,
	Object3D,
	Path,
	Plane,
	Quaternion,
	Raycaster,
	Shape,
	Skeleton,
	Sphere,
	Texture,
	Triangle,
	Vector2,
	Vector3,
	Vector4,
	WebGLRenderTarget,
} from 'three';
import { COMMON_ATTRIBUTES, COMMON_EVENTS, OBJECT3D_EVENTS } from './common-attributes.mjs';
import { EVENT_TYPE_MAP } from './event-types.mjs';
import { MATH_TYPE_MAP } from './math-types.mjs';
import { ELEMENT_METADATA, NGT_THREE_ELEMENTS } from './three-elements-map.mjs';
import { KNOWN_PROPERTIES } from './three-properties-map.mjs';

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
	'parent',
	'children',
	'name',
	'userData',
	'up',
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

function analyzeConstructorArgs(ThreeClass) {
	try {
		const constructorString = ThreeClass.toString();
		const match = constructorString.match(/constructor\s*\((.*?)\)\s*\{/);
		if (match) {
			const params = match[1];
			let result = [];
			let depth = 0;
			let current = '';
			let inDefault = false;

			for (let i = 0; i < params.length; i++) {
				const char = params[i];

				if (char === '(' || char === '[' || char === '{') {
					depth++;
					if (!inDefault) current += char;
				} else if (char === ')' || char === ']' || char === '}') {
					depth--;
					if (!inDefault) current += char;
				} else if (char === '=' && depth === 0) {
					inDefault = true;
				} else if (char === ',' && depth === 0) {
					result.push(current.trim());
					current = '';
					inDefault = false;
				} else if (!inDefault) {
					current += char;
				}
			}

			if (current.trim()) {
				result.push(current.trim());
			}

			return result.filter(Boolean);
		}
	} catch (e) {
		console.warn(`Could not analyze constructor args for ${ThreeClass.name}`);
	}
	return [];
}

function analyzeInstanceProperties(instance, ThreeClass) {
	const properties = new Map();
	const constructorArgs = analyzeConstructorArgs(ThreeClass);

	if (constructorArgs.length) {
		properties.set('__ngt_args__', { type: 'array', constructorArgs });
	}

	for (const [propName, propValue] of Object.entries(instance)) {
		// Skip functions, internal properties, and properties to skip
		if (
			typeof propValue === 'function' ||
			propName.startsWith('_') ||
			PROPERTIES_TO_SKIP.includes(propName) ||
			skipIs(propName) ||
			skipAction(propName) ||
			skipLastNumber(propName)
		)
			continue;

		const mathType = Object.entries(MATH_TYPE_MAP).find(([key]) => {
			switch (key) {
				case 'Vector2':
					return propValue instanceof Vector2;
				case 'Vector3':
					return propValue instanceof Vector3;
				case 'Vector4':
					return propValue instanceof Vector4;
				case 'Color':
					return propValue instanceof Color;
				case 'Euler':
					return propValue instanceof Euler;
				case 'Matrix3':
					return propValue instanceof Matrix3;
				case 'Matrix4':
					return propValue instanceof Matrix4;
				case 'Quaternion':
					return propValue instanceof Quaternion;
				case 'Layers':
					return propValue instanceof Layers;
				default:
					return false;
			}
		});

		if (mathType) {
			const [, typeInfo] = mathType;
			properties.set(propName, { type: typeInfo.type, mathType: true, accepts: typeInfo.accepts });
		} else {
			// Handle non-math type properties
			let type = typeof propValue;
			if (propValue === null) {
				type = 'any';
			} else if (Array.isArray(propValue)) {
				type = 'array';
			} else if (propValue instanceof Object3D) {
				type = 'THREE.Object3D';
			} else if (propValue instanceof Material) {
				type = 'THREE.Material';
			} else if (propValue instanceof BufferGeometry) {
				type = 'THREE.BufferGeometry';
			} else if (propValue instanceof Texture) {
				type = 'THREE.Texture';
			} else if (propValue instanceof BufferAttribute) {
				type = 'THREE.BufferAttribute';
			} else if (propValue instanceof Event) {
				type = 'THREE.Event';
			} else if (propValue instanceof WebGLRenderTarget) {
				type = 'THREE.WebGLRenderTarget';
			} else if (propValue instanceof Light) {
				type = 'THREE.Light';
			} else if (propValue instanceof Camera) {
				type = 'THREE.Camera';
			} else if (propValue instanceof Bone) {
				type = 'THREE.Bone';
			} else if (propValue instanceof AnimationClip) {
				type = 'THREE.AnimationClip';
			} else if (propValue instanceof Skeleton) {
				type = 'THREE.Skeleton';
			} else if (propValue instanceof Raycaster) {
				type = 'THREE.Raycaster';
			} else if (propValue instanceof Curve) {
				type = 'THREE.Curve';
			} else if (propValue instanceof Shape) {
				type = 'THREE.Shape';
			} else if (propValue instanceof Path) {
				type = 'THREE.Path';
			} else if (propValue instanceof Box3) {
				type = 'THREE.Box3';
			} else if (propValue instanceof Sphere) {
				type = 'THREE.Sphere';
			} else if (propValue instanceof Plane) {
				type = 'THREE.Plane';
			} else if (propValue instanceof Line3) {
				type = 'THREE.Line3';
			} else if (propValue instanceof Triangle) {
				type = 'THREE.Triangle';
			}

			properties.set(propName, {
				type,
				value: type === 'object' ? undefined : propValue,
			});
		}
	}

	return Array.from(properties.entries()).map(([name, info]) => ({
		name,
		...info,
	}));
}

function generateEventMetadata(isObject3D) {
	const events = [...COMMON_EVENTS];

	if (isObject3D) {
		events.push(
			...OBJECT3D_EVENTS,
			...Object.entries(EVENT_TYPE_MAP).map(([name, info]) => ({
				name: `(${name})`,
				type: info.type,
				properties: info.properties,
				description: `Pointer ${name} event`,
			})),
		);
	}

	return events;
}

function buildThreeElementsMap() {
	const map = new Map();

	// Create Object3D instance once to get its properties
	const object3DInstance = new Object3D();
	const object3DProperties = analyzeInstanceProperties(object3DInstance, Object3D)
		.filter((prop) => prop.name !== '__ngt_args__')
		.map((prop) => ({
			name: prop.name,
			type: prop.type,
			accepts: prop.mathType ? prop.accepts : undefined,
		}));

	if (object3DProperties.every((prop) => prop.name !== 'raycast')) {
		object3DProperties.push(
			{ name: 'raycast', type: 'THREE.Raycaster', accepts: ['THREE.Raycaster'] },
			{ name: '[raycast]', type: 'THREE.Raycaster', accepts: ['THREE.Raycaster'] },
		);
	}

	for (const [elementName, threeName] of Object.entries(NGT_THREE_ELEMENTS)) {
		if (!threeName) {
			map.set(elementName, { special: true, ...ELEMENT_METADATA[elementName] });
			continue;
		}

		try {
			const ThreeClass = THREE[threeName];
			let instance;

			try {
				instance = new ThreeClass();
			} catch (e) {
				// If we can't instantiate, check if we have known properties
				const knownProps = KNOWN_PROPERTIES[threeName];
				if (knownProps) {
					const properties = [...knownProps.properties];
					if (knownProps.isObject3D) {
						properties.push(...object3DProperties.map((prop) => prop.name));
					}
					map.set(elementName, {
						threeName,
						isObject3D: knownProps.isObject3D,
						properties: properties.map((prop) => {
							const object3DProp = object3DProperties.find((p) => p.name === prop);
							if (object3DProp) {
								return object3DProp;
							}
							return { name: prop, type: 'any' };
						}),
					});
				} else {
					console.warn(`Could not instantiate ${threeName} and no known properties found:`, e);
				}
				continue;
			}

			const isObject3D = instance instanceof Object3D;
			const properties = analyzeInstanceProperties(instance, ThreeClass);

			if (isObject3D) {
				properties.push(...object3DProperties);
			}

			map.set(elementName, { threeName, isObject3D, properties });
		} catch (e) {
			console.warn(`Could not process ${threeName}:`, e);
			continue;
		}
	}

	return map;
}

function generateMetadata(threeMap) {
	return Array.from(threeMap).map(([elementName, info]) => {
		if (info.special) {
			return {
				name: elementName,
				description: info.description,
				attributes: [
					...COMMON_ATTRIBUTES,
					...(info.properties || []).map((prop) => ({
						name: prop.name,
						type: prop.type,
						description: prop.description,
					})),
				],
				events: [...COMMON_EVENTS],
			};
		}

		const element = {
			name: elementName,
			attributes: [
				...COMMON_ATTRIBUTES,
				...info.properties.map((prop) => {
					if (prop.name === '__ngt_args__') {
						return {
							name: prop.name,
							type: 'array',
							constructorArgs: prop.constructorArgs,
							description: 'Constructor arguments',
						};
					}

					return {
						name: prop.name,
						type: prop.type,
						accepts: prop.mathType ? prop.accepts : undefined,
						description: prop.mathType
							? `Math property accepting: ${prop.accepts.join(' | ')}`
							: 'Property',
					};
				}),
				...info.properties
					.filter((prop) => prop.name !== '__ngt_args__')
					.map((prop) => ({
						name: `[${prop.name}]`,
						type: prop.type,
						accepts: prop.mathType ? prop.accepts : undefined,
						description: `Bound ${prop.name} property`,
					})),
			],
			events: generateEventMetadata(info.isObject3D),
		};

		return element;
	});
}

function generateFiles() {
	const threeMap = buildThreeElementsMap();
	const elements = generateMetadata(threeMap);

	const metadataJson = {
		$schema:
			'https://raw.githubusercontent.com/microsoft/vscode-html-languageservice/main/docs/customData.schema.json',
		version: 1.1,
		tags: elements.map((element) => {
			return {
				name: element.name,
				attributes: element.attributes.map((attr) => ({
					name: attr.name,
					description: attr.description,
				})),
			};
		}),
	};

	const webTypesJson = {
		$schema: 'https://raw.githubusercontent.com/JetBrains/web-types/master/schema/web-types.json',
		framework: 'angular',
		name: 'angular-three',
		version: '2.0',
		contributions: {
			html: {
				elements: elements.map((element) => {
					return {
						name: element.name,
						attributes: element.attributes.map((attr) => ({
							name: attr.name,
							description: attr.description,
						})),
					};
				}),
			},
		},
	};

	// Ensure directories exist
	['dist/libs/core', 'node_modules/angular-three'].forEach((dir) => {
		if (!existsSync(dir)) {
			mkdirSync(dir, { recursive: true });
		}
	});

	// Write files
	writeFileSync('dist/libs/core/metadata.json', JSON.stringify(metadataJson, null, 2));
	writeFileSync('dist/libs/core/web-types.json', JSON.stringify(webTypesJson, null, 2));
	writeFileSync('node_modules/angular-three/metadata.json', JSON.stringify(metadataJson, null, 2));
	writeFileSync('node_modules/angular-three/web-types.json', JSON.stringify(webTypesJson, null, 2));
}

generateFiles();
