import { DOCUMENT, NgTemplateOutlet } from '@angular/common';
import {
	Component,
	ElementRef,
	EmbeddedViewRef,
	TemplateRef,
	ViewChild,
	ViewContainerRef,
	computed,
	effect,
	inject,
	untracked,
} from '@angular/core';
import { HTML, injectBeforeRender, injectNgtStore, is, safeDetectChanges } from 'angular-three';
import * as THREE from 'three';
import { injectNgtsHtmlInputs } from './html';

const v1 = new THREE.Vector3();
const v2 = new THREE.Vector3();
const v3 = new THREE.Vector3();

export function defaultCalculatePosition(
	el: THREE.Object3D,
	camera: THREE.Camera,
	size: { width: number; height: number },
) {
	const objectPos = v1.setFromMatrixPosition(el.matrixWorld);
	objectPos.project(camera);
	const widthHalf = size.width / 2;
	const heightHalf = size.height / 2;
	return [objectPos.x * widthHalf + widthHalf, -(objectPos.y * heightHalf) + heightHalf];
}

function isObjectBehindCamera(el: THREE.Object3D, camera: THREE.Camera) {
	const objectPos = v1.setFromMatrixPosition(el.matrixWorld);
	const cameraPos = v2.setFromMatrixPosition(camera.matrixWorld);
	const deltaCamObj = objectPos.sub(cameraPos);
	const camDir = camera.getWorldDirection(v3);
	return deltaCamObj.angleTo(camDir) > Math.PI / 2;
}

function isObjectVisible(
	el: THREE.Object3D,
	camera: THREE.Camera,
	raycaster: THREE.Raycaster,
	occlude: THREE.Object3D[],
) {
	const elPos = v1.setFromMatrixPosition(el.matrixWorld);
	const screenPos = elPos.clone();
	screenPos.project(camera);
	raycaster.setFromCamera(screenPos as any, camera);
	const intersects = raycaster.intersectObjects(occlude, true);
	if (intersects.length) {
		const intersectionDistance = intersects[0].distance;
		const pointDistance = elPos.distanceTo(raycaster.ray.origin);
		return pointDistance < intersectionDistance;
	}
	return true;
}

function objectScale(el: THREE.Object3D, camera: THREE.Camera) {
	if (camera instanceof THREE.OrthographicCamera) {
		return camera.zoom;
	} else if (camera instanceof THREE.PerspectiveCamera) {
		const objectPos = v1.setFromMatrixPosition(el.matrixWorld);
		const cameraPos = v2.setFromMatrixPosition(camera.matrixWorld);
		const vFOV = (camera.fov * Math.PI) / 180;
		const dist = objectPos.distanceTo(cameraPos);
		const scaleFOV = 2 * Math.tan(vFOV / 2) * dist;
		return 1 / scaleFOV;
	} else {
		return 1;
	}
}

function objectZIndex(el: THREE.Object3D, camera: THREE.Camera, zIndexRange: Array<number>) {
	if (camera instanceof THREE.PerspectiveCamera || camera instanceof THREE.OrthographicCamera) {
		const objectPos = v1.setFromMatrixPosition(el.matrixWorld);
		const cameraPos = v2.setFromMatrixPosition(camera.matrixWorld);
		const dist = objectPos.distanceTo(cameraPos);
		const A = (zIndexRange[1] - zIndexRange[0]) / (camera.far - camera.near);
		const B = zIndexRange[1] - A * camera.far;
		return Math.round(A * dist + B);
	}
	return undefined;
}

const epsilon = (value: number) => (Math.abs(value) < 1e-10 ? 0 : value);

function getCSSMatrix(matrix: THREE.Matrix4, multipliers: number[], prepend = '') {
	let matrix3d = 'matrix3d(';
	for (let i = 0; i !== 16; i++) {
		matrix3d += epsilon(multipliers[i] * matrix.elements[i]) + (i !== 15 ? ',' : ')');
	}
	return prepend + matrix3d;
}

const getCameraCSSMatrix = ((multipliers: number[]) => {
	return (matrix: THREE.Matrix4) => getCSSMatrix(matrix, multipliers);
})([1, -1, 1, 1, 1, -1, 1, 1, 1, -1, 1, 1, 1, -1, 1, 1]);

const getObjectCSSMatrix = ((scaleMultipliers: (n: number) => number[]) => {
	return (matrix: THREE.Matrix4, factor: number) =>
		getCSSMatrix(matrix, scaleMultipliers(factor), 'translate(-50%,-50%)');
})((f: number) => [1 / f, 1 / f, 1 / f, 1, -1 / f, -1 / f, -1 / f, -1, 1 / f, 1 / f, 1 / f, 1, 1, 1, 1, 1]);

@Component({
	selector: 'ngts-html-wrapper',
	standalone: true,
	template: `
		<ng-template #transformTemplate>
			<div #transformedOuterDiv [style]="styles()">
				<div #transformedInnerDiv [style]="transformInnerStyles()">
					<ng-container *ngTemplateOutlet="renderTemplate; context: { styles: htmlInputs.style }" />
				</div>
			</div>
		</ng-template>

		<ng-template #renderTemplate let-renderedStyles="styles">
			<div #renderedDiv [class]="htmlInputs.renderedDivClass()" [style]="renderedStyles()">
				<ng-container #renderAnchor />
			</div>
		</ng-template>
	`,
	imports: [NgTemplateOutlet],
})
export class NgtsHtmlWrapper {
	static [HTML] = true;

	htmlInputs = injectNgtsHtmlInputs();

	@ViewChild('transformTemplate', { static: true }) transformTemplate!: TemplateRef<unknown>;
	@ViewChild('renderTemplate', { static: true }) renderTemplate!: TemplateRef<unknown>;

	@ViewChild('transformedOuterDiv') outerDiv?: ElementRef<HTMLElement>;
	@ViewChild('transformedInnerDiv') innerDiv?: ElementRef<HTMLElement>;
	@ViewChild('renderAnchor', { read: ViewContainerRef }) renderAnchor?: ViewContainerRef;

	private store = injectNgtStore();
	private gl = this.store.select('gl');
	private connected = this.store.select('events', 'connected', { equal: Object.is });
	private viewport = this.store.select('viewport');
	private scene = this.store.select('scene');
	private camera = this.store.select('camera');
	private size = this.store.select('size');
	private raycaster = this.store.select('raycaster');

	private isMeshSizeSet = false;

	private document = inject(DOCUMENT);
	private vcr = inject(ViewContainerRef);

	private portalElement = computed(() => {
		const portal = this.htmlInputs.portal();
		if (!portal) return null;
		return is.ref(portal) ? portal.nativeElement : portal;
	});

	private element = computed(() => this.document.createElement(this.htmlInputs.as()) as HTMLElement);
	private target = computed(() => {
		const portalElement = this.portalElement();
		if (portalElement) return portalElement;
		const connected = this.connected();
		if (connected) return connected as HTMLElement;
		return this.gl().domElement.parentElement!;
	});

	styles = computed(() => {
		const [style, center, transform, size, fullscreen] = [
			this.htmlInputs.style(),
			this.htmlInputs.center(),
			this.htmlInputs.transform(),
			this.size(),
			this.htmlInputs.fullscreen(),
		];

		if (transform) {
			return {
				position: 'absolute',
				top: 0,
				left: 0,
				width: size.width,
				height: size.height,
				transformStyle: 'preserve-3d',
				pointerEvents: 'none',
			};
		}

		return {
			position: 'absolute',
			transform: center ? 'translate3d(-50%,-50%,0)' : 'none',
			...(fullscreen && {
				top: -size.height / 2,
				left: -size.width / 2,
				width: size.width,
				height: size.height,
			}),
			...(style || {}),
		};
	});
	transformInnerStyles = computed(() => ({ position: 'absolute', pointerEvents: this.htmlInputs.pointerEvents() }));

	constructor() {
		this.setCanvasElementStyle();
		this.appendElement();
		this.setWrapperClass();
		this.render();
		this.beforeRender();
	}

	private setCanvasElementStyle() {
		effect(() => {
			const el = untracked(this.gl).domElement!;
			const occlude = this.htmlInputs.occlude();
			if (occlude && occlude === 'blending') {
				el.style.zIndex = `${Math.floor(untracked(this.htmlInputs.zIndexRange)[0] / 2)}`;
				el.style.position = 'absolute';
				el.style.pointerEvents = 'none';
			} else {
				el.style.zIndex = null!;
				el.style.position = null!;
				el.style.pointerEvents = null!;
			}
		});
	}

	private appendElement() {
		effect((onCleanup) => {
			const [group, element] = [this.htmlInputs.groupRef.nativeElement, this.element()];
			if (group && element) {
				const [target, transform, scene, camera, size, calculatePosition, prepend] = [
					this.target(),
					this.htmlInputs.transform(),
					untracked(this.scene),
					untracked(this.camera),
					untracked(this.size),
					untracked(this.htmlInputs.calculatePosition),
					untracked(this.htmlInputs.prepend),
				];
				scene.updateMatrixWorld();
				if (transform) {
					element.style.cssText = `position:absolute;top:0;left:0;pointer-events:none;overflow:hidden;`;
				} else {
					const vec = calculatePosition(group, camera, size);
					element.style.cssText = `position:absolute;top:0;left:0;transform:translate3d(${vec[0]}px,${vec[1]}px,0);transform-origin:0 0;`;
				}

				if (target) {
					if (prepend) target.prepend(element);
					else target.appendChild(element);
				}

				onCleanup(() => {
					if (target) target.removeChild(element);
					this.vcr.clear();
				});
			}
		});
	}

	private setWrapperClass() {
		effect(() => {
			const [element, wrapperClass] = [this.element(), this.htmlInputs.wrapperClass()];
			if (element && wrapperClass) {
				element.className = wrapperClass;
			}
		});
	}

	private render() {
		effect((onCleanup) => {
			const [{ transform }, element, content] = [
				this.htmlInputs.state(),
				this.element(),
				this.htmlInputs.content(),
			];

			if (element) {
				this.isMeshSizeSet = false;
				const params: Parameters<ViewContainerRef['createEmbeddedView']> = transform
					? [this.transformTemplate, {}]
					: [this.renderTemplate, { styles: this.styles }];

				const ref = this.vcr.createEmbeddedView(...params);
				if (ref.rootNodes?.[0]) {
					if (element.hasChildNodes()) {
						element.replaceChildren(...ref.rootNodes);
					} else {
						element.append(...ref.rootNodes);
					}
				}
				safeDetectChanges(ref);

				let contentRef: EmbeddedViewRef<unknown>;
				let contentParent: HTMLElement;
				/**
				 * NOTE: utilizing rAF here so that renderAnchor (ViewContainerRef) has a chance to be resolved
				 * TODO: Another approach is to call render() in ngOnInit and pass in an injector to the effect
				 */
				const rAF = requestAnimationFrame(() => {
					if (content && this.renderAnchor) {
						contentRef = this.renderAnchor.createEmbeddedView(content);
						contentParent = ref.rootNodes[0].lastElementChild || ref.rootNodes[0];
						while (contentParent && contentParent.lastElementChild) {
							contentParent = contentParent.lastElementChild as HTMLElement;
						}
						if (contentRef.rootNodes?.[0]) {
							if (contentParent.hasChildNodes()) {
								contentParent.replaceChildren(...contentRef.rootNodes);
							} else {
								contentParent.append(...contentRef.rootNodes);
							}
						}
						safeDetectChanges(contentRef);
					}
				});

				onCleanup(() => {
					cancelAnimationFrame(rAF);

					if (contentRef && contentParent) {
						contentRef.rootNodes.forEach((node) => {
							if (contentParent.hasChildNodes()) {
								contentParent.removeChild(node);
							}
							node.remove();
						});

						contentRef.destroy();
					}

					ref.rootNodes.forEach((node) => {
						if (element.hasChildNodes()) {
							element.removeChild(node);
						}
						node.remove();
					});
					ref.destroy();
					this.renderAnchor?.clear();
					this.vcr.clear();
				});
			}
		});
	}

	private beforeRender() {
		let oldPosition = [0, 0];
		let oldZoom = 0;
		let visible = true;
		injectBeforeRender((gl) => {
			const [
				group,
				camera,
				transform,
				calculatePosition,
				size,
				eps,
				isRayCastOcclusion,
				occlude,
				scene,
				raycaster,
				element,
				zIndexRange,
				sprite,
				distanceFactor,
				occlusionMeshRef,
				geometry,
				viewport,
				scale,
			] = [
				this.htmlInputs.groupRef.nativeElement,
				this.camera(),
				this.htmlInputs.transform(),
				this.htmlInputs.calculatePosition(),
				this.size(),
				this.htmlInputs.eps(),
				this.htmlInputs.isRayCastOcclusion(),
				this.htmlInputs.occlude(),
				this.scene(),
				this.raycaster(),
				this.element(),
				this.htmlInputs.zIndexRange(),
				this.htmlInputs.sprite(),
				this.htmlInputs.distanceFactor(),
				this.htmlInputs.occlusionMeshRef.nativeElement,
				this.htmlInputs.geometry(),
				this.viewport(),
				this.htmlInputs.scale(),
			];
			if (group && element) {
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
					let raytraceTarget: null | undefined | boolean | THREE.Object3D[] = false;

					if (isRayCastOcclusion) {
						if (occlude !== 'blending') {
							raytraceTarget = [scene];
						} else if (Array.isArray(occlude)) {
							raytraceTarget = occlude.map((item) => (is.ref(item) ? item.nativeElement : item));
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
						if (this.htmlInputs.occluded.observed) {
							this.htmlInputs.occluded.emit(!visible);
						} else {
							element.style.display = visible ? 'block' : 'none';
						}
					}

					const halfRange = Math.floor(zIndexRange[0] / 2);
					const zRange = occlude
						? isRayCastOcclusion //
							? [zIndexRange[0], halfRange]
							: [halfRange - 1, 0]
						: zIndexRange;

					element.style.zIndex = `${objectZIndex(group, camera, zRange)}`;

					if (transform) {
						const [widthHalf, heightHalf] = [size.width / 2, size.height / 2];
						const fov = camera.projectionMatrix.elements[5] * heightHalf;
						const { isOrthographicCamera, top, left, bottom, right } = camera as THREE.OrthographicCamera;
						const cameraMatrix = getCameraCSSMatrix(camera.matrixWorldInverse);
						const cameraTransform = isOrthographicCamera
							? `scale(${fov})translate(${epsilon(-(right + left) / 2)}px,${epsilon(
									(top + bottom) / 2,
							  )}px)`
							: `translateZ(${fov}px)`;
						let matrix = group.matrixWorld;
						if (sprite) {
							matrix = camera.matrixWorldInverse
								.clone()
								.transpose()
								.copyPosition(matrix)
								.scale(group.scale);
							matrix.elements[3] = matrix.elements[7] = matrix.elements[11] = 0;
							matrix.elements[15] = 1;
						}
						element.style.width = size.width + 'px';
						element.style.height = size.height + 'px';
						element.style.perspective = isOrthographicCamera ? '' : `${fov}px`;
						if (this.outerDiv?.nativeElement && this.innerDiv?.nativeElement) {
							this.outerDiv.nativeElement.style.width = size.width + 'px';
							this.outerDiv.nativeElement.style.height = size.height + 'px';
							this.outerDiv.nativeElement.style.transform = `${cameraTransform}${cameraMatrix}translate(${widthHalf}px,${heightHalf}px)`;
							this.innerDiv.nativeElement.style.transform = getObjectCSSMatrix(
								matrix,
								1 / ((distanceFactor || 10) / 400),
							);
						}
					} else {
						const scale = distanceFactor === undefined ? 1 : objectScale(group, camera) * distanceFactor;
						element.style.transform = `translate3d(${vec[0]}px,${vec[1]}px,0) scale(${scale})`;
					}
					oldPosition = vec;
					oldZoom = camera.zoom;
				}
			}

			if (!isRayCastOcclusion && occlusionMeshRef && !this.isMeshSizeSet) {
				if (transform) {
					if (this.outerDiv?.nativeElement) {
						const el = this.outerDiv.nativeElement.children[0];

						if (el?.clientWidth && el?.clientHeight) {
							const { isOrthographicCamera } = camera as THREE.OrthographicCamera;

							if (isOrthographicCamera || geometry) {
								if (scale !== 1) {
									if (!Array.isArray(scale)) {
										occlusionMeshRef.scale.setScalar(1 / (scale as number));
									} else if (scale instanceof THREE.Vector3) {
										occlusionMeshRef.scale.copy(scale.clone().divideScalar(1));
									} else {
										occlusionMeshRef.scale.set(1 / scale[0], 1 / scale[1], 1 / scale[2]);
									}
								}
							} else {
								const ratio = (distanceFactor || 10) / 400;
								const w = el.clientWidth * ratio;
								const h = el.clientHeight * ratio;

								occlusionMeshRef.scale.set(w, h, 1);
							}

							this.isMeshSizeSet = true;
						}
					}
				} else {
					const ele = element.children[0];

					if (ele?.clientWidth && ele?.clientHeight) {
						const ratio = 1 / viewport.factor;
						const w = ele.clientWidth * ratio;
						const h = ele.clientHeight * ratio;

						occlusionMeshRef.scale.set(w, h, 1);

						this.isMeshSizeSet = true;
					}

					occlusionMeshRef.lookAt(gl.camera.position);
				}
			}
		});
	}
}
