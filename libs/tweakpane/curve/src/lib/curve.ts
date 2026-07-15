import { computed, DestroyRef, Directive, effect, inject, input, model, untracked } from '@angular/core';
import {
	BaseBladeParams,
	BladeApi,
	BladeController,
	type BladePlugin,
	createPlugin,
	Emitter,
	type View,
	type ViewProps,
} from '@tweakpane/core';
import { TweakpaneBlade, TweakpaneFolder, TweakpanePane } from 'angular-three-tweakpane';
import type { TpPluginBundle } from 'tweakpane';

export interface TweakpaneCurvePoint {
	x: number;
	y: number;
	r_in?: number;
	r_out?: number;
	w_in?: number;
	w_out?: number;
}

/** Structurally compatible with `NgteEcctrlCurveData` without depending on Ecctrl. */
export interface TweakpaneCurveData {
	points: ReadonlyArray<TweakpaneCurvePoint>;
	samples?: number;
}

export interface TweakpaneCurveParams {
	minX?: number;
	maxX?: number;
	minY?: number;
	maxY?: number;
}

interface CurveBladeParams extends BaseBladeParams, Required<TweakpaneCurveParams> {
	view: 'angular-three-curve';
	value: TweakpaneCurveData;
	label?: string;
}

interface CurveEvents {
	change: { value: TweakpaneCurveData; last: boolean };
}

type CurveSelectionKind = 'point' | 'in' | 'out';

interface CurveSelection {
	index: number;
	kind: CurveSelectionKind;
}

const SVG_NS = 'http://www.w3.org/2000/svg';
const VIEW_WIDTH = 220;
const VIEW_HEIGHT = 112;
const VIEW_PADDING = 10;
const TANGENT_LENGTH = 0.18;
const CURVE_X_EPSILON = 1e-6;
const MIN_TANGENT_ANGLE = -Math.PI / 2;
const MAX_TANGENT_ANGLE = Math.PI / 2;
const MAX_TANGENT_WEIGHT = 3;
const DEFAULT_CURVE_PARAMS: Required<TweakpaneCurveParams> = {
	minX: 0,
	maxX: 1,
	minY: 0,
	maxY: 1,
};

class CurveView implements View {
	readonly element: HTMLElement;
	readonly svg: SVGSVGElement;
	readonly path: SVGPathElement;
	readonly tangents: SVGGElement;
	readonly points: SVGGElement;
	readonly label: HTMLDivElement;

	constructor(document: Document, viewProps: ViewProps) {
		this.element = document.createElement('div');
		this.element.classList.add('tweakpane-curve');
		viewProps.bindClassModifiers(this.element);

		this.label = document.createElement('div');
		this.label.classList.add('tweakpane-curve__label');
		this.element.appendChild(this.label);

		this.svg = document.createElementNS(SVG_NS, 'svg');
		this.svg.classList.add('tweakpane-curve__editor');
		this.svg.setAttribute('viewBox', `0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`);
		this.svg.setAttribute('role', 'application');
		this.svg.setAttribute('aria-label', 'Curve editor');
		this.svg.setAttribute('tabindex', '0');
		this.svg.setAttribute('preserveAspectRatio', 'none');
		this.element.appendChild(this.svg);

		const grid = document.createElementNS(SVG_NS, 'path');
		grid.classList.add('tweakpane-curve__grid');
		grid.setAttribute(
			'd',
			`M ${VIEW_PADDING} ${VIEW_HEIGHT / 2} H ${VIEW_WIDTH - VIEW_PADDING} M ${VIEW_WIDTH / 2} ${VIEW_PADDING} V ${VIEW_HEIGHT - VIEW_PADDING}`,
		);
		this.svg.appendChild(grid);

		this.path = document.createElementNS(SVG_NS, 'path');
		this.path.classList.add('tweakpane-curve__path');
		this.svg.appendChild(this.path);

		this.tangents = document.createElementNS(SVG_NS, 'g');
		this.svg.appendChild(this.tangents);

		this.points = document.createElementNS(SVG_NS, 'g');
		this.svg.appendChild(this.points);
	}

	render(value: TweakpaneCurveData, params: Required<TweakpaneCurveParams>, selected: CurveSelection | null) {
		const points = normalizeCurveData(value, params).points;
		const commands: string[] = [];
		for (let index = 0; index < 64; index++) {
			const x = params.minX + ((params.maxX - params.minX) * index) / 63;
			const y = evaluateCurve(points, x);
			const screen = toScreen({ x, y }, params);
			commands.push(`${index === 0 ? 'M' : 'L'} ${screen.x.toFixed(2)} ${screen.y.toFixed(2)}`);
		}
		this.path.setAttribute('d', commands.join(' '));
		this.tangents.replaceChildren();
		this.points.replaceChildren();
		for (const [index, point] of points.entries()) {
			if (index > 0) this.renderTangent(points, index, 'in', params, selected);
			if (index < points.length - 1) this.renderTangent(points, index, 'out', params, selected);

			const screen = toScreen(point, params);
			const circle = this.svg.ownerDocument.createElementNS(SVG_NS, 'circle');
			circle.classList.add('tweakpane-curve__point');
			if (selected?.index === index && selected.kind === 'point') {
				circle.classList.add('tweakpane-curve__point--selected');
			}
			circle.dataset['index'] = String(index);
			circle.setAttribute('cx', String(screen.x));
			circle.setAttribute('cy', String(screen.y));
			circle.setAttribute('r', selected?.index === index && selected.kind === 'point' ? '5' : '4');
			this.points.appendChild(circle);
		}
	}

	private renderTangent(
		points: ReadonlyArray<TweakpaneCurvePoint>,
		index: number,
		kind: 'in' | 'out',
		params: Required<TweakpaneCurveParams>,
		selected: CurveSelection | null,
	) {
		const point = points[index];
		const handle = getTangentHandle(point, kind, params);
		const pointScreen = toScreen(point, params);
		const handleScreen = toScreen(handle, params);
		const line = this.svg.ownerDocument.createElementNS(SVG_NS, 'line');
		line.classList.add('tweakpane-curve__tangent-line');
		line.setAttribute('x1', String(pointScreen.x));
		line.setAttribute('y1', String(pointScreen.y));
		line.setAttribute('x2', String(handleScreen.x));
		line.setAttribute('y2', String(handleScreen.y));
		this.tangents.appendChild(line);

		const circle = this.svg.ownerDocument.createElementNS(SVG_NS, 'circle');
		circle.classList.add('tweakpane-curve__tangent');
		if (selected?.index === index && selected.kind === kind) {
			circle.classList.add('tweakpane-curve__tangent--selected');
		}
		circle.dataset['index'] = String(index);
		circle.dataset['tangent'] = kind;
		circle.setAttribute('cx', String(handleScreen.x));
		circle.setAttribute('cy', String(handleScreen.y));
		circle.setAttribute('r', selected?.index === index && selected.kind === kind ? '4' : '3');
		this.tangents.appendChild(circle);
	}
}

class CurveController extends BladeController<CurveView> {
	readonly emitter = new Emitter<CurveEvents>();
	private curveData: TweakpaneCurveData;
	private selected: CurveSelection | null = null;
	private pointerId: number | null = null;

	constructor(
		document: Document,
		readonly params: CurveBladeParams,
		blade: ConstructorParameters<typeof BladeController>[0]['blade'],
		viewProps: ViewProps,
	) {
		const view = new CurveView(document, viewProps);
		super({ blade, view, viewProps });
		this.curveData = normalizeCurveData(params.value, params);
		this.view.label.textContent = params.label ?? '';
		this.view.label.hidden = !params.label;
		this.render();

		this.onPointerDown = this.onPointerDown.bind(this);
		this.onPointerMove = this.onPointerMove.bind(this);
		this.onPointerEnd = this.onPointerEnd.bind(this);
		this.onDoubleClick = this.onDoubleClick.bind(this);
		this.onContextMenu = this.onContextMenu.bind(this);
		this.onKeyDown = this.onKeyDown.bind(this);
		view.svg.addEventListener('pointerdown', this.onPointerDown);
		view.svg.addEventListener('pointermove', this.onPointerMove);
		view.svg.addEventListener('pointerup', this.onPointerEnd);
		view.svg.addEventListener('pointercancel', this.onPointerEnd);
		view.svg.addEventListener('lostpointercapture', this.onPointerEnd);
		view.svg.addEventListener('dblclick', this.onDoubleClick);
		view.svg.addEventListener('contextmenu', this.onContextMenu);
		view.svg.addEventListener('keydown', this.onKeyDown);
		viewProps.handleDispose(() => this.disposeListeners());
	}

	getValue() {
		return cloneCurveData(this.curveData);
	}

	setValue(value: TweakpaneCurveData, emit = false, last = true) {
		this.curveData = normalizeCurveData(value, this.params);
		this.render();
		if (emit) this.emitter.emit('change', { value: this.getValue(), last });
	}

	private onPointerDown(event: PointerEvent) {
		if (this.viewProps.globalDisabled.rawValue || this.pointerId !== null) return;
		const target = event.target as SVGElement;
		const index = target.dataset['index'];
		if (index === undefined) return;
		event.preventDefault();
		const tangent = target.dataset['tangent'];
		this.selected = {
			index: Number(index),
			kind: tangent === 'in' || tangent === 'out' ? tangent : 'point',
		};
		this.pointerId = event.pointerId;
		this.view.svg.setPointerCapture?.(event.pointerId);
		this.render();
	}

	private onPointerMove(event: PointerEvent) {
		if (event.pointerId !== this.pointerId || this.selected === null) return;
		event.preventDefault();
		this.moveSelected(event, false);
	}

	private onPointerEnd(event: PointerEvent) {
		if (event.pointerId !== this.pointerId) return;
		if (this.selected !== null) this.moveSelected(event, true);
		if (this.view.svg.hasPointerCapture?.(event.pointerId)) this.view.svg.releasePointerCapture?.(event.pointerId);
		this.pointerId = null;
	}

	private onDoubleClick(event: MouseEvent) {
		if (this.viewProps.globalDisabled.rawValue) return;
		event.preventDefault();
		const point = fromClient(event, this.view.svg, this.params);
		const added = { ...point, r_in: 0, r_out: 0, w_in: 1, w_out: 1 };
		const points = [...this.curveData.points, added].sort((a, b) => a.x - b.x);
		this.selected = { index: points.indexOf(added), kind: 'point' };
		this.setValue({ ...this.curveData, points }, true, true);
	}

	private onContextMenu(event: MouseEvent) {
		if (this.viewProps.globalDisabled.rawValue || this.curveData.points.length <= 2) return;
		const target = event.target as SVGElement;
		if (target.dataset['tangent']) return;
		const index = target.dataset['index'];
		if (index === undefined) return;
		event.preventDefault();
		const points = this.curveData.points.filter((_, pointIndex) => pointIndex !== Number(index));
		this.selected = null;
		this.setValue({ ...this.curveData, points }, true, true);
	}

	private onKeyDown(event: KeyboardEvent) {
		if (this.viewProps.globalDisabled.rawValue || this.selected === null) return;
		if (event.key === 'Delete' || event.key === 'Backspace') {
			event.preventDefault();
			if (this.selected.kind === 'point') {
				if (this.curveData.points.length <= 2) return;
				const points = this.curveData.points.filter((_, index) => index !== this.selected?.index);
				this.selected = null;
				this.setValue({ ...this.curveData, points }, true, true);
			} else {
				const angleKey = this.selected.kind === 'in' ? 'r_in' : 'r_out';
				const weightKey = this.selected.kind === 'in' ? 'w_in' : 'w_out';
				const selectedIndex = this.selected.index;
				const points = this.curveData.points.map((point, index) => {
					if (index !== selectedIndex) return point;
					const reset = { ...point };
					delete reset[angleKey];
					delete reset[weightKey];
					return reset;
				});
				this.setValue({ ...this.curveData, points }, true, true);
			}
			return;
		}

		const direction =
			event.key === 'ArrowLeft' || event.key === 'ArrowDown'
				? -1
				: event.key === 'ArrowRight' || event.key === 'ArrowUp'
					? 1
					: 0;
		if (direction === 0) return;
		event.preventDefault();
		if (this.selected.kind !== 'point') {
			const current = this.curveData.points[this.selected.index];
			const angleKey = this.selected.kind === 'in' ? 'r_in' : 'r_out';
			const weightKey = this.selected.kind === 'in' ? 'w_in' : 'w_out';
			const points = this.curveData.points.map((point, index) => {
				if (index !== this.selected?.index) return point;
				if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
					return {
						...point,
						[angleKey]: clamp(
							(current[angleKey] ?? 0) + direction * 0.02,
							MIN_TANGENT_ANGLE,
							MAX_TANGENT_ANGLE,
						),
					};
				}
				return {
					...point,
					[weightKey]: clamp((current[weightKey] ?? 1) + direction * 0.05, 0, MAX_TANGENT_WEIGHT),
				};
			});
			this.setValue({ ...this.curveData, points }, true, true);
			return;
		}
		const xStep = (this.params.maxX - this.params.minX) / 100;
		const yStep = (this.params.maxY - this.params.minY) / 100;
		const current = this.curveData.points[this.selected.index];
		const next = {
			...current,
			x: current.x + (event.key === 'ArrowLeft' || event.key === 'ArrowRight' ? direction * xStep : 0),
			y: current.y + (event.key === 'ArrowDown' || event.key === 'ArrowUp' ? direction * yStep : 0),
		};
		this.updateSelectedPoint(next, true);
	}

	private moveSelected(event: PointerEvent, last: boolean) {
		if (this.selected?.kind === 'point') {
			this.updateSelectedPoint(fromClient(event, this.view.svg, this.params), last);
			return;
		}
		if (this.selected) {
			this.updateSelectedTangent(fromClient(event, this.view.svg, this.params, false), last);
		}
	}

	private updateSelectedPoint(point: Pick<TweakpaneCurvePoint, 'x' | 'y'>, last: boolean) {
		if (this.selected === null) return;
		const selectedIndex = this.selected.index;
		const epsilon = Math.abs(this.params.maxX - this.params.minX) * CURVE_X_EPSILON;
		const minX = selectedIndex > 0 ? this.curveData.points[selectedIndex - 1].x + epsilon : this.params.minX;
		const maxX =
			selectedIndex < this.curveData.points.length - 1
				? this.curveData.points[selectedIndex + 1].x - epsilon
				: this.params.maxX;
		const points = this.curveData.points.map((candidate, index) =>
			index === selectedIndex
				? {
						...candidate,
						x: clamp(point.x, minX, maxX),
						y: clamp(point.y, this.params.minY, this.params.maxY),
					}
				: candidate,
		);
		this.setValue({ ...this.curveData, points }, true, last);
	}

	private updateSelectedTangent(cursor: Pick<TweakpaneCurvePoint, 'x' | 'y'>, last: boolean) {
		if (this.selected === null || this.selected.kind === 'point') return;
		const points = updateCurveTangent(
			this.curveData.points,
			this.selected.index,
			this.selected.kind,
			cursor,
			this.params,
		);
		this.setValue({ ...this.curveData, points }, true, last);
	}

	private render() {
		this.view.render(this.curveData, this.params, this.selected);
	}

	private disposeListeners() {
		const view = this.view.svg;
		view.removeEventListener('pointerdown', this.onPointerDown);
		view.removeEventListener('pointermove', this.onPointerMove);
		view.removeEventListener('pointerup', this.onPointerEnd);
		view.removeEventListener('pointercancel', this.onPointerEnd);
		view.removeEventListener('lostpointercapture', this.onPointerEnd);
		view.removeEventListener('dblclick', this.onDoubleClick);
		view.removeEventListener('contextmenu', this.onContextMenu);
		view.removeEventListener('keydown', this.onKeyDown);
	}
}

export interface TweakpaneCurveApiEvents {
	change: { value: TweakpaneCurveData; last: boolean };
}

export class TweakpaneCurveApi extends BladeApi<CurveController> {
	get value() {
		return this.controller.getValue();
	}

	set value(value: TweakpaneCurveData) {
		this.controller.setValue(value);
	}

	on(eventName: 'change', handler: (event: TweakpaneCurveApiEvents['change']) => void) {
		this.controller.emitter.on(eventName, handler);
		return this;
	}

	off(eventName: 'change', handler: (event: TweakpaneCurveApiEvents['change']) => void) {
		this.controller.emitter.off(eventName, handler);
		return this;
	}
}

const CurvePlugin: BladePlugin<CurveBladeParams> = createPlugin({
	id: 'angular-three-curve',
	type: 'blade',
	accept(params) {
		if (params['view'] !== 'angular-three-curve' || !isCurveData(params['value'])) return null;
		return {
			params: {
				view: 'angular-three-curve',
				value: params['value'],
				label: typeof params['label'] === 'string' ? params['label'] : undefined,
				minX: numberParam(params['minX'], 0),
				maxX: numberParam(params['maxX'], 1),
				minY: numberParam(params['minY'], 0),
				maxY: numberParam(params['maxY'], 1),
			},
		};
	},
	controller(args) {
		return new CurveController(args.document, args.params, args.blade, args.viewProps);
	},
	api(args) {
		return args.controller instanceof CurveController ? new TweakpaneCurveApi(args.controller) : null;
	},
});

export const TWEAKPANE_CURVE_PLUGIN: TpPluginBundle = {
	id: 'angular-three-tweakpane-curve',
	plugins: [CurvePlugin],
	css: `
		.tweakpane-curve { padding: 4px 0; }
		.tweakpane-curve__label { color: var(--lbl-fg); font-size: 11px; margin-bottom: 4px; }
		.tweakpane-curve__editor { background: var(--in-bg); border-radius: var(--bld-br); display: block; height: 112px; touch-action: none; width: 100%; }
		.tweakpane-curve__grid { fill: none; stroke: var(--in-fg); stroke-opacity: .12; stroke-width: 1; }
		.tweakpane-curve__path { fill: none; stroke: var(--btn-bg-a); stroke-width: 2; }
		.tweakpane-curve__tangent-line { pointer-events: none; stroke: var(--in-fg); stroke-opacity: .45; stroke-width: 1; }
		.tweakpane-curve__tangent { cursor: crosshair; fill: var(--in-bg); stroke: var(--btn-fg); stroke-width: 1.5; }
		.tweakpane-curve__tangent--selected { fill: var(--btn-bg-a); stroke: var(--btn-fg); }
		.tweakpane-curve__point { cursor: grab; fill: var(--btn-fg); stroke: var(--btn-bg-a); stroke-width: 2; }
		.tweakpane-curve__point--selected { fill: var(--btn-bg-a); stroke: var(--btn-fg); }
	`,
};

/** A two-way Tweakpane curve editor compatible with Ecctrl's curve DTO. */
@Directive({
	selector: 'tweakpane-curve',
	hostDirectives: [{ directive: TweakpaneBlade, inputs: ['hidden', 'disabled'] }],
})
export class TweakpaneCurve {
	value = model.required<TweakpaneCurveData>();
	label = input<string>();
	params = input<TweakpaneCurveParams>({});

	private readonly folder = inject(TweakpaneFolder);
	private readonly pane = inject(TweakpanePane);
	private readonly blade = inject(TweakpaneBlade);

	private readonly api = computed(() => {
		const folder = this.folder.folder();
		if (!folder) return null;
		const params = this.params();
		return folder.addBlade({
			view: 'angular-three-curve',
			value: untracked(this.value),
			label: this.label(),
			...params,
		}) as TweakpaneCurveApi;
	});

	constructor() {
		this.pane.registerPlugin(TWEAKPANE_CURVE_PLUGIN);
		this.blade.sync(this.api);

		effect((onCleanup) => {
			const api = this.api();
			if (!api) return;
			const onChange = (event: TweakpaneCurveApiEvents['change']) => this.value.set(event.value);
			api.on('change', onChange);
			onCleanup(() => {
				api.off('change', onChange);
				api.dispose();
			});
		});

		effect(() => {
			const api = this.api();
			if (api) api.value = this.value();
		});

		inject(DestroyRef).onDestroy(() => this.api()?.dispose());
	}
}

export function normalizeCurveData(
	value: TweakpaneCurveData,
	params: TweakpaneCurveParams = DEFAULT_CURVE_PARAMS,
): TweakpaneCurveData {
	const resolvedParams = {
		minX: numberParam(params.minX, DEFAULT_CURVE_PARAMS.minX),
		maxX: numberParam(params.maxX, DEFAULT_CURVE_PARAMS.maxX),
		minY: numberParam(params.minY, DEFAULT_CURVE_PARAMS.minY),
		maxY: numberParam(params.maxY, DEFAULT_CURVE_PARAMS.maxY),
	};
	const points = value.points
		.map((point) => ({
			...point,
			x: clamp(point.x, resolvedParams.minX, resolvedParams.maxX),
			y: clamp(point.y, resolvedParams.minY, resolvedParams.maxY),
		}))
		.sort((a, b) => a.x - b.x)
		.map((point, index, sorted) => {
			const normalized = { ...point };
			if (index === 0) {
				delete normalized.r_in;
				delete normalized.w_in;
			}
			if (index === sorted.length - 1) {
				delete normalized.r_out;
				delete normalized.w_out;
			}
			return normalized;
		});
	return {
		...value,
		points,
	};
}

/** @internal Pure tangent update used by the blade controller and focused tests. */
export function updateCurveTangent(
	points: ReadonlyArray<TweakpaneCurvePoint>,
	index: number,
	kind: 'in' | 'out',
	cursor: Pick<TweakpaneCurvePoint, 'x' | 'y'>,
	params: Required<TweakpaneCurveParams>,
): ReadonlyArray<TweakpaneCurvePoint> {
	const point = points[index];
	if (!point) return points;
	const direction = kind === 'out' ? 1 : -1;
	const dx = (cursor.x - point.x) * direction;
	const dy = (cursor.y - point.y) * direction;
	const angle = clamp(Math.atan2(dy, dx), MIN_TANGENT_ANGLE, MAX_TANGENT_ANGLE);
	const weight = clamp(Math.hypot(dx, dy) / tangentUnitLength(params), 0, MAX_TANGENT_WEIGHT);
	const angleKey = kind === 'in' ? 'r_in' : 'r_out';
	const weightKey = kind === 'in' ? 'w_in' : 'w_out';
	return points.map((candidate, candidateIndex) =>
		candidateIndex === index ? { ...candidate, [angleKey]: angle, [weightKey]: weight } : candidate,
	);
}

function getTangentHandle(point: TweakpaneCurvePoint, kind: 'in' | 'out', params: Required<TweakpaneCurveParams>) {
	const direction = kind === 'out' ? 1 : -1;
	const angle = kind === 'in' ? (point.r_in ?? 0) : (point.r_out ?? 0);
	const weight = kind === 'in' ? (point.w_in ?? 1) : (point.w_out ?? 1);
	const length = tangentUnitLength(params) * weight * direction;
	return {
		x: point.x + Math.cos(angle) * length,
		y: point.y + Math.sin(angle) * length,
	};
}

function tangentUnitLength(params: Required<TweakpaneCurveParams>) {
	const xRange = Math.abs(params.maxX - params.minX);
	const yRange = Math.abs(params.maxY - params.minY);
	const ranges = [xRange, yRange].filter((range) => range > 1e-9);
	return (ranges.length > 0 ? Math.min(...ranges) : 1) * TANGENT_LENGTH;
}

function isCurveData(value: unknown): value is TweakpaneCurveData {
	return !!value && typeof value === 'object' && Array.isArray((value as TweakpaneCurveData).points);
}

function cloneCurveData(value: TweakpaneCurveData): TweakpaneCurveData {
	return { ...value, points: value.points.map((point) => ({ ...point })) };
}

function numberParam(value: unknown, fallback: number) {
	return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function clamp(value: number, min: number, max: number) {
	return Math.min(Math.max(value, Math.min(min, max)), Math.max(min, max));
}

function toScreen(point: Pick<TweakpaneCurvePoint, 'x' | 'y'>, params: Required<TweakpaneCurveParams>) {
	const width = VIEW_WIDTH - VIEW_PADDING * 2;
	const height = VIEW_HEIGHT - VIEW_PADDING * 2;
	return {
		x: VIEW_PADDING + ((point.x - params.minX) / Math.max(params.maxX - params.minX, 1e-9)) * width,
		y: VIEW_HEIGHT - VIEW_PADDING - ((point.y - params.minY) / Math.max(params.maxY - params.minY, 1e-9)) * height,
	};
}

function fromClient(
	event: Pick<MouseEvent, 'clientX' | 'clientY'>,
	element: SVGSVGElement,
	params: Required<TweakpaneCurveParams>,
	clampToBounds = true,
) {
	const rect = element.getBoundingClientRect();
	const viewX = ((event.clientX - rect.left) / Math.max(rect.width, 1)) * VIEW_WIDTH;
	const viewY = ((event.clientY - rect.top) / Math.max(rect.height, 1)) * VIEW_HEIGHT;
	const rawX = (viewX - VIEW_PADDING) / (VIEW_WIDTH - VIEW_PADDING * 2);
	const rawY = (viewY - VIEW_PADDING) / (VIEW_HEIGHT - VIEW_PADDING * 2);
	const x = clampToBounds ? clamp(rawX, 0, 1) : rawX;
	const y = clampToBounds ? clamp(rawY, 0, 1) : rawY;
	return {
		x: params.minX + x * (params.maxX - params.minX),
		y: params.maxY - y * (params.maxY - params.minY),
	};
}

function evaluateCurve(points: ReadonlyArray<TweakpaneCurvePoint>, value: number) {
	if (points.length === 0) return 0;
	if (points.length === 1 || value <= points[0].x) return points[0].y;
	for (let index = 1; index < points.length; index++) {
		const previous = points[index - 1];
		const next = points[index];
		if (value > next.x) continue;
		const width = next.x - previous.x;
		if (width <= 0) return previous.y;
		const t = clamp((value - previous.x) / width, 0, 1);
		const t2 = t * t;
		const t3 = t2 * t;
		const linearSlope = (next.y - previous.y) / width;
		const outgoingSlope =
			linearSlope +
			((previous.r_out === undefined ? 0 : Math.tan(previous.r_out)) - linearSlope) * (previous.w_out ?? 1);
		const incomingSlope =
			linearSlope + ((next.r_in === undefined ? 0 : Math.tan(next.r_in)) - linearSlope) * (next.w_in ?? 1);
		return (
			(2 * t3 - 3 * t2 + 1) * previous.y +
			(t3 - 2 * t2 + t) * width * outgoingSlope +
			(-2 * t3 + 3 * t2) * next.y +
			(t3 - t2) * width * incomingSlope
		);
	}
	return points[points.length - 1].y;
}
