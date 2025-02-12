import type { Object3D } from 'three';
import type { GltfGeneratorSchema } from '../gltf';

export class GenerateNGT {
	ngtTypes = new Set<string>();
	args = false;

	constructor(
		// @ts-expect-error - type only import
		private analyzedGLTF: import('@rosskevin/gltfjsx').AnalyzedGLTF,
		private options: GltfGeneratorSchema,
	) {}

	async generate() {
		return this.analyzedGLTF.gltf.scene.children.map((child) => this.print(child)).join('\n');
	}

	async print(obj: Object3D) {
		const { nodeName, isRemoved, isTargetedLight, isInstancedMesh, sanitizeName } = await import(
			'@rosskevin/gltfjsx'
		);

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
	 * Transforms a type like "mesh" into "ngt-mesh".
	 * @param {string} type
	 * @returns
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

// export async function generateNGT(
// 	// @ts-expect-error - type only import
// 	analyzedGLTF: import('@rosskevin/gltfjsx').AnalyzedGLTF,
// ) {}
//
// function generate(obj: Object3D) {}
