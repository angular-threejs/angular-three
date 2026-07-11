import { NgTemplateOutlet } from '@angular/common';
import {
	ChangeDetectionStrategy,
	Component,
	computed,
	DestroyRef,
	effect,
	ElementRef,
	inject,
	input,
	output,
	Renderer2,
	untracked,
	viewChild,
} from '@angular/core';
import { beforeRender, injectStore, is, NgtHTML, pick, resolveRef } from 'angular-three';
import { mergeInputs } from 'ngxtension/inject-inputs';
import * as THREE from 'three';
import { acquireCanvasStyleLease } from './canvas-style-lease';
import { acquireHTMLFramePreparation } from './frame-preparation';
import { NgtsHTMLImpl } from './html';
import {
	CalculatePosition,
	defaultCalculatePosition,
	epsilon,
	getCameraCSSMatrix,
	getObjectCSSMatrix,
	isObjectBehindCamera,
	isObjectVisible,
	objectDistance,
	objectScale,
	objectZIndex,
} from './utils';

/**
 * Valid CSS pointer-events property values.
 */
type PointerEventsProperties =
	| 'auto'
	| 'none'
	| 'visiblePainted'
	| 'visibleFill'
	| 'visibleStroke'
	| 'visible'
	| 'painted'
	| 'fill'
	| 'stroke'
	| 'all'
	| 'inherit';

/**
 * Configuration options for the NgtsHTMLContent component.
 */
export interface NgtsHTMLContentOptions {
	/**
	 * Epsilon for position/zoom change detection.
	 * Lower values = more frequent updates.
	 *
	 * @default 0.001
	 */
	eps: number;
	/**
	 * Range for automatic z-index calculation based on camera distance.
	 * `[max, min]` - closer objects get higher z-index.
	 *
	 * @default [16777271, 0]
	 */
	zIndexRange: [number, number];
	/**
	 * Centers the HTML element on the projected point.
	 * Applies `transform: translate3d(-50%, -50%, 0)`.
	 *
	 * @default false
	 */
	center: boolean;
	/**
	 * Prepends to parent instead of appending.
	 * Useful for z-index stacking order control.
	 *
	 * @default false
	 */
	prepend: boolean;
	/**
	 * Makes the container fill the entire canvas size.
	 * Useful for full-screen overlays anchored to a 3D point.
	 *
	 * @default false
	 */
	fullscreen: boolean;
	/**
	 * CSS class applied to the inner container div.
	 */
	containerClass: string;
	/**
	 * Inline styles applied to the inner container div.
	 */
	containerStyle: Partial<CSSStyleDeclaration>;
	/**
	 * CSS `pointer-events` value for the HTML content.
	 * Set to `'none'` to allow clicking through to the canvas.
	 *
	 * @default 'auto'
	 */
	pointerEvents: PointerEventsProperties;
	/**
	 * Custom function to calculate screen position from 3D coordinates.
	 *
	 * @default defaultCalculatePosition
	 */
	calculatePosition: CalculatePosition;
	/**
	 * When `true` (with `transform: true` on parent), HTML always faces the camera.
	 * Similar to THREE.Sprite behavior.
	 *
	 * @default false
	 */
	sprite: boolean;
	/**
	 * Scales HTML based on distance from camera.
	 * Higher values = larger HTML at same distance.
	 * - In transform mode: affects CSS matrix scaling
	 * - In non-transform mode: affects CSS scale transform
	 */
	distanceFactor?: number;
	/**
	 * Custom parent element for the HTML content.
	 * Defaults to the canvas container or `events.connected` element.
	 */
	parent?: HTMLElement | ElementRef<HTMLElement>;
	/**
	 * Computes z-index with a logarithmic scale, which prevents
	 * near objects from all having the same z-index when
	 * camera.far is very large.
	 */
	logarithmicDepth?: boolean;
}

const defaultHtmlContentOptions: NgtsHTMLContentOptions = {
	eps: 0.001,
	zIndexRange: [16777271, 0],
	pointerEvents: 'auto',
	calculatePosition: defaultCalculatePosition,
	containerClass: '',
	containerStyle: {},
	center: false,
	prepend: false,
	fullscreen: false,
	sprite: false,
};

function setStyleIfChanged(renderer: Renderer2, element: HTMLElement, property: string, value: string) {
	if (element.style.getPropertyValue(property) === value) return;
	renderer.setStyle(element, property, value);
}

/**
 * Renders HTML content positioned relative to a `NgtsHTML` anchor in 3D space.
 *
 * This component projects the parent THREE.Group's world position to screen
 * coordinates and uses CSS absolute positioning/transforms to overlay HTML
 * on the canvas.
 *
 * Must be used as a child of `ngts-html`. The host `div` element is the actual
 * positioned element. Extends `NgtHTML` to integrate with the custom renderer.
 *
 * @example
 * ```html
 * <ngts-html [options]="{ transform: true }">
 *   <!-- Basic label -->
 *   <div [htmlContent]="{ distanceFactor: 10 }">
 *     <h1>Title</h1>
 *   </div>
 * </ngts-html>
 *
 * <!-- With styling and interactivity -->
 * <ngts-html>
 *   <div
 *     [htmlContent]="{
 *       center: true,
 *       containerClass: 'tooltip',
 *       pointerEvents: 'auto'
 *     }"
 *     (click)="handleClick()"
 *   >
 *     <button>Click me</button>
 *   </div>
 * </ngts-html>
 *
 * <!-- Custom occlusion handling -->
 * <ngts-html [options]="{ occlude: true }">
 *   <div
 *     [htmlContent]="{}"
 *     (occluded)="isHidden = $event"
 *     [class.faded]="isHidden"
 *   >
 *     Content with custom occlusion handling
 *   </div>
 * </ngts-html>
 * ```
 */
@Component({
	selector: 'div[htmlContent]',
	template: `
		@if (html.transform()) {
			<div
				#transformOuter
				style="position: absolute; top: 0; left: 0; transform-style: preserve-3d; pointer-events: none;"
				[style.width.px]="size.width()"
				[style.height.px]="size.height()"
			>
				<div #transformInner style="position: absolute" [style.pointer-events]="pointerEvents()">
					<div #container [class]="containerClass()" [style]="containerStyle()">
						<ng-container [ngTemplateOutlet]="content" />
					</div>
				</div>
			</div>
		} @else {
			<div
				#container
				style="position:absolute"
				[style.transform]="center() ? 'translate3d(-50%,-50%,0)' : 'none'"
				[style.top.px]="fullscreen() ? -size.height() / 2 : null"
				[style.left.px]="fullscreen() ? -size.width() / 2 : null"
				[style.width.px]="fullscreen() ? size.width() : null"
				[style.height.px]="fullscreen() ? size.height() : null"
				[style.pointer-events]="pointerEvents()"
				[class]="containerClass()"
				[style]="containerStyle()"
			>
				<ng-container [ngTemplateOutlet]="content" />
			</div>
		}

		<ng-template #content>
			<ng-content />
		</ng-template>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [NgTemplateOutlet],
	host: { 'data-ngts-html-content': '' },
})
export class NgtsHTMLContent extends NgtHTML {
	/**
	 * Content positioning and behavior options.
	 * Aliased as `htmlContent` for use with the `[htmlContent]` attribute selector.
	 */
	options = input(defaultHtmlContentOptions, {
		transform: mergeInputs(defaultHtmlContentOptions),
		alias: 'htmlContent',
	});

	/**
	 * Emits when occlusion state changes.
	 * - `true` - HTML is occluded (hidden behind objects)
	 * - `false` - HTML is visible
	 *
	 * If no listener is attached, visibility is handled automatically
	 * via `display: none/block`. When subscribed, you control visibility.
	 */
	occluded = output<boolean>();

	/** Reference to outer transform container (transform mode only) */
	transformOuterRef = viewChild<ElementRef<HTMLDivElement>>('transformOuter');
	/** Reference to inner transform container (transform mode only) */
	transformInnerRef = viewChild<ElementRef<HTMLDivElement>>('transformInner');
	/** Reference to the content container div */
	containerRef = viewChild<ElementRef<HTMLDivElement>>('container');

	protected html = inject(NgtsHTMLImpl);
	private host = inject<ElementRef<HTMLElement>>(ElementRef);
	private store = injectStore();
	protected size = this.store.size;

	private parent = pick(this.options, 'parent');
	private zIndexRange = pick(this.options, 'zIndexRange');
	private calculatePosition = pick(this.options, 'calculatePosition');
	private prepend = pick(this.options, 'prepend');
	private distanceFactor = pick(this.options, 'distanceFactor');
	private htmlScale = pick(this.html.options, 'scale');
	protected center = pick(this.options, 'center');
	protected fullscreen = pick(this.options, 'fullscreen');
	protected pointerEvents = pick(this.options, 'pointerEvents');
	protected containerClass = pick(this.options, 'containerClass');
	protected containerStyle = pick(this.options, 'containerStyle');

	private target = computed(() => {
		const parent = resolveRef(this.parent());
		if (parent) return parent;
		return (this.store.events.connected?.() || this.store.gl().domElement.parentNode) as HTMLElement | null;
	});

	constructor() {
		super();

		const renderer = inject(Renderer2);
		const releaseFramePreparation = acquireHTMLFramePreparation(this.store);
		inject(DestroyRef).onDestroy(releaseFramePreparation);

		let isMeshSizeSet = false;

		effect((onCleanup) => {
			const [occlude, canvasEl, zIndexRange] = [
				this.html.occlude(),
				this.store.gl().domElement,
				this.zIndexRange(),
			];

			if (occlude !== 'blending') return;
			const lease = acquireCanvasStyleLease(canvasEl, Math.floor(zIndexRange[0] / 2));
			onCleanup(() => lease.release());
		});

		effect((onCleanup) => {
			const [transform, target, hostEl, prepend] = [
				this.html.transform(),
				this.target(),
				this.host.nativeElement,
				this.prepend(),
			];
			const [calculatePosition, group, size, camera] = untracked(
				() =>
					[
						this.calculatePosition(),
						this.html.groupRef().nativeElement,
						this.store.size(),
						this.store.camera(),
					] as const,
			);

			group.updateWorldMatrix(true, false);
			camera.updateWorldMatrix(true, false);
			renderer.setStyle(hostEl, 'position', 'absolute');
			renderer.setStyle(hostEl, 'top', '0');
			renderer.setStyle(hostEl, 'left', '0');

			if (transform) {
				renderer.setStyle(hostEl, 'pointer-events', 'none');
				renderer.setStyle(hostEl, 'overflow', 'hidden');
				renderer.removeStyle(hostEl, 'transform');
				renderer.removeStyle(hostEl, 'transform-origin');
			} else {
				const vec = calculatePosition(group, camera, size);
				renderer.setStyle(hostEl, 'transform', `translate3d(${vec[0]}px,${vec[1]}px,0)`);
				renderer.setStyle(hostEl, 'transform-origin', '0 0');
				renderer.removeStyle(hostEl, 'pointer-events');
				renderer.removeStyle(hostEl, 'overflow');
			}

			if (!target) return;
			if (prepend) target.prepend(hostEl);
			else target.appendChild(hostEl);

			onCleanup(() => {
				if (hostEl.parentNode) hostEl.parentNode.removeChild(hostEl);
			});
		});

		effect(() => {
			void [
				this.distanceFactor(),
				this.html.transform(),
				this.htmlScale(),
				this.store.size(),
				this.store.viewport.factor(),
			];
			isMeshSizeSet = false;
		});

		effect((onCleanup) => {
			const [observedElement, occlude, isRaycastOcclusion] = [
				this.containerRef()?.nativeElement,
				this.html.occlude(),
				this.html.isRaycastOcclusion(),
			];
			isMeshSizeSet = false;
			if (!observedElement || !occlude || isRaycastOcclusion || typeof ResizeObserver === 'undefined') return;

			const resizeObserver = new ResizeObserver(() => {
				isMeshSizeSet = false;
				this.store.snapshot.invalidate();
			});
			resizeObserver.observe(observedElement);
			onCleanup(() => resizeObserver.disconnect());
		});

		let visible = true;
		let oldPosition = [Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY];
		const spriteMatrix = new THREE.Matrix4();
		const cameraWorldPosition = new THREE.Vector3();

		beforeRender((renderState) => {
			const [
				hostEl,
				transformOuterEl,
				transformInnerEl,
				group,
				occlusionMesh,
				occlusionGeometry,
				isRaycastOcclusion,
				{ camera, size, viewport, raycaster, scene },
				{ calculatePosition, eps, zIndexRange, logarithmicDepth, sprite, distanceFactor },
				{ transform, occlude, scale },
			] = [
				this.host.nativeElement,
				this.transformOuterRef()?.nativeElement,
				this.transformInnerRef()?.nativeElement,
				this.html.groupRef().nativeElement,
				this.html.occlusionMeshRef()?.nativeElement,
				this.html.occlusionGeometryRef()?.nativeElement,
				this.html.isRaycastOcclusion(),
				renderState,
				this.options(),
				this.html.options(),
			];

			if (group) {
				// Check if any ancestor is hidden (e.g., by LOD)
				let ancestorVisible = true;
				let ancestor: THREE.Object3D | null = group;
				while (ancestor) {
					if (!ancestor.visible) {
						ancestorVisible = false;
						break;
					}
					ancestor = ancestor.parent;
				}

				const previouslyVisible = visible;
				if (!ancestorVisible) {
					visible = false;
				} else {
					const isBehindCamera = isObjectBehindCamera(group, camera);
					let raytraceTarget: THREE.Object3D[] | undefined;

					if (isRaycastOcclusion) {
						if (Array.isArray(occlude)) {
							raytraceTarget = occlude
								.map((item) => resolveRef(item))
								.filter((item): item is THREE.Object3D => !!item);
						} else if (occlude !== 'blending') {
							raytraceTarget = [scene];
						}
					}

					visible =
						!isBehindCamera &&
						(!raytraceTarget || isObjectVisible(group, camera, raycaster, raytraceTarget));
				}

				if (previouslyVisible !== visible) {
					if (this.occluded['listeners']) this.occluded.emit(!visible);
					else setStyleIfChanged(renderer, hostEl, 'display', visible ? 'block' : 'none');
				}

				if (!ancestorVisible) return;

				const halfRange = Math.floor(zIndexRange[0] / 2);
				const zRange = occlude
					? isRaycastOcclusion
						? [zIndexRange[0], halfRange]
						: [halfRange - 1, 0]
					: zIndexRange;
				const distance = objectDistance(group, camera);
				const zIndex = objectZIndex(group, camera, zRange, logarithmicDepth, distance);
				setStyleIfChanged(renderer, hostEl, 'z-index', `${zIndex}`);

				if (transform) {
					const [widthHalf, heightHalf] = [size.width / 2, size.height / 2];
					const fov = camera.projectionMatrix.elements[5] * heightHalf;
					const { isOrthographicCamera, top, left, bottom, right } = camera as THREE.OrthographicCamera;
					const cameraMatrix = getCameraCSSMatrix(camera.matrixWorldInverse);
					const cameraTransform = isOrthographicCamera
						? `scale(${fov})translate(${epsilon(-(right + left) / 2)}px,${epsilon((top + bottom) / 2)}px)`
						: `translateZ(${fov}px)`;
					let matrix = group.matrixWorld;
					if (sprite) {
						matrix = spriteMatrix
							.copy(camera.matrixWorldInverse)
							.transpose()
							.copyPosition(matrix)
							.scale(group.scale);
						matrix.elements[3] = matrix.elements[7] = matrix.elements[11] = 0;
						matrix.elements[15] = 1;
					}

					setStyleIfChanged(renderer, hostEl, 'width', size.width + 'px');
					setStyleIfChanged(renderer, hostEl, 'height', size.height + 'px');
					setStyleIfChanged(renderer, hostEl, 'perspective', isOrthographicCamera ? '' : `${fov}px`);

					if (transformOuterEl && transformInnerEl) {
						setStyleIfChanged(
							renderer,
							transformOuterEl,
							'transform',
							`${cameraTransform}${cameraMatrix}translate(${widthHalf}px,${heightHalf}px)`,
						);
						setStyleIfChanged(
							renderer,
							transformInnerEl,
							'transform',
							getObjectCSSMatrix(matrix, 1 / ((distanceFactor || 10) / 400)),
						);
					}
				} else {
					const vec = calculatePosition(group, camera, size);
					const positionChanged =
						Math.abs(oldPosition[0] - vec[0]) > eps || Math.abs(oldPosition[1] - vec[1]) > eps;
					if (positionChanged) oldPosition = [vec[0], vec[1]];
					const htmlScale =
						distanceFactor === undefined ? 1 : objectScale(group, camera, distance) * distanceFactor;
					setStyleIfChanged(
						renderer,
						hostEl,
						'transform',
						`translate3d(${oldPosition[0]}px,${oldPosition[1]}px,0) scale(${htmlScale})`,
					);
				}
			}

			if (!isRaycastOcclusion && occlusionMesh && !isMeshSizeSet) {
				if (transform) {
					if (transformOuterEl) {
						const el = this.containerRef()?.nativeElement;

						if (el?.clientWidth && el?.clientHeight) {
							const { isOrthographicCamera } = camera as THREE.OrthographicCamera;

							// A missing fallback geometry means the caller projected a custom one.
							if (isOrthographicCamera || !occlusionGeometry) {
								if (scale) {
									if (!Array.isArray(scale)) {
										occlusionMesh.scale.setScalar(1 / (scale as number));
									} else if (is.three<THREE.Vector3>(scale, 'isVector3')) {
										occlusionMesh.scale.set(1 / scale.x, 1 / scale.y, 1 / scale.z);
									} else {
										occlusionMesh.scale.set(1 / scale[0], 1 / scale[1], 1 / scale[2]);
									}
								}
							} else {
								const ratio = (distanceFactor || 10) / 400;
								const w = el.clientWidth * ratio;
								const h = el.clientHeight * ratio;

								occlusionMesh.scale.set(w, h, 1);
							}

							isMeshSizeSet = true;
						}
					}
				} else {
					const ele = hostEl.children[0];

					if (ele?.clientWidth && ele?.clientHeight) {
						const ratio = 1 / viewport.factor;
						const w = ele.clientWidth * ratio;
						const h = ele.clientHeight * ratio;

						occlusionMesh.scale.set(w, h, 1);

						isMeshSizeSet = true;
					}

					occlusionMesh.lookAt(camera.getWorldPosition(cameraWorldPosition));
				}
			}
		});
	}
}
