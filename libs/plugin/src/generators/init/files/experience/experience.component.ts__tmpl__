import { CUSTOM_ELEMENTS_SCHEMA, Component } from '@angular/core';
import { extend, type NgtBeforeRenderEvent } from 'angular-three';
import { Mesh, BoxGeometry, MeshBasicMaterial } from 'three';

extend({ Mesh, BoxGeometry, MeshBasicMaterial });

@Component({
  standalone: true,
  templateUrl: './experience.component.html',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class Experience {
  onBeforeRender({ object, state: { delta }}: NgtBeforeRenderEvent<Mesh>) {
    object.rotation.x += delta;
    object.rotation.y += delta;
  }
}

