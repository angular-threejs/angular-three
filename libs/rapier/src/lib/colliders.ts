import { Directive, effect, inject, input, untracked } from '@angular/core';
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

const ANY_COLLIDER_HOST_DIRECTIVE = {
	directive: NgtrAnyCollider,
	inputs: ['options', 'name', 'scale', 'position', 'quaternion', 'rotation', 'userData'],
	outputs: ['collisionEnter', 'collisionExit', 'intersectionEnter', 'intersectionExit', 'contactForce'],
};

@Directive({
	selector: 'ngt-object3D[ngtrCuboidCollider]',
	standalone: true,
	hostDirectives: [ANY_COLLIDER_HOST_DIRECTIVE],
})
export class NgtrCuboidCollider {
	args = input.required<NgtrCuboidArgs>();

	constructor() {
		const anyCollider = inject(NgtrAnyCollider, { host: true });
		anyCollider.setShape('cuboid');
		effect(() => {
			const args = this.args();
			untracked(() => {
				anyCollider.setArgs(args);
			});
		});
	}
}

@Directive({
	selector: 'ngt-object3D[ngtrCapsuleCollider]',
	standalone: true,
	hostDirectives: [ANY_COLLIDER_HOST_DIRECTIVE],
})
export class NgtrCapsuleCollider {
	args = input.required<NgtrCapsuleArgs>();

	constructor() {
		const anyCollider = inject(NgtrAnyCollider, { host: true });
		anyCollider.setShape('capsule');
		effect(() => {
			const args = this.args();
			untracked(() => {
				anyCollider.setArgs(args);
			});
		});
	}
}

@Directive({
	selector: 'ngt-object3D[ngtrBallCollider]',
	standalone: true,
	hostDirectives: [ANY_COLLIDER_HOST_DIRECTIVE],
})
export class NgtrBallCollider {
	args = input.required<NgtrBallArgs>();

	constructor() {
		const anyCollider = inject(NgtrAnyCollider, { host: true });
		anyCollider.setShape('ball');
		effect(() => {
			const args = this.args();
			untracked(() => {
				anyCollider.setArgs(args);
			});
		});
	}
}

@Directive({
	selector: 'ngt-object3D[ngtrConvexHullCollider]',
	standalone: true,
	hostDirectives: [ANY_COLLIDER_HOST_DIRECTIVE],
})
export class NgtrConvexHullCollider {
	args = input.required<NgtrConvexHullArgs>();

	constructor() {
		const anyCollider = inject(NgtrAnyCollider, { host: true });
		anyCollider.setShape('roundConvexHull');
		effect(() => {
			const args = this.args();
			untracked(() => {
				anyCollider.setArgs(args);
			});
		});
	}
}

@Directive({
	selector: 'ngt-object3D[ngtrHeightfieldCollider]',
	standalone: true,
	hostDirectives: [ANY_COLLIDER_HOST_DIRECTIVE],
})
export class NgtrHeightfieldCollider {
	args = input.required<NgtrHeightfieldArgs>();

	constructor() {
		const anyCollider = inject(NgtrAnyCollider, { host: true });
		anyCollider.setShape('heightfield');
		effect(() => {
			const args = this.args();
			untracked(() => {
				anyCollider.setArgs(args);
			});
		});
	}
}

@Directive({
	selector: 'ngt-object3D[ngtrTrimeshCollider]',
	standalone: true,
	hostDirectives: [ANY_COLLIDER_HOST_DIRECTIVE],
})
export class NgtrTrimeshCollider {
	args = input.required<NgtrTrimeshArgs>();

	constructor() {
		const anyCollider = inject(NgtrAnyCollider, { host: true });
		anyCollider.setShape('trimesh');
		effect(() => {
			const args = this.args();
			untracked(() => {
				anyCollider.setArgs(args);
			});
		});
	}
}

@Directive({
	selector: 'ngt-object3D[ngtrPolylineCollider]',
	standalone: true,
	hostDirectives: [ANY_COLLIDER_HOST_DIRECTIVE],
})
export class NgtrPolylineCollider {
	args = input.required<NgtrPolylineArgs>();

	constructor() {
		const anyCollider = inject(NgtrAnyCollider, { host: true });
		anyCollider.setShape('polyline');
		effect(() => {
			const args = this.args();
			untracked(() => {
				anyCollider.setArgs(args);
			});
		});
	}
}

@Directive({
	selector: 'ngt-object3D[ngtrRoundCuboidCollider]',
	standalone: true,
	hostDirectives: [ANY_COLLIDER_HOST_DIRECTIVE],
})
export class NgtrRoundCuboidCollider {
	args = input.required<NgtrRoundCuboidArgs>();

	constructor() {
		const anyCollider = inject(NgtrAnyCollider, { host: true });
		anyCollider.setShape('roundCuboid');
		effect(() => {
			const args = this.args();
			untracked(() => {
				anyCollider.setArgs(args);
			});
		});
	}
}

@Directive({
	selector: 'ngt-object3D[ngtrCylinderCollider]',
	standalone: true,
	hostDirectives: [ANY_COLLIDER_HOST_DIRECTIVE],
})
export class NgtrCylinderCollider {
	args = input.required<NgtrCylinderArgs>();

	constructor() {
		const anyCollider = inject(NgtrAnyCollider, { host: true });
		anyCollider.setShape('cylinder');
		effect(() => {
			const args = this.args();
			untracked(() => {
				anyCollider.setArgs(args);
			});
		});
	}
}

@Directive({
	selector: 'ngt-object3D[ngtrRoundCylinderCollider]',
	standalone: true,
	hostDirectives: [ANY_COLLIDER_HOST_DIRECTIVE],
})
export class NgtrRoundCylinderCollider {
	args = input.required<NgtrRoundCylinderArgs>();

	constructor() {
		const anyCollider = inject(NgtrAnyCollider, { host: true });
		anyCollider.setShape('roundCylinder');
		effect(() => {
			const args = this.args();
			untracked(() => {
				anyCollider.setArgs(args);
			});
		});
	}
}

@Directive({
	selector: 'ngt-object3D[ngtrConeCollider]',
	standalone: true,
	hostDirectives: [ANY_COLLIDER_HOST_DIRECTIVE],
})
export class NgtrConeCollider {
	args = input.required<NgtrConeArgs>();

	constructor() {
		const anyCollider = inject(NgtrAnyCollider, { host: true });
		anyCollider.setShape('cone');
		effect(() => {
			const args = this.args();
			untracked(() => {
				anyCollider.setArgs(args);
			});
		});
	}
}

@Directive({
	selector: 'ngt-object3D[ngtrRoundConeCollider]',
	standalone: true,
	hostDirectives: [ANY_COLLIDER_HOST_DIRECTIVE],
})
export class NgtrRoundConeCollider {
	args = input.required<NgtrRoundConeArgs>();

	constructor() {
		const anyCollider = inject(NgtrAnyCollider, { host: true });
		anyCollider.setShape('roundCone');
		effect(() => {
			const args = this.args();
			untracked(() => {
				anyCollider.setArgs(args);
			});
		});
	}
}

@Directive({
	selector: 'ngt-object3D[ngtrConvexMeshCollider]',
	standalone: true,
	hostDirectives: [ANY_COLLIDER_HOST_DIRECTIVE],
})
export class NgtrConvexMeshCollider {
	args = input.required<NgtrConvexMeshArgs>();

	constructor() {
		const anyCollider = inject(NgtrAnyCollider, { host: true });
		anyCollider.setShape('convexMesh');
		effect(() => {
			const args = this.args();
			untracked(() => {
				anyCollider.setArgs(args);
			});
		});
	}
}

@Directive({
	selector: 'ngt-object3D[ngtrRoundConvexHullCollider]',
	standalone: true,
	hostDirectives: [ANY_COLLIDER_HOST_DIRECTIVE],
})
export class NgtrRoundConvexHullCollider {
	args = input.required<NgtrRoundConvexHullArgs>();

	constructor() {
		const anyCollider = inject(NgtrAnyCollider, { host: true });
		anyCollider.setShape('roundConvexHull');
		effect(() => {
			const args = this.args();
			untracked(() => {
				anyCollider.setArgs(args);
			});
		});
	}
}

@Directive({
	selector: 'ngt-object3D[ngtrRoundConvexMeshCollider]',
	standalone: true,
	hostDirectives: [ANY_COLLIDER_HOST_DIRECTIVE],
})
export class NgtrRoundConvexMeshCollider {
	args = input.required<NgtrRoundConvexMeshArgs>();

	constructor() {
		const anyCollider = inject(NgtrAnyCollider, { host: true });
		anyCollider.setShape('roundConvexMesh');
		effect(() => {
			const args = this.args();
			untracked(() => {
				anyCollider.setArgs(args);
			});
		});
	}
}
