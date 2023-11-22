import {
	CUSTOM_ELEMENTS_SCHEMA,
	Component,
	Injector,
	Input,
	NgZone,
	computed,
	effect,
	inject,
	signal,
	untracked,
	type OnInit,
} from '@angular/core';
import {
	NgtArgs,
	createApiToken,
	extend,
	injectBeforeRender,
	injectNgtRef,
	is,
	signalStore,
	type NgtColor,
	type NgtRef,
	type NgtVector3,
} from 'angular-three-old';
import * as THREE from 'three';
import { Line2, LineMaterial, LineSegmentsGeometry } from 'three-stdlib';
import { SegmentObject } from './segment-object';

export type NgtsSegmentState = {
	start?: NgtVector3;
	end?: NgtVector3;
	color?: NgtColor;
};

export type NgtsSegmentsState = {
	limit: number;
	lineWidth: number;
};

declare global {
	interface HTMLElementTagNameMap {
		'ngt-segment-object': SegmentObject;
		'ngts-segment': NgtsSegmentState;
		'ngts-segments': NgtsSegmentsState;
	}
}

const normPos = (pos: NgtsSegmentState['start']): SegmentObject['start'] =>
	pos instanceof THREE.Vector3
		? pos
		: new THREE.Vector3(...((typeof pos === 'number' ? [pos, pos, pos] : pos) as [number, number, number]));

extend({ SegmentObject });

export const [injectNgtsSegmentsApi, provideNgtsSegmentsApi] = createApiToken(() => NgtsSegments);

@Component({
	selector: 'ngts-segment',
	standalone: true,
	template: `
		<ngt-segment-object [ref]="segmentRef" [color]="color()" [start]="normalizedStart()" [end]="normalizedEnd()" />
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsSegment implements OnInit {
	private inputs = signalStore<NgtsSegmentState>({});

	@Input() segmentRef = injectNgtRef<SegmentObject>();

	@Input({ alias: 'start' }) set _start(start: NgtVector3) {
		this.inputs.set({ start });
	}

	@Input({ alias: 'end' }) set _end(end: NgtVector3) {
		this.inputs.set({ end });
	}

	@Input({ alias: 'color' }) set _color(color: NgtColor) {
		this.inputs.set({ color });
	}

	private segmentsApi = injectNgtsSegmentsApi();
	private injector = inject(Injector);
	private zone = inject(NgZone);

	private start = this.inputs.select('start');
	private end = this.inputs.select('end');

	normalizedStart = computed(() => normPos(this.start()));
	normalizedEnd = computed(() => normPos(this.end()));
	color = this.inputs.select('color');

	ngOnInit() {
		effect(
			(onCleanup) => {
				const cleanup = this.zone.runOutsideAngular(() => {
					const api = this.segmentsApi();
					return api.subscribe(this.segmentRef);
				});
				onCleanup(cleanup);
			},
			{ injector: this.injector },
		);
	}
}

@Component({
	selector: 'ngts-segments',
	standalone: true,
	template: `
		<ngt-primitive *args="[line]" [ref]="segmentsRef">
			<ngt-primitive *args="[geometry]" attach="geometry" />
			<ngt-primitive
				*args="[material]"
				attach="material"
				ngtCompound
				[vertexColors]="true"
				[resolution]="resolution"
				[linewidth]="lineWidth()"
			/>
			<ng-content />
		</ngt-primitive>
	`,
	imports: [NgtArgs],
	providers: [provideNgtsSegmentsApi()],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NgtsSegments {
	private inputs = signalStore<NgtsSegmentsState>({ limit: 1000, lineWidth: 1 });

	@Input() segmentsRef = injectNgtRef<Line2>();

	@Input({ alias: 'limit' }) set _limit(limit: number) {
		this.inputs.set({ limit });
	}

	@Input({ alias: 'lineWidth' }) set _lineWidth(lineWidth: number) {
		this.inputs.set({ lineWidth });
	}

	private segments = signal<NgtRef<SegmentObject>[]>([]);
	private limit = this.inputs.select('limit');

	private positions = computed(() => Array(this.limit() * 6).fill(0));
	private colors = computed(() => Array(this.limit() * 6).fill(0));

	resolution = new THREE.Vector2(512, 512);
	lineWidth = this.inputs.select('lineWidth');
	line = new Line2();
	material = new LineMaterial();
	geometry = new LineSegmentsGeometry();

	api = computed(() => ({
		subscribe: (segmentRef: NgtRef<SegmentObject>) => {
			untracked(() => {
				this.segments.update((s) => [...s, segmentRef]);
			});

			return () => {
				untracked(() => {
					this.segments.update((s) => s.filter((segment) => segment !== segmentRef));
				});
			};
		},
	}));

	constructor() {
		this.beforeRender();
	}

	private beforeRender() {
		injectBeforeRender(() => {
			const [segments, limit, positions, colors] = [
				this.segments(),
				this.limit(),
				this.positions(),
				this.colors(),
			];
			for (let i = 0; i < limit; i++) {
				const segmentRef = segments[i];
				const segment = is.ref(segmentRef) ? segmentRef.nativeElement : segmentRef;
				if (segment) {
					positions[i * 6 + 0] = segment.start.x;
					positions[i * 6 + 1] = segment.start.y;
					positions[i * 6 + 2] = segment.start.z;

					positions[i * 6 + 3] = segment.end.x;
					positions[i * 6 + 4] = segment.end.y;
					positions[i * 6 + 5] = segment.end.z;

					colors[i * 6 + 0] = segment.color.r;
					colors[i * 6 + 1] = segment.color.g;
					colors[i * 6 + 2] = segment.color.b;

					colors[i * 6 + 3] = segment.color.r;
					colors[i * 6 + 4] = segment.color.g;
					colors[i * 6 + 5] = segment.color.b;
				}
			}
			this.geometry.setColors(colors);
			this.geometry.setPositions(positions);
			this.line.computeLineDistances();
		});
	}
}
