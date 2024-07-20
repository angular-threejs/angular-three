// import {
// 	afterNextRender,
// 	ChangeDetectionStrategy,
// 	Component,
// 	computed,
// 	contentChild,
// 	CUSTOM_ELEMENTS_SCHEMA,
// 	ElementRef,
// 	inject,
// 	input,
// 	output,
// 	untracked,
// 	viewChild,
// } from '@angular/core';
// import { extend, injectBeforeRender, is, NgtHTML, pick, resolveRef } from 'angular-three';
// import { injectAutoEffect } from 'ngxtension/auto-effect';
// import { mergeInputs } from 'ngxtension/inject-inputs';
// import {
// 	Camera,
// 	DoubleSide,
// 	Group,
// 	Matrix4,
// 	Mesh,
// 	Object3D,
// 	OrthographicCamera,
// 	PlaneGeometry,
// 	Raycaster,
// 	ShaderMaterial,
// 	Vector2,
// 	Vector3,
// } from 'three';
//
// const v1 = new Vector3();
// const v2 = new Vector3();
// const v3 = new Vector3();
// const v4 = new Vector2();
//
// function defaultCalculatePosition(el: Object3D, camera: Camera, size: { width: number; height: number }) {
// 	const objectPos = v1.setFromMatrixPosition(el.matrixWorld);
// 	objectPos.project(camera);
// 	const widthHalf = size.width / 2;
// 	const heightHalf = size.height / 2;
// 	return [objectPos.x * widthHalf + widthHalf, -(objectPos.y * heightHalf) + heightHalf];
// }
//
// export type CalculatePosition = typeof defaultCalculatePosition;
//
// function isObjectBehindCamera(el: Object3D, camera: Camera) {
// 	const objectPos = v1.setFromMatrixPosition(el.matrixWorld);
// 	const cameraPos = v2.setFromMatrixPosition(camera.matrixWorld);
// 	const deltaCamObj = objectPos.sub(cameraPos);
// 	const camDir = camera.getWorldDirection(v3);
// 	return deltaCamObj.angleTo(camDir) > Math.PI / 2;
// }
//
// function isObjectVisible(el: Object3D, camera: Camera, raycaster: Raycaster, occlude: Object3D[]) {
// 	const elPos = v1.setFromMatrixPosition(el.matrixWorld);
// 	const screenPos = elPos.clone();
// 	screenPos.project(camera);
// 	v4.set(screenPos.x, screenPos.y);
// 	raycaster.setFromCamera(v4, camera);
// 	const intersects = raycaster.intersectObjects(occlude, true);
// 	if (intersects.length) {
// 		const intersectionDistance = intersects[0].distance;
// 		const pointDistance = elPos.distanceTo(raycaster.ray.origin);
// 		return pointDistance < intersectionDistance;
// 	}
// 	return true;
// }
//
// function objectScale(el: Object3D, camera: Camera) {
// 	if (is.orthographicCamera(camera)) return camera.zoom;
//
// 	if (is.perspectiveCamera(camera)) {
// 		const objectPos = v1.setFromMatrixPosition(el.matrixWorld);
// 		const cameraPos = v2.setFromMatrixPosition(camera.matrixWorld);
// 		const vFOV = (camera.fov * Math.PI) / 180;
// 		const dist = objectPos.distanceTo(cameraPos);
// 		const scaleFOV = 2 * Math.tan(vFOV / 2) * dist;
// 		return 1 / scaleFOV;
// 	}
//
// 	return 1;
// }
//
// function objectZIndex(el: Object3D, camera: Camera, zIndexRange: Array<number>) {
// 	if (is.perspectiveCamera(camera) || is.orthographicCamera(camera)) {
// 		const objectPos = v1.setFromMatrixPosition(el.matrixWorld);
// 		const cameraPos = v2.setFromMatrixPosition(camera.matrixWorld);
// 		const dist = objectPos.distanceTo(cameraPos);
// 		const A = (zIndexRange[1] - zIndexRange[0]) / (camera.far - camera.near);
// 		const B = zIndexRange[1] - A * camera.far;
// 		return Math.round(A * dist + B);
// 	}
//
// 	return undefined;
// }
//
// function epsilon(value: number) {
// 	return Math.abs(value) < 1e-10 ? 0 : value;
// }
//
// function getCSSMatrix(matrix: Matrix4, multipliers: number[], prepend = '') {
// 	let matrix3d = 'matrix3d(';
// 	for (let i = 0; i !== 16; i++) {
// 		matrix3d += epsilon(multipliers[i] * matrix.elements[i]) + (i !== 15 ? ',' : ')');
// 	}
// 	return prepend + matrix3d;
// }
//
// const getCameraCSSMatrix = ((multipliers: number[]) => {
// 	return (matrix: Matrix4) => getCSSMatrix(matrix, multipliers);
// })([1, -1, 1, 1, 1, -1, 1, 1, 1, -1, 1, 1, 1, -1, 1, 1]);
//
// const getObjectCSSMatrix = ((scaleMultipliers: (n: number) => number[]) => {
// 	return (matrix: Matrix4, factor: number) => getCSSMatrix(matrix, scaleMultipliers(factor), 'translate(-50%,-50%)');
// })((f: number) => [1 / f, 1 / f, 1 / f, 1, -1 / f, -1 / f, -1 / f, -1, 1 / f, 1 / f, 1 / f, 1, 1, 1, 1, 1]);
//
// type PointerEventsProperties =
// 	| 'auto'
// 	| 'none'
// 	| 'visiblePainted'
// 	| 'visibleFill'
// 	| 'visibleStroke'
// 	| 'visible'
// 	| 'painted'
// 	| 'fill'
// 	| 'stroke'
// 	| 'all'
// 	| 'inherit';
//
// export type NgtsHTMLContentOptions = {
// 	zIndexRange: Array<number>;
// 	parent?: HTMLElement | ElementRef<HTMLElement>;
// 	center?: boolean;
// 	prepend?: boolean;
// 	fullscreen?: boolean;
// 	containerClass?: string;
// 	pointerEvents?: PointerEventsProperties;
// 	calculatePosition: CalculatePosition;
// };
//
// export type NgtsHTMLOptions = {
// 	eps?: number;
// 	distanceFactor?: number;
// 	sprite?: boolean;
// 	transform?: boolean;
//
// 	// Occlusion based off work by Jerome Etienne and James Baicoianu
// 	// https://www.youtube.com/watch?v=ScZcUEDGjJI
// 	// as well as Joe Pea in CodePen: https://codepen.io/trusktr/pen/RjzKJx
// 	occlude?: Object3D[] | ElementRef<Object3D>[] | boolean | 'raycast' | 'blending';
// 	castShadow?: boolean; // Cast shadow for occlusion plane
// 	receiveShadow?: boolean; // Receive shadow for occlusion plane
// };
//
// const defaultHtmlContentOptions: NgtsHTMLContentOptions = {
// 	zIndexRange: [16777271, 0],
// 	pointerEvents: 'auto',
// 	calculatePosition: defaultCalculatePosition,
// };
//
// @Component({
// 	standalone: true,
// 	selector: '[htmlContent]',
// 	template: `
// 		@if (html.transform()) {
// 			<div [style]="styles()">
// 				<div style="position: absolute;" [style.pointer-events]="pointerEvents()">
// 					<div [class]="containerClass()">
// 						<ng-content />
// 					</div>
// 				</div>
// 			</div>
// 		} @else {
// 			<div [class]="containerClass()" [style]="styles()">
// 				<ng-content />
// 			</div>
// 		}
// 	`,
// 	changeDetection: ChangeDetectionStrategy.OnPush,
// })
// export class NgtsHTMLContent extends NgtHTML {
// 	options = input(defaultHtmlContentOptions, {
// 		transform: mergeInputs(defaultHtmlContentOptions),
// 		alias: 'htmlContent',
// 	});
//
// 	html = inject(NgtsHTML);
// 	private gl = this.store.select('gl');
// 	private events = this.store.select('events');
// 	private size = this.store.select('size');
// 	private scene = this.store.select('scene');
// 	private camera = this.store.select('camera');
// 	private raycaster = this.store.select('raycaster');
//
// 	zIndexRange = pick(this.options, 'zIndexRange');
// 	parent = pick(this.options, 'parent');
// 	containerClass = pick(this.options, 'containerClass');
// 	pointerEvents = pick(this.options, 'pointerEvents');
// 	private center = pick(this.options, 'center');
// 	private fullscreen = pick(this.options, 'fullscreen');
// 	private prepend = pick(this.options, 'prepend');
// 	private calculatePosition = pick(this.options, 'calculatePosition');
//
// 	target = computed(() => {
// 		const parent = resolveRef(this.parent());
// 		if (parent) return parent;
// 		return (this.events().connected || this.gl().domElement.parentNode) as HTMLElement;
// 	});
//
// 	styles = computed(() => {
// 		const [center, fullscreen, size, transform] = [
// 			this.center(),
// 			this.fullscreen(),
// 			this.size(),
// 			this.html.transform(),
// 		];
// 		if (transform) {
// 			return {
// 				position: 'absolute',
// 				top: 0,
// 				left: 0,
// 				width: size.width,
// 				height: size.height,
// 				transformStyle: 'preserve-3d',
// 				pointerEvents: 'none',
// 			};
// 		}
//
// 		return {
// 			position: 'absolute',
// 			transform: center ? 'translate3d(-50%,-50%,0)' : 'none',
// 			...(fullscreen && {
// 				top: -size.height / 2,
// 				left: -size.width / 2,
// 				width: size.width,
// 				height: size.height,
// 			}),
// 		};
// 	});
//
// 	constructor() {
// 		super();
//
// 		const autoEffect = injectAutoEffect();
//
// 		afterNextRender(() => {
// 			autoEffect(() => {
// 				const [occlude, hostEl, zIndexRange] = [
// 					this.html.occlude(),
// 					this.host.nativeElement,
// 					untracked(this.zIndexRange),
// 				];
//
// 				if (occlude && occlude === 'blending') {
// 					hostEl.style.zIndex = `${Math.floor(zIndexRange[0] / 2)}`;
// 					hostEl.style.position = 'absolute';
// 					hostEl.style.pointerEvents = 'none';
// 				} else {
// 					hostEl.style.zIndex = null!;
// 					hostEl.style.position = null!;
// 					hostEl.style.pointerEvents = null!;
// 				}
// 			});
//
// 			autoEffect(() => {
// 				const group = this.html.groupRef().nativeElement;
// 				if (!group) return;
//
// 				const [scene, transform, target, hostEl, camera, size, prepend, calculatePosition] = [
// 					this.scene(),
// 					this.html.transform(),
// 					this.target(),
// 					this.host.nativeElement,
// 					untracked(this.camera),
// 					untracked(this.size),
// 					untracked(this.prepend),
// 					untracked(this.calculatePosition),
// 				];
//
// 				scene.updateMatrixWorld();
// 				if (transform) {
// 					hostEl.style.cssText = `position:absolute;top:0;left:0;pointer-events:none;overflow:hidden;`;
// 				} else {
// 					const vec = calculatePosition(group, camera, size);
// 					hostEl.style.cssText = `position:absolute;top:0;left:0;transform:translate3d(${vec[0]}px,${vec[1]}px,0);transform-origin:0 0;`;
// 				}
//
// 				if (target) {
// 					if (prepend) target.prepend(hostEl);
// 					else target.appendChild(hostEl);
// 				}
//
// 				return () => {
// 					if (target) {
// 						target.removeChild(hostEl);
// 					}
// 				};
// 			});
//
// 			let oldPosition = [0, 0];
// 			let oldZoom = 0;
// 			let visible = false;
//
// 			injectBeforeRender(({ gl }) => {
// 				const group = this.html.groupRef().nativeElement;
// 				if (!group) return;
// 				const [
// 					camera,
// 					scene,
// 					transform,
// 					calculatePosition,
// 					size,
// 					eps,
// 					isRaycastOcclusion,
// 					occlude,
// 					raycaster,
// 					hostEl,
// 					zIndexRange,
// 				] = [
// 					this.camera(),
// 					this.scene(),
// 					this.html.transform(),
// 					this.calculatePosition(),
// 					this.size(),
// 					this.html.eps(),
// 					this.html.isRayCastOcclusion(),
// 					this.html.occlude(),
// 					this.raycaster(),
// 					this.host.nativeElement,
// 					this.zIndexRange(),
// 				];
//
// 				camera.updateMatrixWorld();
// 				group.updateWorldMatrix(true, false);
// 				const vec = transform ? oldPosition : calculatePosition(group, camera, size);
//
// 				if (
// 					transform ||
// 					Math.abs(oldZoom) > eps ||
// 					Math.abs(oldPosition[0] - vec[0]) > eps ||
// 					Math.abs(oldPosition[1] - vec[1]) > eps
// 				) {
// 					const isBehindCamera = isObjectBehindCamera(group, camera);
// 					let raytraceTarget: null | undefined | boolean | Object3D[] = false;
//
// 					if (isRaycastOcclusion) {
// 						if (Array.isArray(occlude)) {
// 							raytraceTarget = occlude.map((item) => resolveRef(item)) as Object3D[];
// 						} else if (occlude !== 'blending') {
// 							raytraceTarget = [scene];
// 						}
// 					}
//
// 					const previouslyVisible = visible;
// 					if (raytraceTarget) {
// 						const isVisible = isObjectVisible(group, camera, raycaster, raytraceTarget);
// 						visible = isVisible && !isBehindCamera;
// 					} else {
// 						visible = !isBehindCamera;
// 					}
//
// 					if (previouslyVisible !== visible) {
// 						hostEl.style.display = visible ? 'block' : 'none';
// 						// if (onOcclude) onOcclude(!visible.current)
// 						// else el.style.display = visible.current ? 'block' : 'none'
// 					}
//
// 					const halfRange = Math.floor(zIndexRange[0] / 2);
// 					const zRange = occlude
// 						? isRayCastOcclusion //
// 							? [zIndexRange[0], halfRange]
// 							: [halfRange - 1, 0]
// 						: zIndexRange;
//
// 					el.style.zIndex = `${objectZIndex(group, camera, zRange)}`;
//
// 					if (transform) {
// 						const [widthHalf, heightHalf] = [size.width / 2, size.height / 2];
// 						const fov = camera.projectionMatrix.elements[5] * heightHalf;
// 						const { isOrthographicCamera, top, left, bottom, right } = camera as OrthographicCamera;
// 						const cameraMatrix = getCameraCSSMatrix(camera.matrixWorldInverse);
// 						const cameraTransform = isOrthographicCamera
// 							? `scale(${fov})translate(${epsilon(-(right + left) / 2)}px,${epsilon((top + bottom) / 2)}px)`
// 							: `translateZ(${fov}px)`;
// 						let matrix = group.matrixWorld;
// 						if (sprite) {
// 							matrix = camera.matrixWorldInverse.clone().transpose().copyPosition(matrix).scale(group.scale);
// 							matrix.elements[3] = matrix.elements[7] = matrix.elements[11] = 0;
// 							matrix.elements[15] = 1;
// 						}
// 						hostEl.style.width = size.width + 'px';
// 						hostEl.style.height = size.height + 'px';
// 						hostEl.style.perspective = isOrthographicCamera ? '' : `${fov}px`;
// 						if (transformOuterRef.current && transformInnerRef.current) {
// 							transformOuterRef.current.style.transform = `${cameraTransform}${cameraMatrix}translate(${widthHalf}px,${heightHalf}px)`;
// 							transformInnerRef.current.style.transform = getObjectCSSMatrix(
// 								matrix,
// 								1 / ((distanceFactor || 10) / 400),
// 							);
// 						}
// 					} else {
// 						const scale = distanceFactor === undefined ? 1 : objectScale(group.current, camera) * distanceFactor;
// 						el.style.transform = `translate3d(${vec[0]}px,${vec[1]}px,0) scale(${scale})`;
// 					}
// 					oldPosition.current = vec;
// 					oldZoom.current = camera.zoom;
// 				}
// 			});
// 		});
// 	}
// }
//
// const defaultHtmlOptions: NgtsHTMLOptions = {
// 	eps: 0.001,
// 	sprite: false,
// 	transform: false,
// };
//
// @Component({
// 	selector: 'ngts-html',
// 	standalone: true,
// 	template: `
// 		<ngt-group #group>
// 			@if (isFinalOcclude()) {
// 				<ngt-mesh #occlusionMesh [castShadow]="castShadow()" [receiveShadow]="receiveShadow()">
// 					<ng-content select="[data-occlusion-geometry]">
// 						<ngt-plane-geometry />
// 					</ng-content>
// 					<ng-content select="[data-occlusion-geometry]">
// 						<ngt-shader-material
// 							[side]="DoubleSide"
// 							[vertexShader]="vertexShader()"
// 							[fragmentShader]="fragmentShader()"
// 						/>
// 					</ng-content>
// 				</ngt-mesh>
// 			}
// 		</ngt-group>
// 	`,
// 	schemas: [CUSTOM_ELEMENTS_SCHEMA],
// 	changeDetection: ChangeDetectionStrategy.OnPush,
// })
// export class NgtsHTML {
// 	options = input(defaultHtmlOptions, { transform: mergeInputs(defaultHtmlOptions) });
//
// 	occluded = output<boolean>();
//
// 	groupRef = viewChild.required<ElementRef<Group>>('group');
// 	occlusionMeshRef = viewChild<ElementRef<Mesh>>('occlusionMesh');
// 	htmlContent = contentChild.required(NgtsHTMLContent);
//
// 	castShadow = pick(this.options, 'castShadow');
// 	receiveShadow = pick(this.options, 'receiveShadow');
// 	transform = pick(this.options, 'transform');
// 	eps = pick(this.options, 'eps');
// 	occlude = pick(this.options, 'occlude');
//
// 	isRayCastOcclusion = computed(() => {
// 		const occlude = this.occlude();
// 		return (occlude && occlude !== 'blending') || (Array.isArray(occlude) && occlude.length && is.ref(occlude[0]));
// 	});
//
// 	isFinalOcclude = computed(() => !!this.occlude() && !this.isRayCastOcclusion());
//
// 	private shaders = computed(() => ({
// 		vertexShader: !this.transform()
// 			? /* language=glsl glsl */ `
//           /*
//             This shader is from the THREE's SpriteMaterial.
//             We need to turn the backing plane into a Sprite
//             (make it always face the camera) if "transfrom"
//             is false.
//           */
//           #include <common>
//
//           void main() {
//             vec2 center = vec2(0., 1.);
//             float rotation = 0.0;
//
//             // This is somewhat arbitrary, but it seems to work well
//             // Need to figure out how to derive this dynamically if it even matters
//             float size = 0.03;
//
//             vec4 mvPosition = modelViewMatrix * vec4( 0.0, 0.0, 0.0, 1.0 );
//             vec2 scale;
//             scale.x = length( vec3( modelMatrix[ 0 ].x, modelMatrix[ 0 ].y, modelMatrix[ 0 ].z ) );
//             scale.y = length( vec3( modelMatrix[ 1 ].x, modelMatrix[ 1 ].y, modelMatrix[ 1 ].z ) );
//
//             bool isPerspective = isPerspectiveMatrix( projectionMatrix );
//             if ( isPerspective ) scale *= - mvPosition.z;
//
//             vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale * size;
//             vec2 rotatedPosition;
//             rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
//             rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
//             mvPosition.xy += rotatedPosition;
//
//             gl_Position = projectionMatrix * mvPosition;
//           }
//       `
// 			: undefined,
// 		fragmentShader: /* language=glsl glsl */ `
//         void main() {
//           gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
//         }
//       `,
// 	}));
//
// 	vertexShader = pick(this.shaders, 'vertexShader');
// 	fragmentShader = pick(this.shaders, 'fragmentShader');
//
// 	constructor() {
// 		extend({ Group, Mesh, PlaneGeometry, ShaderMaterial });
// 	}
//
// 	protected readonly DoubleSide = DoubleSide;
// }
