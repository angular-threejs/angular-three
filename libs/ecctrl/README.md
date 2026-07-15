# `angular-three-ecctrl`

`angular-three-ecctrl` is a dynamic, floating-capsule character controller for Angular Three and Rapier. It ports the core locomotion model from [pmndrs/ecctrl](https://github.com/pmndrs/ecctrl) while keeping input source-agnostic: keyboard, gamepad, touch, AI, and network adapters can all drive the same controller.

## Installation

```bash
npm install angular-three-ecctrl angular-three-rapier @dimforge/rapier3d-compat
# yarn add angular-three-ecctrl angular-three-rapier @dimforge/rapier3d-compat
# pnpm add angular-three-ecctrl angular-three-rapier @dimforge/rapier3d-compat
```

## Usage

`NgteEcctrl` owns its dynamic rigid body and capsule collider, so it must be rendered beneath `NgtrPhysics`. Project the visual character into it, and call `setMovement()` from your preferred input adapter.

```typescript
import { Component, CUSTOM_ELEMENTS_SCHEMA, viewChild } from '@angular/core';
import { NgteEcctrl } from 'angular-three-ecctrl';
import { NgtrPhysics, NgtrRigidBody } from 'angular-three-rapier';

@Component({
	selector: 'app-character-scene',
	template: `
		<ngtr-physics>
			<ng-template>
				<ngt-object3D rigidBody="fixed" [position]="[0, -0.25, 0]" [options]="{ colliders: 'cuboid' }">
					<ngt-mesh [scale]="[10, 0.5, 10]">
						<ngt-box-geometry />
						<ngt-mesh-standard-material color="#334155" />
					</ngt-mesh>
				</ngt-object3D>

				<ngte-ecctrl #player="ecctrl" [position]="[0, 1, 0]">
					<ngt-mesh>
						<ngt-capsule-geometry />
						<ngt-mesh-standard-material color="orange" />
					</ngt-mesh>
				</ngte-ecctrl>
			</ng-template>
		</ngtr-physics>
	`,
	imports: [NgteEcctrl, NgtrPhysics, NgtrRigidBody],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class CharacterScene {
	readonly player = viewChild<NgteEcctrl>('player');

	setMovement() {
		this.player()?.setMovement({ forward: true, run: true });
	}
}
```

`setMovement()` merges partial updates. The public input shape supports `forward`, `backward`, `leftward`, `rightward`, `run`, `jump`, and an optional `{ x, y }` joystick. The controller exposes an imperative `handle` with live `body`, `collider`, and `state` values, plus `setLockForward()` and `setForwardDir()` for imperative integrations.

`NgteEcctrl` also follows Angular Rapier's transform and event contract: use `[rotation]` for Euler values or `[quaternion]` for quaternion values, and subscribe to `(wake)`, `(sleep)`, `(collisionEnter)`, `(collisionExit)`, `(intersectionEnter)`, `(intersectionExit)`, or `(contactForce)` on the controller itself.

## Gravity fields

Enable position-dependent gravity per controller with `options.gravityField`, or configure a scene-wide field through the injectable `NgteEcctrlGravity` service. A constant `options.customGravity` vector remains available as shorthand.

```typescript
import { Injectable } from '@angular/core';
import { NgteEcctrlGravity } from 'angular-three-ecctrl/gravity';
import * as THREE from 'three';

@Injectable({ providedIn: 'root' })
export class PlanetGravity {
	constructor(gravity: NgteEcctrlGravity) {
		gravity.setGravityField((position) => position.clone().normalize().multiplyScalar(-9.81));
	}
}
```

The controller disables native gravity on its owned body while custom gravity is enabled, then applies the field as a no-wake impulse during each Rapier substep so an idle character can still sleep. The standalone `[ecctrlGravity]` body directive is additive instead; set the parent `NgtrPhysics` gravity to `[0, 0, 0]` when that directive should replace native world gravity.

## Animation state adapter

Import `NgteEcctrlAnimationState` from `angular-three-ecctrl/animation` to derive stable high-level locomotion states from physics:

```html
<ngte-ecctrl animationState (animationStateChange)="playAnimation($event)">
	<!-- character mesh -->
</ngte-ecctrl>
```

The default states are `IDLE`, `WALK`, `RUN`, `JUMP_START`, `JUMP_IDLE`, `JUMP_FALL`, and `JUMP_LAND`. Supply `[resolver]` for an application-specific animation graph.

## Entry points

The root entry point contains only the character controller and its public types. Import optional features directly:

| Entry point                      | Purpose                                                          |
| -------------------------------- | ---------------------------------------------------------------- |
| `angular-three-ecctrl/animation` | Locomotion animation-state directive                             |
| `angular-three-ecctrl/camera`    | `[ecctrlCameraFollow]` adapter for `NgtsCameraControls`          |
| `angular-three-ecctrl/curves`    | Curve data, LUT baking, and evaluation                           |
| `angular-three-ecctrl/gravity`   | Shared gravity fields and the `[ecctrlGravity]` body directive   |
| `angular-three-ecctrl/input`     | Touch joystick, virtual button, and declarative movement binding |
| `angular-three-ecctrl/time`      | Deterministic control of a paused Rapier world                   |
| `angular-three-ecctrl/vehicle`   | Shape-cast cars and thrust-propeller drones                      |

`NgteTimeControl` must be nested under an `NgtrPhysics` configured with `paused: true`; it advances that world through `NgtrPhysics.step(delta)` and refuses to double-step an automatically advancing world.

For interactive curve editing, `angular-three-tweakpane/curve` provides the structurally compatible `TweakpaneCurve`. There are intentionally no `/all` or `/leva` entry points: applications import only the features they use.
