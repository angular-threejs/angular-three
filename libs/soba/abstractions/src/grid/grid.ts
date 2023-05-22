import { CUSTOM_ELEMENTS_SCHEMA, Component, Input } from '@angular/core';
import { NgtArgs, NgtSignalStore, extend, injectNgtRef } from 'angular-three';
import { GridMaterial } from 'angular-three-soba/shaders';
import * as THREE from 'three';
import { Mesh, PlaneGeometry } from 'three';

extend({ Mesh, GridMaterial, PlaneGeometry });

export interface NgtsGridState {
    /** Cell size, default: 0.5 */
    cellSize: number;
    /** Cell thickness, default: 0.5 */
    cellThickness: number;
    /** Cell color, default: black */
    cellColor: THREE.ColorRepresentation;
    /** Section size, default: 1 */
    sectionSize: number;
    /** Section thickness, default: 1 */
    sectionThickness: number;
    /** Section color, default: #2080ff */
    sectionColor: THREE.ColorRepresentation;
    /** Follow camera, default: false */
    followCamera: boolean;
    /** Display the grid infinitely, default: false */
    infiniteGrid: boolean;
    /** Fade distance, default: 100 */
    fadeDistance: number;
    /** Fade strength, default: 1 */
    fadeStrength: number;
    /** Material side, default: THREE.BackSide */
    side: THREE.Side;
    /** Default plane-geometry arguments */
    args: ConstructorParameters<typeof THREE.PlaneGeometry>;
}

@Component({
    selector: 'ngts-grid',
    standalone: true,
    template: `
        <ngt-mesh ngtCompound [ref]="gridRef" [frustumCulled]="false">
            <ngt-grid-material
                [transparent]="true"
                [side]="gridSide()"
                [cellSize]="gridCellSize()"
                [sectionSize]="gridSectionSize()"
                [cellColor]="gridCellColor()"
                [sectionColor]="gridSectionColor()"
                [cellThickness]="gridCellThickness()"
                [sectionThickness]="gridSectionThickness()"
                [fadeDistance]="gridFadeDistance()"
                [fadeStrength]="gridFadeStrength()"
                [infiniteGrid]="gridInfiniteGrid()"
                [followCamera]="gridFollowCamera()"
            />
            <ngt-plane-geometry *args="gridArgs()" />
        </ngt-mesh>
    `,
    imports: [NgtArgs],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsGrid extends NgtSignalStore<NgtsGridState> {
    @Input() gridRef = injectNgtRef<THREE.Mesh>();
    @Input() set cellSize(cellSize: NgtsGridState['cellSize']) {
        this.set({ cellSize });
    }

    @Input() set cellThickness(cellThickness: NgtsGridState['cellThickness']) {
        this.set({ cellThickness });
    }

    @Input() set cellColor(cellColor: NgtsGridState['cellColor']) {
        this.set({ cellColor });
    }

    @Input() set sectionSize(sectionSize: NgtsGridState['sectionSize']) {
        this.set({ sectionSize });
    }

    @Input() set sectionThickness(sectionThickness: NgtsGridState['sectionThickness']) {
        this.set({ sectionThickness });
    }

    @Input() set sectionColor(sectionColor: NgtsGridState['sectionColor']) {
        this.set({ sectionColor });
    }

    @Input() set followCamera(followCamera: NgtsGridState['followCamera']) {
        this.set({ followCamera });
    }

    @Input() set infiniteGrid(infiniteGrid: NgtsGridState['infiniteGrid']) {
        this.set({ infiniteGrid });
    }

    @Input() set fadeDistance(fadeDistance: NgtsGridState['fadeDistance']) {
        this.set({ fadeDistance });
    }

    @Input() set fadeStrength(fadeStrength: NgtsGridState['fadeStrength']) {
        this.set({ fadeStrength });
    }

    @Input() set side(side: NgtsGridState['side']) {
        this.set({ side });
    }

    @Input() set args(args: NgtsGridState['args']) {
        this.set({ args });
    }

    readonly gridCellSize = this.select('cellSize');
    readonly gridSectionSize = this.select('sectionSize');
    readonly gridFadeDistance = this.select('fadeDistance');
    readonly gridFadeStrength = this.select('fadeStrength');
    readonly gridCellThickness = this.select('cellThickness');
    readonly gridSectionThickness = this.select('sectionThickness');
    readonly gridInfiniteGrid = this.select('infiniteGrid');
    readonly gridFollowCamera = this.select('followCamera');
    readonly gridCellColor = this.select('cellColor');
    readonly gridSectionColor = this.select('sectionColor');
    readonly gridSide = this.select('side');
    readonly gridArgs = this.select('args');

    constructor() {
        super({
            cellSize: 0.5,
            sectionSize: 1,
            fadeDistance: 100,
            fadeStrength: 1,
            cellThickness: 0.5,
            sectionThickness: 1,
            infiniteGrid: false,
            followCamera: false,
            cellColor: '#000000',
            sectionColor: '#2080ff',
            side: THREE.BackSide,
            args: [1, 1, 1],
        });
    }
}
