import { ElementRef } from '@angular/core';
import { NgtObject3DNode, resolveRef } from 'angular-three';
import {
	BufferGeometry,
	Color,
	Group,
	InstancedMesh,
	Intersection,
	Material,
	Matrix4,
	Mesh,
	MeshBasicMaterial,
	Raycaster,
} from 'three';

export type NgtPositionMesh = NgtObject3DNode<PositionMesh, typeof PositionMesh>;

const _instanceLocalMatrix = new Matrix4();
const _instanceWorldMatrix = new Matrix4();
const _instanceIntersects: Intersection[] = [];
const _mesh = new Mesh<BufferGeometry, MeshBasicMaterial>();

export class PositionMesh extends Group {
	color: Color;
	instance: ElementRef<InstancedMesh> | InstancedMesh | null | undefined;

	constructor() {
		super();
		this.color = new Color('white');
		this.instance = undefined;
	}

	// This will allow the virtual instance have bounds
	get geometry() {
		return resolveRef(this.instance)?.geometry;
	}

	// And this will allow the virtual instance to receive events
	override raycast(raycaster: Raycaster, intersects: Intersection[]) {
		const parent = resolveRef(this.instance);
		if (!parent) return;
		if (!parent.geometry || !parent.material) return;
		_mesh.geometry = parent.geometry;
		const matrixWorld = parent.matrixWorld;
		const instanceId = parent.userData['instances'].indexOf(this);
		// If the instance wasn't found or exceeds the parents draw range, bail out
		if (instanceId === -1 || instanceId > parent.count) return;
		// calculate the world matrix for each instance
		parent.getMatrixAt(instanceId, _instanceLocalMatrix);
		_instanceWorldMatrix.multiplyMatrices(matrixWorld, _instanceLocalMatrix);
		// the mesh represents this single instance
		_mesh.matrixWorld = _instanceWorldMatrix;
		// raycast side according to instance material
		if (parent.material instanceof Material) _mesh.material.side = parent.material.side;
		else _mesh.material.side = parent.material[0].side;
		_mesh.raycast(raycaster, _instanceIntersects);
		// process the result of raycast
		for (let i = 0, l = _instanceIntersects.length; i < l; i++) {
			const intersect = _instanceIntersects[i];
			intersect.instanceId = instanceId;
			intersect.object = this;
			intersects.push(intersect);
		}
		_instanceIntersects.length = 0;
	}
}

declare global {
	interface HTMLElementTagNameMap {
		/**
		 * @extends ngt-group
		 * @rawOptions instance|color
		 */
		'ngt-position-mesh': NgtPositionMesh;
	}
}
