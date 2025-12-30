import { Directive, effect, inject, input } from '@angular/core';
import { NgtrAnyCollider } from './rigid-body';
import type {
	NgtrBallArgs,
	NgtrCapsuleArgs,
	NgtrConeArgs,
	NgtrConvexHullArgs,
	NgtrConvexMeshArgs,
	NgtrCuboidArgs,
	NgtrCylinderArgs,
	NgtrHeightfieldArgs,
	NgtrPolylineArgs,
	NgtrRoundConeArgs,
	NgtrRoundConvexHullArgs,
	NgtrRoundConvexMeshArgs,
	NgtrRoundCuboidArgs,
	NgtrRoundCylinderArgs,
	NgtrTrimeshArgs,
} from './types';

// NOTE: this is ok to use here since we're not exporting this short-cut
const ANY_COLLIDER_HOST_DIRECTIVE = {
	directive: NgtrAnyCollider,
	inputs: ['options', 'name', 'scale', 'position', 'quaternion', 'rotation', 'userData'],
	outputs: ['collisionEnter', 'collisionExit', 'intersectionEnter', 'intersectionExit', 'contactForce'],
};

@Directive({
	selector: 'ngt-object3D[cuboidCollider]',
	exportAs: 'cuboidCollider',
	hostDirectives: [ANY_COLLIDER_HOST_DIRECTIVE],
})
export class NgtrCuboidCollider {
	args = input.required<NgtrCuboidArgs>({ alias: 'cuboidCollider' });

	private anyCollider = inject(NgtrAnyCollider, { host: true });
	collider = this.anyCollider.collider;

	constructor() {
		this.anyCollider.setShape('cuboid');
		effect(() => {
			this.anyCollider.setArgs(this.args());
		});
	}
}

@Directive({
	selector: 'ngt-object3D[capsuleCollider]',
	exportAs: 'capsuleCollider',
	hostDirectives: [ANY_COLLIDER_HOST_DIRECTIVE],
})
export class NgtrCapsuleCollider {
	args = input.required<NgtrCapsuleArgs>({ alias: 'capsuleCollider' });

	private anyCollider = inject(NgtrAnyCollider, { host: true });
	collider = this.anyCollider.collider;

	constructor() {
		this.anyCollider.setShape('capsule');
		effect(() => {
			this.anyCollider.setArgs(this.args());
		});
	}
}

@Directive({
	selector: 'ngt-object3D[ballCollider]',
	exportAs: 'ballCollider',
	hostDirectives: [ANY_COLLIDER_HOST_DIRECTIVE],
})
export class NgtrBallCollider {
	args = input.required<NgtrBallArgs>({ alias: 'ballCollider' });

	private anyCollider = inject(NgtrAnyCollider, { host: true });
	collider = this.anyCollider.collider;

	constructor() {
		this.anyCollider.setShape('ball');
		effect(() => {
			this.anyCollider.setArgs(this.args());
		});
	}
}

@Directive({
	selector: 'ngt-object3D[convexHullCollider]',
	exportAs: 'convexHullCollider',
	hostDirectives: [ANY_COLLIDER_HOST_DIRECTIVE],
})
export class NgtrConvexHullCollider {
	args = input.required<NgtrConvexHullArgs>({ alias: 'convexHullCollider' });

	private anyCollider = inject(NgtrAnyCollider, { host: true });
	collider = this.anyCollider.collider;

	constructor() {
		this.anyCollider.setShape('convexHull');
		effect(() => {
			this.anyCollider.setArgs(this.args());
		});
	}
}

@Directive({
	selector: 'ngt-object3D[heightfieldCollider]',
	exportAs: 'heightfieldCollider',
	hostDirectives: [ANY_COLLIDER_HOST_DIRECTIVE],
})
export class NgtrHeightfieldCollider {
	args = input.required<NgtrHeightfieldArgs>({ alias: 'heightfieldCollider' });

	private anyCollider = inject(NgtrAnyCollider, { host: true });
	collider = this.anyCollider.collider;

	constructor() {
		this.anyCollider.setShape('heightfield');
		effect(() => {
			this.anyCollider.setArgs(this.args());
		});
	}
}

@Directive({
	selector: 'ngt-object3D[trimeshCollider]',
	exportAs: 'trimeshCollider',
	hostDirectives: [ANY_COLLIDER_HOST_DIRECTIVE],
})
export class NgtrTrimeshCollider {
	args = input.required<NgtrTrimeshArgs>({ alias: 'trimeshCollider' });

	private anyCollider = inject(NgtrAnyCollider, { host: true });
	collider = this.anyCollider.collider;

	constructor() {
		this.anyCollider.setShape('trimesh');
		effect(() => {
			this.anyCollider.setArgs(this.args());
		});
	}
}

@Directive({
	selector: 'ngt-object3D[polylineCollider]',
	exportAs: 'polylineCollider',
	hostDirectives: [ANY_COLLIDER_HOST_DIRECTIVE],
})
export class NgtrPolylineCollider {
	args = input.required<NgtrPolylineArgs>({ alias: 'polylineCollider' });

	private anyCollider = inject(NgtrAnyCollider, { host: true });
	collider = this.anyCollider.collider;

	constructor() {
		this.anyCollider.setShape('polyline');
		effect(() => {
			this.anyCollider.setArgs(this.args());
		});
	}
}

@Directive({
	selector: 'ngt-object3D[roundCuboidCollider]',
	exportAs: 'roundCuboidCollider',
	hostDirectives: [ANY_COLLIDER_HOST_DIRECTIVE],
})
export class NgtrRoundCuboidCollider {
	args = input.required<NgtrRoundCuboidArgs>({ alias: 'roundCuboidCollider' });

	private anyCollider = inject(NgtrAnyCollider, { host: true });
	collider = this.anyCollider.collider;

	constructor() {
		this.anyCollider.setShape('roundCuboid');
		effect(() => {
			this.anyCollider.setArgs(this.args());
		});
	}
}

@Directive({
	selector: 'ngt-object3D[cylinderCollider]',
	exportAs: 'cylinderCollider',
	hostDirectives: [ANY_COLLIDER_HOST_DIRECTIVE],
})
export class NgtrCylinderCollider {
	args = input.required<NgtrCylinderArgs>({ alias: 'cylinderCollider' });

	private anyCollider = inject(NgtrAnyCollider, { host: true });
	collider = this.anyCollider.collider;

	constructor() {
		this.anyCollider.setShape('cylinder');
		effect(() => {
			this.anyCollider.setArgs(this.args());
		});
	}
}

@Directive({
	selector: 'ngt-object3D[roundCylinderCollider]',
	exportAs: 'roundCylinderCollider',
	hostDirectives: [ANY_COLLIDER_HOST_DIRECTIVE],
})
export class NgtrRoundCylinderCollider {
	args = input.required<NgtrRoundCylinderArgs>({ alias: 'roundCylinderCollider' });

	private anyCollider = inject(NgtrAnyCollider, { host: true });
	collider = this.anyCollider.collider;

	constructor() {
		this.anyCollider.setShape('roundCylinder');
		effect(() => {
			this.anyCollider.setArgs(this.args());
		});
	}
}

@Directive({
	selector: 'ngt-object3D[coneCollider]',
	exportAs: 'coneCollider',
	hostDirectives: [ANY_COLLIDER_HOST_DIRECTIVE],
})
export class NgtrConeCollider {
	args = input.required<NgtrConeArgs>({ alias: 'coneCollider' });

	private anyCollider = inject(NgtrAnyCollider, { host: true });
	collider = this.anyCollider.collider;

	constructor() {
		this.anyCollider.setShape('cone');
		effect(() => {
			this.anyCollider.setArgs(this.args());
		});
	}
}

@Directive({
	selector: 'ngt-object3D[roundConeCollider]',
	exportAs: 'roundConeCollider',
	hostDirectives: [ANY_COLLIDER_HOST_DIRECTIVE],
})
export class NgtrRoundConeCollider {
	args = input.required<NgtrRoundConeArgs>({ alias: 'roundConeCollider' });

	private anyCollider = inject(NgtrAnyCollider, { host: true });
	collider = this.anyCollider.collider;

	constructor() {
		this.anyCollider.setShape('roundCone');
		effect(() => {
			this.anyCollider.setArgs(this.args());
		});
	}
}

@Directive({
	selector: 'ngt-object3D[convexMeshCollider]',
	exportAs: 'convexMeshCollider',
	hostDirectives: [ANY_COLLIDER_HOST_DIRECTIVE],
})
export class NgtrConvexMeshCollider {
	args = input.required<NgtrConvexMeshArgs>({ alias: 'convexMeshCollider' });

	private anyCollider = inject(NgtrAnyCollider, { host: true });
	collider = this.anyCollider.collider;

	constructor() {
		this.anyCollider.setShape('convexMesh');
		effect(() => {
			this.anyCollider.setArgs(this.args());
		});
	}
}

@Directive({
	selector: 'ngt-object3D[roundConvexHullCollider]',
	exportAs: 'roundConvexHullCollider',
	hostDirectives: [ANY_COLLIDER_HOST_DIRECTIVE],
})
export class NgtrRoundConvexHullCollider {
	args = input.required<NgtrRoundConvexHullArgs>({ alias: 'roundConvexHullCollider' });

	private anyCollider = inject(NgtrAnyCollider, { host: true });
	collider = this.anyCollider.collider;

	constructor() {
		this.anyCollider.setShape('roundConvexHull');
		effect(() => {
			this.anyCollider.setArgs(this.args());
		});
	}
}

@Directive({
	selector: 'ngt-object3D[roundConvexMeshCollider]',
	exportAs: 'roundConvexMeshCollider',
	hostDirectives: [ANY_COLLIDER_HOST_DIRECTIVE],
})
export class NgtrRoundConvexMeshCollider {
	args = input.required<NgtrRoundConvexMeshArgs>({ alias: 'roundConvexMeshCollider' });

	private anyCollider = inject(NgtrAnyCollider, { host: true });
	collider = this.anyCollider.collider;

	constructor() {
		this.anyCollider.setShape('roundConvexMesh');
		effect(() => {
			this.anyCollider.setArgs(this.args());
		});
	}
}
