import { Component, CUSTOM_ELEMENTS_SCHEMA, forwardRef, Input, type OnInit } from '@angular/core';
import { propsToBody, type BodyProps, type BodyShapeType } from '@pmndrs/cannon-worker-api';
import { createInjectionToken, injectBeforeRender, NgtArgs } from 'angular-three';
import { injectNgtcPhysicsApi, provideNgtcPhysicsApi } from 'angular-three-cannon';
import type { Body, Quaternion as CQuarternion, Vec3, World } from 'cannon-es';
import CannonDebugger from 'cannon-es-debugger';
import * as THREE from 'three';

const q = new THREE.Quaternion();
const s = new THREE.Vector3(1, 1, 1);
const v = new THREE.Vector3();
const m = new THREE.Matrix4();

function getMatrix(o: THREE.Object3D): THREE.Matrix4 {
	if (o instanceof THREE.InstancedMesh) {
		o.getMatrixAt(parseInt(o.uuid.split('/')[1]), m);
		return m;
	}
	return o.matrix;
}

export const [injectNgtcDebugApi, provideNgtcDebugApi] = createInjectionToken((debug: NgtcDebug) => debug.api, {
	isRoot: false,
	deps: [forwardRef(() => NgtcDebug)],
});

@Component({
	selector: 'ngtc-debug',
	standalone: true,
	template: `
		<ngt-primitive *args="[scene]" />
		<ng-content />
	`,
	providers: [provideNgtcPhysicsApi()],
	imports: [NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtcDebug implements OnInit {
	@Input() color = 'black';
	@Input() scale = 1;
	@Input() impl = CannonDebugger;
	@Input() disabled = false;

	private bodies: Body[] = [];
	private bodyMap: Record<string, Body> = {};

	private physicsApi = injectNgtcPhysicsApi();

	scene = new THREE.Scene();
	private cannonDebugger!: ReturnType<typeof CannonDebugger>;

	api = {
		add: (uuid: string, props: BodyProps, type: BodyShapeType) => {
			const body = propsToBody({ uuid, props, type });
			this.bodies.push(body);
			this.bodyMap[uuid] = body;
		},
		remove: (id: string) => {
			const debugBodyIndex = this.bodies.indexOf(this.bodyMap[id]);
			if (debugBodyIndex > -1) this.bodies.splice(debugBodyIndex, 1);
			delete this.bodyMap[id];
		},
	};

	constructor() {
		injectBeforeRender(() => {
			if (!this.cannonDebugger) return;
			const refs = this.physicsApi.get('refs');
			for (const uuid in this.bodyMap) {
				getMatrix(refs[uuid]).decompose(v, q, s);
				this.bodyMap[uuid].position.copy(v as unknown as Vec3);
				this.bodyMap[uuid].quaternion.copy(q as unknown as CQuarternion);
			}

			for (const child of this.scene.children) {
				child.visible = !this.disabled;
			}

			if (!this.disabled) {
				this.cannonDebugger.update();
			}
		});
	}

	ngOnInit() {
		this.cannonDebugger = this.impl(this.scene, { bodies: this.bodies } as World, {
			color: this.color,
			scale: this.scale,
		});
	}
}
