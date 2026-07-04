import {
	ChangeDetectionStrategy,
	Component,
	computed,
	CUSTOM_ELEMENTS_SCHEMA,
	DestroyRef,
	ElementRef,
	inject,
	signal,
	viewChild,
} from '@angular/core';
import { Meta } from '@storybook/angular';
import { beforeRender, NgtArgs } from 'angular-three';
import { createKeyboardControls, NgtsKeyboardControls } from 'angular-three-soba/controls';
import { Mesh, Vector3 } from 'three';
import { storyDecorators, storyFunction } from '../setup-canvas';

/**
 * Default (up: true) — actions are pressed while their keys are held.
 * The frame loop polls the non-reactive snapshot for continuous movement.
 */
const movement = createKeyboardControls([
	{ name: 'forward', keys: ['ArrowUp', 'KeyW'] },
	{ name: 'back', keys: ['ArrowDown', 'KeyS'] },
	{ name: 'left', keys: ['ArrowLeft', 'KeyA'] },
	{ name: 'right', keys: ['ArrowRight', 'KeyD'] },
]);

@Component({
	selector: 'keyboard-player',
	template: `
		<ngt-mesh #mesh>
			<ngt-cone-geometry *args="[1, 3, 4]" />
			<ngt-mesh-lambert-material color="green" />
		</ngt-mesh>
	`,
	imports: [NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
class Player {
	private meshRef = viewChild.required<ElementRef<Mesh>>('mesh');
	private keyboardControls = movement.injectKeyboardControls();

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
	template: `
		<ngt-group [keyboardControls]="controlsMap">
			<keyboard-player />
		</ngt-group>

		<ngt-grid-helper *args="[100, 100]" [position]="[0, -1.5, 0]" />
	`,
	imports: [NgtsKeyboardControls, NgtArgs, Player],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
class DefaultKeyboardControlsStory {
	protected controlsMap = movement.controlsMap;
}

/**
 * up: false — a discrete fire-on-press action. The state latches true after the
 * first press and never resets, so the reactive/select form is NOT useful here;
 * consume the press edges via the keyChange output instead. Holding the key does
 * not re-fire (auto-repeat is deduplicated).
 */
const press = createKeyboardControls([{ name: 'spawn', keys: ['Space'], up: false }]);

@Component({
	selector: 'press-spawner',
	template: `
		@for (box of boxes(); track $index) {
			<ngt-mesh [position]="[($index % 10) * 1.5 - 6.75, 0, -Math.floor($index / 10) * 1.5]">
				<ngt-box-geometry />
				<ngt-mesh-lambert-material color="orange" />
			</ngt-mesh>
		}

		<ngt-grid-helper *args="[100, 100]" [position]="[0, -1.5, 0]" />
	`,
	imports: [NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
class PressSpawner {
	protected readonly Math = Math;

	private count = signal(0);
	protected boxes = computed(() => Array.from({ length: this.count() }));

	constructor() {
		const keyboardControls = press.injectKeyboardControls();

		// each physical press of Space spawns exactly one box — holding the key does nothing more
		const subscription = keyboardControls.keyChange.subscribe(({ name, pressed }) => {
			if (name === 'spawn' && pressed) this.count.update((count) => count + 1);
		});
		inject(DestroyRef).onDestroy(() => subscription.unsubscribe());
	}
}

@Component({
	template: `
		<ngt-group [keyboardControls]="controlsMap">
			<press-spawner />
		</ngt-group>
	`,
	imports: [NgtsKeyboardControls, PressSpawner],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
class FireOnPressKeyboardControlsStory {
	protected controlsMap = press.controlsMap;
}

/**
 * toggle: true — each press edge flips the action state between true and false;
 * keyup is ignored. The reactive select() signal is the natural consumer: bind it
 * straight into the template.
 */
const toggle = createKeyboardControls([{ name: 'color', keys: ['Space'], toggle: true }]);

@Component({
	selector: 'toggle-cone',
	template: `
		<ngt-mesh>
			<ngt-cone-geometry *args="[1, 3, 4]" />
			<ngt-mesh-lambert-material [color]="color()" />
		</ngt-mesh>

		<ngt-grid-helper *args="[100, 100]" [position]="[0, -1.5, 0]" />
	`,
	imports: [NgtArgs],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
class ToggleCone {
	// reactive form: select() is a live Signal<boolean> that flips on each press of Space
	private colorToggled = toggle.injectKeyboardControls().select('color');
	protected color = computed(() => (this.colorToggled() ? 'red' : 'green'));
}

@Component({
	template: `
		<ngt-group [keyboardControls]="controlsMap">
			<toggle-cone />
		</ngt-group>
	`,
	imports: [NgtsKeyboardControls, ToggleCone],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
class ToggleKeyboardControlsStory {
	protected controlsMap = toggle.controlsMap;
}

export default {
	title: 'Controls/KeyboardControls',
	decorators: storyDecorators(),
} as Meta;

/**
 * Use WASD / arrow keys to move the player. Actions are pressed while held.
 */
export const Default = storyFunction(DefaultKeyboardControlsStory, {
	camera: { position: [0, 10, 15], fov: 50 },
	controls: null,
});

/**
 * `up: false` — each physical press of Space spawns one box via `keyChange` edges;
 * holding the key does not repeat.
 */
export const FireOnPress = storyFunction(FireOnPressKeyboardControlsStory, {
	camera: { position: [0, 10, 15], fov: 50 },
	controls: null,
});

/**
 * `toggle: true` — press Space to flip the cone color back and forth via `select()`.
 */
export const Toggle = storyFunction(ToggleKeyboardControlsStory, {
	camera: { position: [0, 5, 10], fov: 50 },
	controls: null,
});
