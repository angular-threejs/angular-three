import * as THREE from 'three';
import { vi } from 'vitest';
import { NgteEcctrlGravity } from './gravity';

describe(NgteEcctrlGravity.name, () => {
	it('applies a position-dependent mass-scaled impulse for one substep', () => {
		const gravity = new NgteEcctrlGravity();
		gravity.setGravityField((position) => [position.x, -10, 0]);
		const body = {
			gravityScale: () => 2,
			isSleeping: () => false,
			mass: () => 3,
			applyImpulse: vi.fn(),
		};

		const impulse = gravity.applyGravityField(body as never, 0.1, new THREE.Vector3(4, 2, 0));
		expect(impulse.x).toBeCloseTo(2.4);
		expect(impulse.y).toBeCloseTo(-6);
		expect(impulse.z).toBe(0);
		const [applied, wakeUp] = body.applyImpulse.mock.calls[0];
		expect(applied.x).toBeCloseTo(2.4);
		expect(applied.y).toBeCloseTo(-6);
		expect(applied.z).toBe(0);
		expect(wakeUp).toBe(false);
	});

	it('leaves sleeping bodies and invalid substeps untouched', () => {
		const gravity = new NgteEcctrlGravity();
		const body = {
			gravityScale: () => 1,
			isSleeping: () => true,
			mass: () => 1,
			applyImpulse: vi.fn(),
		};

		expect(gravity.applyGravityField(body as never, 0.1, new THREE.Vector3())).toEqual(new THREE.Vector3());
		expect(gravity.applyGravityField(body as never, Number.NaN, new THREE.Vector3())).toEqual(new THREE.Vector3());
		expect(body.applyImpulse).not.toHaveBeenCalled();
	});
});
