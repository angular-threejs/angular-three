import { ElementRef } from '@angular/core';
import * as THREE from 'three';

const _instanceLocalMatrix = /*@__PURE__*/ new THREE.Matrix4();
const _instanceWorldMatrix = /*@__PURE__*/ new THREE.Matrix4();
const _instanceIntersects: THREE.Intersection[] = /*@__PURE__*/ [];
const _mesh = /*@__PURE__*/ new THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>();

export class PositionMesh extends THREE.Group {
	color: THREE.Color;
	instance: ElementRef<THREE.InstancedMesh | undefined>;
	instanceKey: ElementRef<PositionMesh | undefined>;
	constructor() {
		super();
		this.color = new THREE.Color('white');
		this.instance = new ElementRef(undefined);
		this.instanceKey = new ElementRef(undefined);
	}

	// This will allow the virtual instance have bounds
	get geometry() {
		return this.instance.nativeElement?.geometry;
	}

	// And this will allow the virtual instance to receive events
	override raycast(raycaster: THREE.Raycaster, intersects: THREE.Intersection[]) {
		const parent = this.instance.nativeElement;
		if (!parent) return;
		if (!parent.geometry || !parent.material) return;
		_mesh.geometry = parent.geometry;
		const matrixWorld = parent.matrixWorld;
		const instanceId = parent.userData['instances'].indexOf(this.instanceKey);
		// If the instance wasn't found or exceeds the parents draw range, bail out
		if (instanceId === -1 || instanceId > parent.count) return;
		// calculate the world matrix for each instance
		parent.getMatrixAt(instanceId, _instanceLocalMatrix);
		_instanceWorldMatrix.multiplyMatrices(matrixWorld, _instanceLocalMatrix);
		// the mesh represents this single instance
		_mesh.matrixWorld = _instanceWorldMatrix;
		// raycast side according to instance material
		if (parent.material instanceof THREE.Material) _mesh.material.side = parent.material.side;
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
