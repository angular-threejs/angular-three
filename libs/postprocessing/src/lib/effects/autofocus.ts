import {
	CUSTOM_ELEMENTS_SCHEMA,
	ChangeDetectionStrategy,
	Component,
	DestroyRef,
	ElementRef,
	computed,
	effect,
	inject,
	input,
	viewChild,
} from '@angular/core';
import { NgtArgs, NgtVector3, beforeRender, injectStore, pick, vector3 } from 'angular-three';
import { easing } from 'maath';
import { mergeInputs } from 'ngxtension/inject-inputs';
import { CopyPass, DepthOfFieldEffect, DepthPickingPass } from 'postprocessing';
import * as THREE from 'three';
import { NgtpEffectComposer } from '../effect-composer';

type DOFOptions = NonNullable<ConstructorParameters<typeof DepthOfFieldEffect>[1]>;

export type AutofocusOptions = DOFOptions & {
	target?: NgtVector3;
	mouse?: boolean;
	debug?: number;
	manual?: boolean;
	smoothTime?: number;
};

const defaultOptions: AutofocusOptions = {
	mouse: false,
	manual: false,
	smoothTime: 0.25,
};

@Component({
	selector: 'ngtp-autofocus',
	template: `
		<ngt-primitive *args="[dofEffect()]" [dispose]="null" />
		@if (debugSize(); as debugSize) {
			<ngt-mesh #hitpointMesh>
				<ngt-sphere-geometry *args="[debugSize, 16, 16]" />
				<ngt-mesh-basic-material [color]="'#00ff00'" [opacity]="1" [transparent]="true" [depthWrite]="false" />
			</ngt-mesh>
			<ngt-mesh #targetMesh>
				<ngt-sphere-geometry *args="[debugSize / 2, 16, 16]" />
				<ngt-mesh-basic-material
					[color]="'#00ff00'"
					[opacity]="0.5"
					[transparent]="true"
					[depthWrite]="false"
				/>
			</ngt-mesh>
		}
	`,
	imports: [NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgtpAutofocus {
	options = input(defaultOptions, { transform: mergeInputs(defaultOptions) });

	private effectComposer = inject(NgtpEffectComposer);
	private store = injectStore();

	private hitpoint = new THREE.Vector3(0, 0, 0);
	private ndc = new THREE.Vector3(0, 0, 0);

	private depthPickingPass = new DepthPickingPass();
	private copyPass = new CopyPass();

	debugSize = pick(this.options, 'debug');

	private hitpointMeshRef = viewChild<ElementRef<THREE.Mesh>>('hitpointMesh');
	private targetMeshRef = viewChild<ElementRef<THREE.Mesh>>('targetMesh');

	private target = vector3(this.options, 'target', true);

	dofEffect = computed(() => {
		const [camera, options] = [this.effectComposer.camera(), this.options()];
		const { target: _, mouse: __, debug: ___, manual: ____, smoothTime: _____, ...dofOptions } = options;
		const dof = new DepthOfFieldEffect(camera, dofOptions);
		dof.target = new THREE.Vector3().copy(this.hitpoint);
		return dof;
	});

	constructor() {
		// add passes to composer
		effect((onCleanup) => {
			const composer = this.effectComposer.effectComposer();
			if (!composer) return;

			composer.addPass(this.depthPickingPass);
			composer.addPass(this.copyPass);

			onCleanup(() => {
				composer.removePass(this.depthPickingPass);
				composer.removePass(this.copyPass);
			});
		});

		inject(DestroyRef).onDestroy(() => {
			this.depthPickingPass.dispose();
			this.copyPass.dispose();
		});

		// cleanup dof effect
		effect((onCleanup) => {
			const dof = this.dofEffect();
			onCleanup(() => dof.dispose());
		});

		beforeRender(({ delta }) => {
			const dof = this.dofEffect();
			if (!dof?.target) return;

			const { mouse: followMouse, smoothTime, manual } = this.options();
			if (manual) return;

			const target = this.target();
			const camera = this.effectComposer.camera();

			if (target) {
				this.hitpoint.copy(target);
			} else {
				const { x, y } = followMouse ? this.store.snapshot.pointer : { x: 0, y: 0 };
				this.ndc.x = x;
				this.ndc.y = y;

				this.depthPickingPass.readDepth(this.ndc).then((depth) => {
					this.ndc.z = depth * 2.0 - 1.0;
					const hit = 1 - this.ndc.z > 0.0000001;
					if (hit) {
						const unprojected = this.ndc.clone().unproject(camera);
						this.hitpoint.copy(unprojected);
					}
				});
			}

			if (smoothTime && smoothTime > 0 && delta > 0) {
				easing.damp3(dof.target, this.hitpoint, smoothTime, delta);
			} else {
				dof.target.copy(this.hitpoint);
			}

			const hitpointMesh = this.hitpointMeshRef()?.nativeElement;
			if (hitpointMesh) hitpointMesh.position.copy(this.hitpoint);

			const targetMesh = this.targetMeshRef()?.nativeElement;
			if (targetMesh) targetMesh.position.copy(dof.target);
		});
	}
}
