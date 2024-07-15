import { Directive, afterNextRender, inject, input } from '@angular/core';
import { BodyProps, BodyShapeType, propsToBody } from '@pmndrs/cannon-worker-api';
import { injectBeforeRender, injectStore } from 'angular-three';
import { NgtcPhysics } from 'angular-three-cannon';
import { Body, Quaternion as CQuarternion, Vec3, World } from 'cannon-es';
import CannonDebugger from 'cannon-es-debugger';
import { mergeInputs } from 'ngxtension/inject-inputs';
import { InstancedMesh, Matrix4, Object3D, Quaternion, Scene, Vector3 } from 'three';

const q = new Quaternion();
const s = new Vector3(1, 1, 1);
const v = new Vector3();
const m = new Matrix4();
function getMatrix(o: Object3D) {
	if (o instanceof InstancedMesh) {
		o.getMatrixAt(parseInt(o.uuid.split('/')[1]), m);
		return m;
	}
	return o.matrix;
}

export interface NgtcDebugInputs {
	enabled: boolean;
	color: string;
	impl: typeof CannonDebugger;
	scale: number;
}

const defaultOptions: NgtcDebugInputs = {
	enabled: true,
	scale: 1,
	color: 'black',
	impl: CannonDebugger,
};

@Directive({ selector: 'ngtc-physics[debug]', standalone: true })
export class NgtcDebug {
	private store = injectStore();
	private physics = inject(NgtcPhysics);

	debug = input(defaultOptions, { transform: mergeInputs(defaultOptions) });

	private defaultScene = this.store.select('scene');

	private scene = new Scene();
	private bodies: Body[] = [];
	private bodyMap: Record<string, Body> = {};

	private cannonDebugger!: ReturnType<typeof CannonDebugger>;

	api = {};

	constructor() {
		afterNextRender(() => {
			this.defaultScene().add(this.scene);
			this.cannonDebugger = this.debug().impl(this.scene, { bodies: this.bodies } as World, {
				color: this.debug().color,
				scale: this.debug().scale,
			});
		});

		injectBeforeRender(() => {
			if (!this.cannonDebugger) return;
			const refs = this.physics.api.refs;
			for (const uuid in this.bodyMap) {
				const ref = refs[uuid];
				const body = this.bodyMap[uuid];
				if (ref) {
					getMatrix(ref).decompose(v, q, s);
					body.position.copy(v as unknown as Vec3);
					body.quaternion.copy(q as unknown as CQuarternion);
				}
			}
			for (const child of this.scene.children) {
				child.visible = this.debug().enabled;
			}

			if (this.debug().enabled) {
				this.cannonDebugger.update();
			}
		});
	}

	add(uuid: string, props: BodyProps, type: BodyShapeType) {
		const body = propsToBody({ uuid, props, type });
		this.bodies.push(body);
		this.bodyMap[uuid] = body;
	}

	remove(uuid: string) {
		const debugBodyIndex = this.bodies.indexOf(this.bodyMap[uuid]);
		if (debugBodyIndex > -1) this.bodies.splice(debugBodyIndex, 1);
		delete this.bodyMap[uuid];
	}
}
