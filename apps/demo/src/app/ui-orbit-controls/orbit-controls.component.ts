import {
    Component,
    CUSTOM_ELEMENTS_SCHEMA,
    ElementRef,
    EventEmitter,
    inject,
    Input,
    Output,
    ViewChild,
} from '@angular/core';
import { NgtArgs, NgtStore } from 'angular-three';
import { OrbitControls } from 'three-stdlib';

@Component({
    selector: 'demo-orbit-controls',
    standalone: true,
    template: `
        <ngt-orbit-controls
            *args="[camera, glDom]"
            #orbitControls
            [enableDamping]="true"
            [enablePan]="enablePan"
            [autoRotate]="autoRotate"
            [target]="target"
            [minDistance]="minDistance"
            [maxDistance]="maxDistance"
            (beforeRender)="$any($event).object.update()"
        />
    `,
    imports: [NgtArgs],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class DemoOrbitControls {
    private readonly store = inject(NgtStore);
    readonly camera = this.store.get('camera');
    readonly glDom = this.store.get('gl', 'domElement');

    @Input() enablePan = true;
    @Input() autoRotate = false;
    @Input() target = [0, 0, 0];
    @Input() minDistance = 0;
    @Input() maxDistance = Infinity;

    @Output() ready = new EventEmitter<OrbitControls>();

    @ViewChild('orbitControls') set orbitControls({ nativeElement }: ElementRef<OrbitControls>) {
        this.ready.emit(nativeElement);
    }
}
