import { NgTemplateOutlet } from '@angular/common';
import {
	afterNextRender,
	ChangeDetectionStrategy,
	Component,
	computed,
	ElementRef,
	inject,
	input,
	output,
	Renderer2,
	untracked,
	viewChild,
} from '@angular/core';
import { injectBeforeRender, NgtHTML, pick, resolveRef } from 'angular-three';
import { injectAutoEffect } from 'ngxtension/auto-effect';
import { mergeInputs } from 'ngxtension/inject-inputs';
import { Object3D, OrthographicCamera, Vector3 } from 'three';
import { NgtsHTML } from './html';
import {
	CalculatePosition,
	defaultCalculatePosition,
	epsilon,
	getCameraCSSMatrix,
	getObjectCSSMatrix,
	isObjectBehindCamera,
	isObjectVisible,
	objectScale,
	objectZIndex,
} from './utils';

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

export interface NgtsHTMLContentOptions {
	eps: number;
	zIndexRange: [number, number];
	center: boolean;
	prepend: boolean;
	fullscreen: boolean;
	containerClass: string;
	containerStyle: Partial<CSSStyleDeclaration>;
	pointerEvents: PointerEventsProperties;
	calculatePosition: CalculatePosition;
	sprite: boolean;
	distanceFactor?: number;
	parent?: HTMLElement | ElementRef<HTMLElement>;
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

@Component({
	selector: '[ngtsHTMLContent]',
	standalone: true,
	template: `
		@if (html.transform()) {
			<div
				#transformOuter
				style="position: absolute; top: 0; left: 0; transform-style: preserve-3d; pointer-events: none;"
				[style.width.px]="size().width"
				[style.height.px]="size().height"
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
				[style.top]="fullscreen() ? -size().height / 2 + 'px' : 'unset'"
				[style.left]="fullscreen() ? -size().width / 2 + 'px' : 'unset'"
				[style.width]="fullscreen() ? size().width : 'unset'"
				[style.height]="fullscreen() ? size().height : 'unset'"
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
	options = input(defaultHtmlContentOptions, {
		transform: mergeInputs(defaultHtmlContentOptions),
		alias: 'ngtsHTMLContent',
	});
	occluded = output<boolean>();

	html = inject(NgtsHTML);

	transformOuterRef = viewChild<ElementRef<HTMLDivElement>>('transformOuter');
	transformInnerRef = viewChild<ElementRef<HTMLDivElement>>('transformInner');
	containerRef = viewChild<ElementRef<HTMLDivElement>>('container');

	private gl = this.store.select('gl');
	private events = this.store.select('events');
	private camera = this.store.select('camera');
	private scene = this.store.select('scene');
	size = this.store.select('size');

	private parent = pick(this.options, 'parent');
	private zIndexRange = pick(this.options, 'zIndexRange');
	private calculatePosition = pick(this.options, 'calculatePosition');
	private prepend = pick(this.options, 'prepend');
	center = pick(this.options, 'center');
	fullscreen = pick(this.options, 'fullscreen');
	pointerEvents = pick(this.options, 'pointerEvents');
	containerClass = pick(this.options, 'containerClass');
	containerStyle = pick(this.options, 'containerStyle');

	private target = computed(() => {
		const parent = resolveRef(this.parent());
		if (parent) return parent;
		return (this.events().connected || this.gl().domElement.parentNode) as HTMLElement;
	});

	constructor() {
		super();

		const autoEffect = injectAutoEffect();
		const renderer = inject(Renderer2);

		let isMeshSizeSet = false;

		afterNextRender(() => {
			autoEffect(() => {
				const [occlude, canvasEl, zIndexRange] = [
					this.html.occlude(),
					untracked(this.gl).domElement,
					untracked(this.zIndexRange),
				];

				if (occlude && occlude === 'blending') {
					renderer.setStyle(canvasEl, 'z-index', `${Math.floor(zIndexRange[0] / 2)}`);
					renderer.setStyle(canvasEl, 'position', 'absolute');
					renderer.setStyle(canvasEl, 'pointer-events', 'none');
				} else {
					renderer.removeStyle(canvasEl, 'z-index');
					renderer.removeStyle(canvasEl, 'position');
					renderer.removeStyle(canvasEl, 'pointer-events');
				}
			});

			autoEffect(() => {
				const [transform, target, hostEl, prepend, scene, calculatePosition, group, size, camera] = [
					this.html.transform(),
					this.target(),
					this.host.nativeElement,
					untracked(this.prepend),
					untracked(this.scene),
					untracked(this.calculatePosition),
					untracked(this.html.groupRef).nativeElement,
					untracked(this.size),
					untracked(this.camera),
				];

				scene.updateMatrixWorld();
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

				if (prepend) target.prepend(hostEl);
				else target.appendChild(hostEl);

				return () => {
					if (target) target.removeChild(hostEl);
				};
			});

			autoEffect(() => {
				this.options();
				this.html.options();
				isMeshSizeSet = false;
			});
		});

		let visible = true;
		let oldZoom = 0;
		let oldPosition = [0, 0];

		injectBeforeRender(({ camera: rootCamera }) => {
			const [
				hostEl,
				transformOuterEl,
				transformInnerEl,
				group,
				occlusionMesh,
				occlusionGeometry,
				isRaycastOcclusion,
				{ camera, size, viewport, raycaster, scene },
				{ calculatePosition, eps, zIndexRange, sprite, distanceFactor },
				{ transform, occlude, scale },
			] = [
				this.host.nativeElement,
				this.transformOuterRef()?.nativeElement,
				this.transformInnerRef()?.nativeElement,
				this.html.groupRef().nativeElement,
				this.html.occlusionMeshRef()?.nativeElement,
				this.html.occlusionGeometryRef()?.nativeElement,
				this.html.isRaycastOcclusion(),
				this.store.snapshot,
				this.options(),
				this.html.options(),
			];

			if (group) {
				camera.updateMatrixWorld();
				group.updateWorldMatrix(true, false);
				const vec = transform ? oldPosition : calculatePosition(group, camera, size);

				if (
					transform ||
					Math.abs(oldZoom - camera.zoom) > eps ||
					Math.abs(oldPosition[0] - vec[0]) > eps ||
					Math.abs(oldPosition[1] - vec[1]) > eps
				) {
					const isBehindCamera = isObjectBehindCamera(group, camera);
					let raytraceTarget: null | undefined | boolean | Object3D[] = false;

					if (isRaycastOcclusion) {
						if (Array.isArray(occlude)) {
							raytraceTarget = occlude.map((item) => resolveRef(item)) as Object3D[];
						} else if (occlude !== 'blending') {
							raytraceTarget = [scene];
						}
					}

					const previouslyVisible = visible;
					if (raytraceTarget) {
						const isVisible = isObjectVisible(group, camera, raycaster, raytraceTarget);
						visible = isVisible && !isBehindCamera;
					} else {
						visible = !isBehindCamera;
					}

					if (previouslyVisible !== visible) {
						if (this.occluded['listeners']) this.occluded.emit(!visible);
						else renderer.setStyle(hostEl, 'display', visible ? 'block' : 'none');
					}

					const halfRange = Math.floor(zIndexRange[0] / 2);
					const zRange = occlude
						? isRaycastOcclusion //
							? [zIndexRange[0], halfRange]
							: [halfRange - 1, 0]
						: zIndexRange;

					renderer.setStyle(hostEl, 'z-index', `${objectZIndex(group, camera, zRange)}`);

					if (transform) {
						const [widthHalf, heightHalf] = [size.width / 2, size.height / 2];
						const fov = camera.projectionMatrix.elements[5] * heightHalf;
						const { isOrthographicCamera, top, left, bottom, right } = camera as OrthographicCamera;
						const cameraMatrix = getCameraCSSMatrix(camera.matrixWorldInverse);
						const cameraTransform = isOrthographicCamera
							? `scale(${fov})translate(${epsilon(-(right + left) / 2)}px,${epsilon((top + bottom) / 2)}px)`
							: `translateZ(${fov}px)`;
						let matrix = group.matrixWorld;
						if (sprite) {
							matrix = camera.matrixWorldInverse.clone().transpose().copyPosition(matrix).scale(group.scale);
							matrix.elements[3] = matrix.elements[7] = matrix.elements[11] = 0;
							matrix.elements[15] = 1;
						}

						renderer.setStyle(hostEl, 'width', size.width + 'px');
						renderer.setStyle(hostEl, 'height', size.height + 'px');
						renderer.setStyle(hostEl, 'perspective', isOrthographicCamera ? '' : `${fov}px`);

						if (transformOuterEl && transformInnerEl) {
							renderer.setStyle(
								transformOuterEl,
								'transform',
								`${cameraTransform}${cameraMatrix}translate(${widthHalf}px,${heightHalf}px)`,
							);
							renderer.setStyle(
								transformInnerEl,
								'transform',
								getObjectCSSMatrix(matrix, 1 / ((distanceFactor || 10) / 400)),
							);
						}
					} else {
						const scale = distanceFactor === undefined ? 1 : objectScale(group, camera) * distanceFactor;
						renderer.setStyle(hostEl, 'transform', `translate3d(${vec[0]}px,${vec[1]}px,0) scale(${scale})`);
					}
					oldPosition = vec;
					oldZoom = camera.zoom;
				}
			}

			if (!isRaycastOcclusion && occlusionMesh && !isMeshSizeSet) {
				if (transform) {
					if (transformOuterEl) {
						const el = transformOuterEl.children[0];

						if (el?.clientWidth && el?.clientHeight) {
							const { isOrthographicCamera } = camera as OrthographicCamera;

							if (isOrthographicCamera || occlusionGeometry) {
								if (scale) {
									if (!Array.isArray(scale)) {
										occlusionMesh.scale.setScalar(1 / (scale as number));
									} else if (scale instanceof Vector3) {
										occlusionMesh.scale.copy(scale.clone().divideScalar(1));
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

					occlusionMesh.lookAt(rootCamera.position);
				}
			}
		});
	}
}
