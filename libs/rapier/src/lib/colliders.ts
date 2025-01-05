import { Directive, effect, inject, input } from '@angular/core';
import { NgtrAnyCollider } from './rigid-body';
import {
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

@Directive({ selector: 'ngt-object3D[ngtrCuboidCollider]', hostDirectives: [ANY_COLLIDER_HOST_DIRECTIVE] })
export class NgtrCuboidCollider {
	args = input.required<NgtrCuboidArgs>();

	constructor() {
		const anyCollider = inject(NgtrAnyCollider, { host: true });
		anyCollider.setShape('cuboid');
		effect(() => {
			anyCollider.setArgs(this.args());
		});
	}
}

@Directive({ selector: 'ngt-object3D[ngtrCapsuleCollider]', hostDirectives: [ANY_COLLIDER_HOST_DIRECTIVE] })
export class NgtrCapsuleCollider {
	args = input.required<NgtrCapsuleArgs>();

	constructor() {
		const anyCollider = inject(NgtrAnyCollider, { host: true });
		anyCollider.setShape('capsule');
		effect(() => {
			anyCollider.setArgs(this.args());
		});
	}
}

@Directive({ selector: 'ngt-object3D[ngtrBallCollider]', hostDirectives: [ANY_COLLIDER_HOST_DIRECTIVE] })
export class NgtrBallCollider {
	args = input.required<NgtrBallArgs>();

	constructor() {
		const anyCollider = inject(NgtrAnyCollider, { host: true });
		anyCollider.setShape('ball');
		effect(() => {
			anyCollider.setArgs(this.args());
		});
	}
}

@Directive({ selector: 'ngt-object3D[ngtrConvexHullCollider]', hostDirectives: [ANY_COLLIDER_HOST_DIRECTIVE] })
export class NgtrConvexHullCollider {
	args = input.required<NgtrConvexHullArgs>();

	constructor() {
		const anyCollider = inject(NgtrAnyCollider, { host: true });
		anyCollider.setShape('roundConvexHull');
		effect(() => {
			anyCollider.setArgs(this.args());
		});
	}
}

@Directive({ selector: 'ngt-object3D[ngtrHeightfieldCollider]', hostDirectives: [ANY_COLLIDER_HOST_DIRECTIVE] })
export class NgtrHeightfieldCollider {
	args = input.required<NgtrHeightfieldArgs>();

	constructor() {
		const anyCollider = inject(NgtrAnyCollider, { host: true });
		anyCollider.setShape('heightfield');
		effect(() => {
			anyCollider.setArgs(this.args());
		});
	}
}

@Directive({ selector: 'ngt-object3D[ngtrTrimeshCollider]', hostDirectives: [ANY_COLLIDER_HOST_DIRECTIVE] })
export class NgtrTrimeshCollider {
	args = input.required<NgtrTrimeshArgs>();

	constructor() {
		const anyCollider = inject(NgtrAnyCollider, { host: true });
		anyCollider.setShape('trimesh');
		effect(() => {
			anyCollider.setArgs(this.args());
		});
	}
}

@Directive({ selector: 'ngt-object3D[ngtrPolylineCollider]', hostDirectives: [ANY_COLLIDER_HOST_DIRECTIVE] })
export class NgtrPolylineCollider {
	args = input.required<NgtrPolylineArgs>();

	constructor() {
		const anyCollider = inject(NgtrAnyCollider, { host: true });
		anyCollider.setShape('polyline');
		effect(() => {
			anyCollider.setArgs(this.args());
		});
	}
}

@Directive({ selector: 'ngt-object3D[ngtrRoundCuboidCollider]', hostDirectives: [ANY_COLLIDER_HOST_DIRECTIVE] })
export class NgtrRoundCuboidCollider {
	args = input.required<NgtrRoundCuboidArgs>();

	constructor() {
		const anyCollider = inject(NgtrAnyCollider, { host: true });
		anyCollider.setShape('roundCuboid');
		effect(() => {
			anyCollider.setArgs(this.args());
		});
	}
}

@Directive({ selector: 'ngt-object3D[ngtrCylinderCollider]', hostDirectives: [ANY_COLLIDER_HOST_DIRECTIVE] })
export class NgtrCylinderCollider {
	args = input.required<NgtrCylinderArgs>();

	constructor() {
		const anyCollider = inject(NgtrAnyCollider, { host: true });
		anyCollider.setShape('cylinder');
		effect(() => {
			anyCollider.setArgs(this.args());
		});
	}
}

@Directive({ selector: 'ngt-object3D[ngtrRoundCylinderCollider]', hostDirectives: [ANY_COLLIDER_HOST_DIRECTIVE] })
export class NgtrRoundCylinderCollider {
	args = input.required<NgtrRoundCylinderArgs>();

	constructor() {
		const anyCollider = inject(NgtrAnyCollider, { host: true });
		anyCollider.setShape('roundCylinder');
		effect(() => {
			anyCollider.setArgs(this.args());
		});
	}
}

@Directive({ selector: 'ngt-object3D[ngtrConeCollider]', hostDirectives: [ANY_COLLIDER_HOST_DIRECTIVE] })
export class NgtrConeCollider {
	args = input.required<NgtrConeArgs>();

	constructor() {
		const anyCollider = inject(NgtrAnyCollider, { host: true });
		anyCollider.setShape('cone');
		effect(() => {
			anyCollider.setArgs(this.args());
		});
	}
}

@Directive({ selector: 'ngt-object3D[ngtrRoundConeCollider]', hostDirectives: [ANY_COLLIDER_HOST_DIRECTIVE] })
export class NgtrRoundConeCollider {
	args = input.required<NgtrRoundConeArgs>();

	constructor() {
		const anyCollider = inject(NgtrAnyCollider, { host: true });
		anyCollider.setShape('roundCone');
		effect(() => {
			anyCollider.setArgs(this.args());
		});
	}
}

@Directive({ selector: 'ngt-object3D[ngtrConvexMeshCollider]', hostDirectives: [ANY_COLLIDER_HOST_DIRECTIVE] })
export class NgtrConvexMeshCollider {
	args = input.required<NgtrConvexMeshArgs>();

	constructor() {
		const anyCollider = inject(NgtrAnyCollider, { host: true });
		anyCollider.setShape('convexMesh');
		effect(() => {
			anyCollider.setArgs(this.args());
		});
	}
}

@Directive({ selector: 'ngt-object3D[ngtrRoundConvexHullCollider]', hostDirectives: [ANY_COLLIDER_HOST_DIRECTIVE] })
export class NgtrRoundConvexHullCollider {
	args = input.required<NgtrRoundConvexHullArgs>();

	constructor() {
		const anyCollider = inject(NgtrAnyCollider, { host: true });
		anyCollider.setShape('roundConvexHull');
		effect(() => {
			anyCollider.setArgs(this.args());
		});
	}
}

@Directive({ selector: 'ngt-object3D[ngtrRoundConvexMeshCollider]', hostDirectives: [ANY_COLLIDER_HOST_DIRECTIVE] })
export class NgtrRoundConvexMeshCollider {
	args = input.required<NgtrRoundConvexMeshArgs>();

	constructor() {
		const anyCollider = inject(NgtrAnyCollider, { host: true });
		anyCollider.setShape('roundConvexMesh');
		effect(() => {
			anyCollider.setArgs(this.args());
		});
	}
}
