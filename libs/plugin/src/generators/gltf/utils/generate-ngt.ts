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

	async print(obj: Object3D) {
		const { nodeName, isRemoved, isChildless, isTargetedLight, isInstancedMesh, sanitizeName } = await import(
			'@rosskevin/gltfjsx'
		);

		let result = '';
		let children = '';

		if (isRemoved(obj) && !isChildless(obj)) {
			obj.children.forEach((child) => (result += this.print(child)));
			return result;
		}

		const { bones } = this.options;
		const node = nodeName(obj);
		const type = this.getType(obj);

		// Bail out on bones
		if (!bones && type === 'bone') {
			this.args = true;
			return `<ngt-primitive *args=[gltf.${node}] />\n`;
		}

		const ngtType = this.getAngularThreeElement(type);
		if (isTargetedLight(obj)) {
			this.args = true;
			return `<${ngtType} ${this.handleAngularInputs(obj)} [target]="gltf.${node}.target">
  <ngt-primitive *args="[gltf.${node}.target]" ${this.handleAngularInputs(obj.target)} />
</${ngtType}>`;
		}

		// Collect children
		if (obj.children) obj.children.forEach((child) => (children += this.print(child)));

		// TODO: Instances are currently not supported for NGT components

		if (isInstancedMesh(obj)) {
			const geo = `gltf.${node}.geometry`;
			const mat =
				'name' in obj.material ? `gltf.materials${sanitizeName(obj.material.name)}` : `gltf.${node}.material`;
			this.args = true;
			result = `<ngt-instanced-mesh *args="[${geo}, ${mat}, ${!obj.count ? `gltf.${node}.count` : obj.count}]" `;
		} else {
			if (type === 'bone') {
				this.args = true;
				result = `<ngt-primitive *args="[gltf.${node}]" `;
			} else {
				result = `<${this.getAngularThreeElement(type)} `;
			}
		}

		if (
			obj.name.length &&
			'morphTargetDictionary' in obj &&
			!!obj.morphTargetDictionary &&
			this.analyzedGLTF.hasAnimations()
		) {
			result += `name="${obj.name}" `;
		}

		const oldResult = result;
		result += this.handleAngularInputs(obj);
		return result;
	}

	private handleAngularInputs(obj: Object3D) {
		return '';
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
