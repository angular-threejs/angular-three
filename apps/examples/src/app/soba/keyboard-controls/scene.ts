import {
	ChangeDetectionStrategy,
	Component,
	computed,
	CUSTOM_ELEMENTS_SCHEMA,
	ElementRef,
	inject,
	viewChild,
} from '@angular/core';
import { beforeRender, NgtArgs } from 'angular-three';
import { createKeyboardControls, NgtsKeyboardControls } from 'angular-three-soba/controls';
import { Mesh, Vector3 } from 'three';

const { controlsMap, injectKeyboardControls } = createKeyboardControls([
	{ name: 'forward', keys: ['ArrowUp', 'KeyW'] },
	{ name: 'back', keys: ['ArrowDown', 'KeyS'] },
	{ name: 'left', keys: ['ArrowLeft', 'KeyA'] },
	{ name: 'right', keys: ['ArrowRight', 'KeyD'] },
	{ name: 'color', keys: ['Space'], toggle: true },
]);

@Component({
	selector: 'app-keyboard-player',
	template: `
		<ngt-mesh #mesh castShadow [position]="[0, 0.5, 0]">
			<ngt-cone-geometry *args="[1, 3, 4]" />
			<ngt-mesh-lambert-material [color]="color()" />
		</ngt-mesh>

		<ngt-mesh [position]="[0, -1.45, 0]" [rotation]="[-Math.PI / 2, 0, 0]">
			<ngt-ring-geometry *args="[2.25, 2.5, 32]" />
			<ngt-mesh-basic-material [color]="moving() ? '#f7d060' : '#2f2f37'" />
		</ngt-mesh>
	`,
	imports: [NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Player {
	protected readonly Math = Math;

	private keyboardControls = injectKeyboardControls();

	// reactive form + toggle action: Space flips the 'color' state on each press
	protected color = computed(() => (this.keyboardControls.select('color')() ? 'red' : 'green'));

	// reactive form: memoized per-action signals composed into a derived signal
	protected moving = computed(
		() =>
			this.keyboardControls.select('forward')() ||
			this.keyboardControls.select('back')() ||
			this.keyboardControls.select('left')() ||
			this.keyboardControls.select('right')(),
	);

	private meshRef = viewChild.required<ElementRef<Mesh>>('mesh');

	constructor() {
		// transient form: poll the non-reactive snapshot every frame for continuous movement
		const velocity = new Vector3();
		beforeRender(({ delta }) => {
			const mesh = this.meshRef().nativeElement;
			const { forward, back, left, right } = this.keyboardControls.snapshot;

			velocity.x = Number(right) - Number(left);
			velocity.z = Number(back) - Number(forward);

			mesh.position.addScaledVector(velocity, 10 * delta);
			mesh.rotateY(4 * delta * velocity.x);
		});
	}
}

@Component({
	selector: 'app-keyboard-controls-scene-graph',
	template: `
		<ngt-color attach="background" *args="['#171720']" />

		<ngt-ambient-light [intensity]="0.5" />
		<ngt-directional-light [position]="[5, 10, 5]" [intensity]="Math.PI" castShadow />

		<app-keyboard-player />

		<ngt-grid-helper *args="[100, 100, '#4f4f4f', '#2f2f37']" [position]="[0, -1.5, 0]" />
	`,
	hostDirectives: [NgtsKeyboardControls],
	imports: [NgtArgs, Player],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SceneGraph {
	protected readonly Math = Math;

	constructor() {
		// hostDirective form: provide + configure NgtsKeyboardControls without a template binding
		inject(NgtsKeyboardControls).map.set(controlsMap);
	}
}
