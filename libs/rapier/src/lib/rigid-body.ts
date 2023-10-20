import { Component } from '@angular/core';
import { createApiToken, extend } from 'angular-three';
import { Object3D } from 'three';

extend({ Object3D });

export const [injectNgtrRigidBodyApi, provideNgtrRigidBodyApi] = createApiToken(() => NgtrRigidBody);

@Component({
	selector: 'ngtr-rigid-body',
	standalone: true,
	template: ``,
	providers: [provideNgtrRigidBodyApi()],
})
export class NgtrRigidBody {
	api = {};
}
