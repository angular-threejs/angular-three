import { NgIf } from '@angular/common';
import {
    ChangeDetectorRef,
    Component,
    computed,
    CUSTOM_ELEMENTS_SCHEMA,
    Directive,
    EventEmitter,
    inject,
    Input,
    OnChanges,
    Output,
} from '@angular/core';
import { createSignal, extend, NgtArgs, NgtSignalStore } from 'angular-three';
import { AmbientLight, Group, PointLight, SpotLight, Vector2 } from 'three';
import { NgtsAccumulativeShadows } from '../accumulative-shadows/accumulative-shadows';
import { NgtsRandomizedLights } from '../accumulative-shadows/randomized-lights';
import { NGTS_BOUNDS_API, NgtsBounds } from '../bounds/bounds';
import { NgtsCenter } from '../center/center';
import { NgtsContactShadows } from '../contact-shadows/contact-shadows';
import { NgtsEnvironmentPresetsType } from '../environment/assets';
import { NgtsEnvironment } from '../environment/environment';
import { NgtsEnvironmentInput } from '../environment/environment-input';

const presets = {
    rembrandt: {
        main: [1, 2, 1],
        fill: [-2, -0.5, -2],
    },
    portrait: {
        main: [-1, 2, 0.5],
        fill: [-1, 0.5, -1.5],
    },
    upfront: {
        main: [0, 2, 1],
        fill: [-1, 0.5, -1.5],
    },
    soft: {
        main: [-2, 4, 4],
        fill: [-1, 0.5, -1.5],
    },
};

type NgtsStageShadows = Partial<NgtsAccumulativeShadows> &
    Partial<NgtsRandomizedLights> &
    Partial<NgtsContactShadows> & {
        type: 'contact' | 'accumulative';
        /** Shadow plane offset, default: 0 */
        offset?: number;
        /** Shadow bias, default: -0.0001 */
        bias?: number;
        /** Shadow normal bias, default: 0 */
        normalBias?: number;
        /** Shadow map size, default: 1024 */
        size?: number;
    };

interface NgtsStageProps {
    /** Lighting setup, default: "rembrandt" */
    preset:
        | 'rembrandt'
        | 'portrait'
        | 'upfront'
        | 'soft'
        | { main: [x: number, y: number, z: number]; fill: [x: number, y: number, z: number] };
    /** Controls the ground shadows, default: "contact" */
    shadows: boolean | 'contact' | 'accumulative' | NgtsStageShadows;
    /** Optionally wraps and thereby centers the models using <Bounds>, can also be a margin, default: true */
    adjustCamera: boolean | number;
    /** The default environment, default: "city" */
    environment: NgtsEnvironmentPresetsType | Partial<NgtsEnvironmentInput>;
    /** The lighting intensity, default: 0.5 */
    intensity: number;
    /** To adjust centering, default: undefined */
    center?: Partial<NgtsCenter>;
}

@Directive({ selector: 'ngts-stage-refit', standalone: true })
export class NgtsStageRefit implements OnChanges {
    readonly #boundsApi = inject(NGTS_BOUNDS_API);

    @Input() radius = 0;
    @Input() adjustCamera = true;

    ngOnChanges() {
        if (this.adjustCamera) {
            this.#boundsApi().refresh().clip().fit();
        }
    }
}

extend({ AmbientLight, SpotLight, Vector2, PointLight, Group });

@Component({
    selector: 'ngts-stage',
    standalone: true,
    template: `
        <ngt-ambient-light [intensity]="stageIntensity() / 3" />
        <ngt-spot-light
            [penumbra]="1"
            [position]="spotLightPosition()"
            [intensity]="stageIntensity() * 2"
            [castShadow]="!!stageShadows()"
        >
            <ngt-value [rawValue]="shadowsInfo().shadowBias" attach="shadow.bias" />
            <ngt-value [rawValue]="shadowsInfo().normalBias" attach="shadow.normalBias" />
            <ngt-vector2 *args="[shadowsInfo().shadowSize, shadowsInfo().shadowSize]" attach="shadow.mapSize" />
        </ngt-spot-light>
        <ngt-point-light [position]="pointLightPosition()" [intensity]="stageIntensity()" />

        <ngts-bounds
            [fit]="!!stageAdjustCamera()"
            [clip]="!!stageAdjustCamera()"
            [margin]="Number(stageAdjustCamera())"
            [observe]="true"
        >
            <ngts-stage-refit [radius]="boundingState().radius" [adjustCamera]="!!stageAdjustCamera()" />
            <ngts-center
                [position]="[0, shadowsInfo().shadowOffset / 2, 0]"
                [top]="!!stageCenter()?.top"
                [right]="!!stageCenter()?.right"
                [bottom]="!!stageCenter()?.bottom"
                [left]="!!stageCenter()?.left"
                [front]="!!stageCenter()?.front"
                [back]="!!stageCenter()?.back"
                [disableX]="!!stageCenter()?.disableX"
                [disableY]="!!stageCenter()?.disableY"
                [disableZ]="!!stageCenter()?.disableZ"
                [precise]="!!stageCenter()?.precise"
                (centered)="onCentered($event)"
            >
                <ng-content />
            </ngts-center>
        </ngts-bounds>
        <ngt-group [position]="[0, -boundingState().height / 2 - shadowsInfo().shadowOffset / 2, 0]">
            <ngts-contact-shadows
                *ngIf="shadowsInfo().contactShadow"
                [scale]="boundingState().radius * 4"
                [far]="boundingState().radius"
                [blur]="2"
                [opacity]="shadowsInfo().opacity"
                [width]="shadowsInfo().width"
                [height]="shadowsInfo().height"
                [smooth]="shadowsInfo().smooth"
                [resolution]="shadowsInfo().resolution"
                [frames]="shadowsInfo().frames"
                [scale]="shadowsInfo().scale"
                [color]="shadowsInfo().color"
                [depthWrite]="shadowsInfo().depthWrite"
                [renderOrder]="shadowsInfo().renderOrder"
            />
            <ngts-accumulative-shadows
                *ngIf="shadowsInfo().accumulativeShadow"
                [temporal]="true"
                [frames]="100"
                [alphaTest]="0.9"
                [toneMapped]="true"
                [scale]="boundingState().radius * 4"
                [opacity]="shadowsInfo().opacity"
                [alphaTest]="shadowsInfo().alphaTest"
                [color]="shadowsInfo().color"
                [colorBlend]="shadowsInfo().colorBlend"
                [resolution]="shadowsInfo().resolution"
            >
                <ngts-randomized-lights
                    [amount]="shadowsInfo().amount ?? 8"
                    [radius]="shadowsInfo().radius ?? boundingState().radius"
                    [ambient]="shadowsInfo().ambient ?? 0.5"
                    [intensity]="shadowsInfo().intensity ?? 1"
                    [position]="spotLightPosition()"
                    [size]="boundingState().radius * 4"
                    [bias]="-shadowsInfo().shadowBias"
                    [mapSize]="shadowsInfo().shadowSize"
                />
            </ngts-accumulative-shadows>
        </ngt-group>
        <ngts-environment
            *ngIf="environmentInfo() as environmentInfo"
            [frames]="environmentInfo.frames"
            [near]="environmentInfo.near"
            [far]="environmentInfo.far"
            [resolution]="environmentInfo.resolution"
            [background]="environmentInfo.background"
            [blur]="environmentInfo.blur"
            [map]="environmentInfo.map"
            [files]="environmentInfo.files"
            [path]="environmentInfo.path"
            [preset]="environmentInfo.preset"
            [scene]="environmentInfo.scene"
            [extensions]="environmentInfo.extensions"
            [ground]="environmentInfo.ground"
            [encoding]="environmentInfo.encoding"
        />
    `,
    imports: [
        NgtArgs,
        NgtsBounds,
        NgtsStageRefit,
        NgtsCenter,
        NgIf,
        NgtsContactShadows,
        NgtsAccumulativeShadows,
        NgtsRandomizedLights,
        NgtsEnvironment,
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsStage extends NgtSignalStore<NgtsStageProps> {
    readonly #cdr = inject(ChangeDetectorRef);
    readonly Number = Number;

    @Input() set preset(preset: NgtsStageProps['preset']) {
        this.set({ preset });
    }

    @Input() set shadows(shadows: NgtsStageProps['shadows']) {
        this.set({ shadows });
    }

    @Input() set adjustCamera(adjustCamera: NgtsStageProps['adjustCamera']) {
        this.set({ adjustCamera });
    }

    @Input() set environment(environment: NgtsStageProps['environment']) {
        this.set({ environment });
    }

    @Input() set intensity(intensity: NgtsStageProps['intensity']) {
        this.set({ intensity });
    }

    @Input() set center(center: NgtsStageProps['center']) {
        this.set({ center });
    }

    @Output() centered = new EventEmitter() as NgtsCenter['centered'];

    readonly boundingState = createSignal({ radius: 0, width: 0, height: 0, depth: 0 });

    readonly #preset = this.select('preset');
    readonly #environment = this.select('environment');

    readonly stageShadows = this.select('shadows');
    readonly stageIntensity = this.select('intensity');
    readonly stageAdjustCamera = this.select('adjustCamera');
    readonly stageCenter = this.select('center');

    readonly config = computed(() => {
        const preset = this.#preset();
        return typeof preset === 'string' ? presets[preset] : preset;
    });

    readonly shadowsInfo = computed<any>(() => {
        const shadows = this.stageShadows();
        const restProps = typeof shadows === 'string' ? {} : (shadows as NgtsStageShadows) || {};
        return {
            contactShadow: shadows === 'contact' || (shadows as NgtsStageShadows)?.type === 'contact',
            accumulativeShadow: shadows === 'accumulative' || (shadows as NgtsStageShadows)?.type === 'accumulative',
            shadowBias: (shadows as NgtsStageShadows)?.bias ?? -0.0001,
            normalBias: (shadows as NgtsStageShadows)?.normalBias ?? 0,
            shadowSize: (shadows as NgtsStageShadows)?.size ?? 1024,
            shadowOffset: (shadows as NgtsStageShadows)?.offset ?? 0,
            ...restProps,
        };
    });

    readonly spotLightPosition = computed<[number, number, number]>(() => {
        const config = this.config();
        if (!config) return [0, 0, 0];
        const radius = this.boundingState().radius;
        return [config.main[0] * radius, config.main[1] * radius, config.main[2] * radius];
    });

    readonly pointLightPosition = computed(() => {
        const config = this.config();
        if (!config) return [0, 0, 0];
        const radius = this.boundingState().radius;
        return [config.fill[0] * radius, config.fill[1] * radius, config.fill[2] * radius];
    });

    readonly environmentInfo = computed(() => {
        const environment = this.#environment();
        if (!environment) return null;
        if (typeof environment === 'string') return { preset: environment };
        return environment;
    });

    constructor() {
        super({
            adjustCamera: true,
            intensity: 0.5,
            shadows: 'contact',
            environment: 'city',
            preset: 'rembrandt',
        });
    }

    onCentered(props: {
        /** The next parent above <Center> */
        parent: THREE.Object3D;
        /** The outmost container group of the <Center> component */
        container: THREE.Object3D;
        width: number;
        height: number;
        depth: number;
        boundingBox: THREE.Box3;
        boundingSphere: THREE.Sphere;
        center: THREE.Vector3;
        verticalAlignment: number;
        horizontalAlignment: number;
        depthAlignment: number;
    }) {
        const { boundingSphere, width, height, depth } = props;
        this.boundingState.set({ radius: boundingSphere.radius, width, height, depth });
        this.#cdr.detectChanges();
        if (this.centered.observed) this.centered.emit(props);
    }
}
