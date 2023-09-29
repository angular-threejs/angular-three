import { Component, forwardRef } from '@angular/core';
import { extend } from 'angular-three';
import { createInjectionToken } from 'ngxtension/create-injection-token';
import { Object3D } from 'three';

extend({ Object3D });

export const [injectNgtrRigidBodyApi, provideNgtrRigidBodyApi] = createInjectionToken(
	(body: NgtrRigidBody) => body.api,
	{ isRoot: false, deps: [forwardRef(() => NgtrRigidBody)] },
);

@Component({
	selector: 'ngtr-rigid-body',
	standalone: true,
	template: ``,
	providers: [provideNgtrRigidBodyApi()],
})
export class NgtrRigidBody {
	api = {};
}
