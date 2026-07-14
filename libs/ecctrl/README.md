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
import { NgteEcctrlGravity } from 'angular-three-ecctrl';
import * as THREE from 'three';

@Injectable({ providedIn: 'root' })
export class PlanetGravity {
	constructor(gravity: NgteEcctrlGravity) {
		gravity.setGravityField((position) => position.clone().normalize().multiplyScalar(-9.81));
	}
}
```

The controller applies custom gravity as a no-wake impulse during each Rapier substep, so an idle character can still sleep.

## Animation state adapter

Import `NgteEcctrlAnimationStateController` to derive stable high-level locomotion states from physics:

```html
<ngte-ecctrl animationState (animationStateChange)="playAnimation($event)">
	<!-- character mesh -->
</ngte-ecctrl>
```

The default states are `IDLE`, `WALK`, `RUN`, `JUMP_START`, `JUMP_IDLE`, `JUMP_FALL`, and `JUMP_LAND`. Supply `[resolver]` for an application-specific animation graph.

## Scope

This package implements the upstream package's default core entry point: the dynamic character controller, gravity-field API, and animation-state adapter. Upstream vehicle, touch joystick, camera follow, and Leva integrations live in Ecctrl's opt-in `all` entry point and are not part of this Angular package yet.
