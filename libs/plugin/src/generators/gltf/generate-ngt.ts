import type { Object3D } from 'three';
import type { GltfGeneratorSchema } from './gltf';

/**
 * Generates Angular Three template code from an analyzed GLTF model.
 *
 * This class traverses the GLTF scene graph and produces Angular template
 * syntax with proper ngt-* elements, input bindings, and type information.
 */
export class GenerateNGT {
	/** Set of Three.js types used in the model, for generating imports */
	ngtTypes = new Set<string>();
	/** Whether NgtArgs directive is needed (for primitives, bones, etc.) */
	args = false;

	constructor(
		// @ts-expect-error - type only import
		private analyzedGLTF: import('@rosskevin/gltfjsx').AnalyzedGLTF,
		// @ts-expect-error - type only import
		private gltfjsxAPI: typeof import('@rosskevin/gltfjsx'),
		private options: GltfGeneratorSchema,
	) {}

	/**
	 * Generates the Angular template content for the GLTF scene.
	 *
	 * @returns Template string containing ngt-* elements for all scene children
	 */
	generate() {
		return this.analyzedGLTF.gltf.scene.children.map((child) => this.print(child)).join('\n');
	}

	/**
	 * Collects and returns options needed for the template file generation.
	 *
	 * @returns Object containing imports, type definitions, and feature flags
	 */
	getGenerateOptions() {
		const perspective = this.ngtTypes.has('PerspectiveCamera');
		const orthographic = this.ngtTypes.has('OrthographicCamera');

		const angularImports = [];
		if (this.args) angularImports.push('NgtArgs');
		if (perspective) angularImports.push('NgtsPerspectiveCamera');
		if (orthographic) angularImports.push('NgtsOrthographicCamera');

		const meshesTypes = this.analyzedGLTF
			.getMeshes()
			.map(({ name, type }) => "\'" + name + "\'" + ': THREE.' + type)
			.join(';\n');
		const bonesTypes = this.analyzedGLTF
			.getBones()
			.map(({ name, type }) => "\'" + name + "\'" + ': THREE.' + type)
			.join(';\n');
		const materialsTypes = this.analyzedGLTF
			.getMaterials()
			.map(({ name, type }) => "\'" + name + "\'" + ': THREE.' + type)
			.join(';\n');

		this.analyzedGLTF.options.log.debug({ materialsTypes });

		const animations = this.analyzedGLTF.gltf.animations || [];

		const gltfExtras = this.analyzedGLTF.gltf.parser.json.asset && this.analyzedGLTF.gltf.parser.json.asset.extras;
		const extras = gltfExtras
			? Object.keys(gltfExtras)
					.map((key) => `${key.charAt(0).toUpperCase() + key.slice(1)}: ${gltfExtras[key]}`)
					.join('\n')
			: '';

		const ngtTypesArr = this.ngtTypesArr;
		const threeImports = ngtTypesArr.length ? `, ${ngtTypesArr.join(',')}` : '';

		return {
			animations,
			extras,
			threeImports,
			args: this.args,
			perspective,
			orthographic,
			meshesTypes,
			bonesTypes,
			materialsTypes,
			angularImports,
		};
	}

	/**
	 * Filters ngtTypes to only include types that need explicit imports.
	 * Excludes Group (always top-level), cameras (use ngts-* components), Bone, and Object3D.
	 */
	private get ngtTypesArr() {
		return Array.from(this.ngtTypes).filter(
			(t) =>
				// group always is the top-level object
				t !== 'Group' &&
				// we render ngts-perspective-camera instead of ngt-perspective-camera
				t !== 'PerspectiveCamera' &&
				// we render ngts-orthographic-camera instead of ngt-orthographic-camera
				t !== 'OrthographicCamera' &&
				// we don't render ngt-bone
				t !== 'Bone' &&
				// we don't render ngt-object3D
				t !== 'Object3D',
		);
	}

	/**
	 * Recursively prints an Object3D and its children as Angular template elements.
	 *
	 * @param obj - The Three.js Object3D to convert
	 * @returns Template string for this object and its descendants
	 */
	private print(obj: Object3D) {
		const { nodeName, isRemoved, isTargetedLight, isInstancedMesh, sanitizeName } = this.gltfjsxAPI;

		let result = '';
		let children = '';

		// Children
		if (obj.children) obj.children.forEach((child) => (children += this.print(child)));

		// Bail out if the object was pruned
		if (isRemoved(obj)) return children;

		const { bones } = this.options;
		const node = nodeName(obj);
		const type = this.getType(obj);

		// Bail out on bones
		if (!bones && type === 'bone') {
			this.args = true;
			return `<ngt-primitive *args=[${node}] />\n`;
		}

		const ngtType = this.getAngularThreeElement(type);
		if (isTargetedLight(obj)) {
			this.args = true;
			return `<${ngtType} ${this.handleAngularInputs(obj)} [target]="${node}.target">
  <ngt-primitive *args="[${node}.target]" ${this.handleAngularInputs(obj.target)} />
</${ngtType}>`;
		}

		// TODO: Instances are currently not supported for NGT components
		//
		if (isInstancedMesh(obj)) {
			const geo = `${node}.geometry`;
			const mat =
				'name' in obj.material ? `materials${sanitizeName(obj.material.name)}` : `gltf.${node}.material`;
			this.args = true;
			result = `<ngt-instanced-mesh *args="[${geo}, ${mat}, ${!obj.count ? `gltf.${node}.count` : obj.count}]" `;
		} else {
			if (type === 'bone') {
				this.args = true;
				result = `<ngt-primitive *args="[${node}]" `;
			} else {
				result = `<${this.getAngularThreeElement(type)} `;
			}
		}

		let shoudSkipName = false;
		if (
			obj.name.length &&
			'morphTargetDictionary' in obj &&
			!!obj.morphTargetDictionary &&
			this.analyzedGLTF.hasAnimations()
		) {
			shoudSkipName = true;
			result += `name="${obj.name}" `;
		}

		result += this.handleAngularInputs(obj, shoudSkipName);

		if (children.length) {
			// Add children and close the element's tag
			result += `>
      ${children}
      </${ngtType}>`;
		} else {
			// Close this element's tag
			result += `/>`;
		}

		return result;
	}

	/**
	 * Converts Object3D properties to Angular input binding syntax.
	 *
	 * @param obj - The Object3D to extract properties from
	 * @param skipName - Whether to skip the name property
	 * @returns String of Angular input bindings (e.g., '[position]="..." [rotation]="..."')
	 */
	private handleAngularInputs(obj: Object3D, skipName = false) {
		const properties = this.analyzedGLTF.calculateProps(obj);

		let propertiesString = '';

		for (const key in properties) {
			const value = properties[key];

			if (key === 'name') {
				if (skipName) continue;
				propertiesString += `name="${value}" `;
				continue;
			}

			if (value === true) {
				// i.e: castShadow, receiveShadow
				propertiesString += `${key} `;
				continue;
			}

			propertiesString += `[${key}]="${value}" `;
		}

		return propertiesString;
	}

	/**
	 * Determines the type name for an Object3D, handling special cases.
	 *
	 * @param obj - The Object3D to get the type for
	 * @returns Lowercase type name (e.g., 'mesh', 'group', 'PerspectiveCamera')
	 */
	private getType(obj: Object3D) {
		let type = obj.type.charAt(0).toLowerCase() + obj.type.slice(1);

		if (type === 'object3D') {
			type = 'group';
			this.ngtTypes.add('Group');
		}

		if (type === 'perspectiveCamera') type = 'PerspectiveCamera';
		if (type === 'orthographicCamera') type = 'OrthographicCamera';

		this.ngtTypes.add(obj.type);

		return type;
	}

	/**
	 * Transforms a type name into its Angular Three element selector.
	 *
	 * @param type - The type name (e.g., 'mesh', 'perspectiveCamera')
	 * @returns The Angular Three element selector (e.g., 'ngt-mesh', 'ngts-perspective-camera')
	 */
	private getAngularThreeElement(type: string) {
		if (type === 'object3D') {
			return 'ngt-object3D';
		}

		if (type === 'lOD') {
			return 'ngt-lod';
		}

		if (type === 'perspectiveCamera') {
			return `ngts-perspective-camera`;
		}

		if (type === 'orthographicCamera') {
			return `ngts-orthographic-camera`;
		}

		const kebabType = type.replace(/([A-Z])/g, '-$1').toLowerCase();
		return `ngt-${kebabType}`;
	}
}
