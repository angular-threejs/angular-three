import { CUSTOM_ELEMENTS_SCHEMA, Component, viewChild, ElementRef, ChangeDetectionStrategy } from '@angular/core';
import { extend, injectBeforeRender } from 'angular-three';
import { Mesh, BoxGeometry, MeshBasicMaterial } from 'three';

extend({ Mesh, BoxGeometry, MeshBasicMaterial });

@Component({
  standalone: true,
  template: `
    <ngt-mesh #mesh>
      <ngt-box-geometry />
      <ngt-mesh-basic-material color="hotpink" />
    </ngt-mesh>
  `,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Experience {
  meshRef = viewChild.required<ElementRef<Mesh>>('mesh');

  constructor() {
    injectBeforeRender(({ delta }) => {
      const mesh = this.meshRef().nativeElement;
      mesh.rotation.x += delta;
      mesh.rotation.y += delta;
    })
  }
}

