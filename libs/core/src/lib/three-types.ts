import type * as THREE from 'three';
import type {
	NgtAfterAttach,
	NgtAnyRecord,
	NgtArguments,
	NgtAttachFunction,
	NgtBeforeRenderEvent,
	NgtConstructorRepresentation,
	NgtEventHandlers,
} from './types';

export type NgtNonFunctionKeys<T> = { [K in keyof T]-?: T[K] extends Function ? never : K }[keyof T];
export type NgtOverwrite<T, O> = Omit<T, NgtNonFunctionKeys<O>> & O;
export type NgtProperties<T> = Pick<T, NgtNonFunctionKeys<T>>;
export type NgtMutable<P> = { [K in keyof P]: P[K] | Readonly<P[K]> };

export interface NgtMathRepresentation {
	set(...args: number[]): any;
}

export interface NgtVectorRepresentation extends NgtMathRepresentation {
	setScalar(value: number): any;
}

export type NgtMathTypes = NgtMathRepresentation | THREE.Euler | THREE.Color;

export type NgtMathType<T extends NgtMathTypes> = T extends THREE.Color
	? NgtArguments<typeof THREE.Color> | THREE.ColorRepresentation
	: T extends NgtVectorRepresentation | THREE.Layers | THREE.Euler
		? T | Parameters<T['set']> | number
		: T | Parameters<T['set']>;

export type NgtMathProperties<P> = {
	[K in keyof P as P[K] extends NgtMathTypes ? K : never]: P[K] extends NgtMathTypes ? NgtMathType<P[K]> : never;
};

export type NgtVector2 = NgtMathType<THREE.Vector2>;
export type NgtVector3 = NgtMathType<THREE.Vector3>;
export type NgtVector4 = NgtMathType<THREE.Vector4>;
export type NgtColor = NgtMathType<THREE.Color>;
export type NgtLayers = NgtMathType<THREE.Layers>;
export type NgtQuaternion = NgtMathType<THREE.Quaternion>;
export type NgtEuler = NgtMathType<THREE.Euler>;
export type NgtMatrix3 = NgtMathType<THREE.Matrix3>;
export type NgtMatrix4 = NgtMathType<THREE.Matrix4>;

export interface NgtRaycastableRepresentation {
	raycast(raycaster: THREE.Raycaster, intersects: THREE.Intersection[]): void;
}

export type ThreeDisposeEvent = { type: 'dispose'; target: any };
export type ThreeAddedEvent = { type: 'added'; target: any };
export type ThreeRemovedEvent = { type: 'removed'; target: any };
export type ThreeChildAddedEvent = { type: 'childadded'; target: any; child: any };
export type ThreeChildRemovedEvent = { type: 'childremoved'; target: any; child: any };

export interface NgtNodeEventMap<TInstance = NgtAnyRecord> {
	attached: NgtAfterAttach<any, TInstance>;
	updated: TInstance;
	beforeRender: NgtBeforeRenderEvent<TInstance>;
	// NOTE: this is named "disposed" to differentiate it from [dispose] property.
	disposed: ThreeDisposeEvent;
}

export type NgtObject3DEventsMap = {
	[TEvent in keyof NgtEventHandlers]-?: Parameters<NonNullable<NgtEventHandlers[TEvent]>>[0];
} & {
	added: ThreeAddedEvent;
	removed: ThreeRemovedEvent;
	childadded: ThreeChildAddedEvent;
	childremoved: ThreeChildRemovedEvent;
};

export type NgtAllObject3DEventsMap<TInstance> = NgtObject3DEventsMap & NgtNodeEventMap<TInstance>;

export interface NgtNodeElement<
	TConstructor extends NgtConstructorRepresentation,
	TInstance = InstanceType<TConstructor>,
> {
	attach: string | string[] | NgtAttachFunction;
	dispose?: (() => void) | null;
	__ngt_args__: NgtArguments<TConstructor>;
}

export interface NgtNodeEventListener<
	TConstructor extends NgtConstructorRepresentation,
	TInstance = InstanceType<TConstructor>,
	TEventMap extends NgtNodeEventMap<TInstance> = TInstance extends NgtRaycastableRepresentation
		? NgtAllObject3DEventsMap<TInstance>
		: NgtNodeEventMap<TInstance>,
> {
	addEventListener<TEventKey extends keyof TEventMap>(
		type: TEventKey,
		listener: (this: NgtNodeElement<TConstructor, TInstance>, ev: TEventMap[TEventKey]) => any,
	): void;
	removeEventListener<TEventKey extends keyof TEventMap>(
		type: TEventKey,
		listener: (this: NgtNodeElement<TConstructor, TInstance>, ev: TEventMap[TEventKey]) => any,
	): void;
}

export type NgtElementProperties<
	TConstructor extends NgtConstructorRepresentation,
	TInstance = InstanceType<TConstructor>,
> = Partial<NgtOverwrite<TInstance, NgtMathProperties<TInstance>>> & NgtNodeElement<TConstructor, TInstance>;

export type NgtThreeElement<TConstructor extends NgtConstructorRepresentation> = NgtMutable<
	NgtElementProperties<TConstructor>
> &
	NgtNodeEventListener<TConstructor>;

type ThreeExports = typeof THREE;
type NgtThreeElementsImpl = {
	[K in keyof ThreeExports]: ThreeExports[K] extends NgtConstructorRepresentation
		? NgtThreeElement<ThreeExports[K]>
		: never;
};

export type NgtThreeElementsMap = {
	/**
	 * @from node_modules/@types/three/src/core/Object3D.d.ts
	 */
	'ngt-object3D': Extract<keyof ThreeExports, 'Object3D'>;
	/**
	 * @from node_modules/@types/three/src/objects/Mesh.d.ts
	 */
	'ngt-mesh': Extract<keyof ThreeExports, 'Mesh'>;
	/**
	 * @from node_modules/@types/three/src/objects/InstancedMesh.d.ts
	 */
	'ngt-instanced-mesh': Extract<keyof ThreeExports, 'InstancedMesh'>;
	/**
	 * @from node_modules/@types/three/src/core/InstancedBufferGeometry.d.ts
	 */
	'ngt-instanced-buffer-geometry': Extract<keyof ThreeExports, 'InstancedBufferGeometry'>;
	/**
	 * @from node_modules/@types/three/src/core/BufferGeometry.d.ts
	 */
	'ngt-buffer-geometry': Extract<keyof ThreeExports, 'BufferGeometry'>;
	/**
	 * @from node_modules/@types/three/src/core/WireframeGeometry.d.ts
	 */
	'ngt-wireframe-geometry': Extract<keyof ThreeExports, 'WireframeGeometry'>;
	/**
	 * @from node_modules/@types/three/src/geometries/TetrahedronGeometry.d.ts
	 */
	'ngt-tetrahedron-geometry': Extract<keyof ThreeExports, 'TetrahedronGeometry'>;
	/**
	 * @from node_modules/@types/three/src/geometries/OctahedronGeometry.d.ts
	 */
	'ngt-octahedron-geometry': Extract<keyof ThreeExports, 'OctahedronGeometry'>;
	/**
	 * @from node_modules/@types/three/src/geometries/IcosahedronGeometry.d.ts
	 */
	'ngt-icosahedron-geometry': Extract<keyof ThreeExports, 'IcosahedronGeometry'>;
	/**
	 * @from node_modules/@types/three/src/geometries/PolyhedronGeometry.d.ts
	 */
	'ngt-polyhedron-geometry': Extract<keyof ThreeExports, 'PolyhedronGeometry'>;
	/**
	 * @from node_modules/@types/three/src/geometries/DodecahedronGeometry.d.ts
	 */
	'ngt-dodecahedron-geometry': Extract<keyof ThreeExports, 'DodecahedronGeometry'>;
	/**
	 * @from node_modules/@types/three/src/geometries/TubeGeometry.d.ts
	 */
	'ngt-tube-geometry': Extract<keyof ThreeExports, 'TubeGeometry'>;
	/**
	 * @from node_modules/@types/three/src/geometries/TorusKnotGeometry.d.ts
	 */
	'ngt-torus-knot-geometry': Extract<keyof ThreeExports, 'TorusKnotGeometry'>;
	/**
	 * @from node_modules/@types/three/src/geometries/TorusGeometry.d.ts
	 */
	'ngt-torus-geometry': Extract<keyof ThreeExports, 'TorusGeometry'>;
	/**
	 * @from node_modules/@types/three/src/geometries/SphereGeometry.d.ts
	 */
	'ngt-sphere-geometry': Extract<keyof ThreeExports, 'SphereGeometry'>;
	/**
	 * @from node_modules/@types/three/src/geometries/RingGeometry.d.ts
	 */
	'ngt-ring-geometry': Extract<keyof ThreeExports, 'RingGeometry'>;
	/**
	 * @from node_modules/@types/three/src/geometries/PlaneGeometry.d.ts
	 */
	'ngt-plane-geometry': Extract<keyof ThreeExports, 'PlaneGeometry'>;
	/**
	 * @from node_modules/@types/three/src/geometries/LatheGeometry.d.ts
	 */
	'ngt-lathe-geometry': Extract<keyof ThreeExports, 'LatheGeometry'>;
	/**
	 * @from node_modules/@types/three/src/geometries/LineSegments.d.ts
	 */
	'ngt-line-segments': Extract<keyof ThreeExports, 'LineSegments'>;
	/**
	 * @from node_modules/@types/three/src/geometries/LineLoop.d.ts
	 */
	'ngt-line-loop': Extract<keyof ThreeExports, 'LineLoop'>;
	/**
	 * @from node_modules/@types/three/src/geometries/Points.d.ts
	 */
	'ngt-points': Extract<keyof ThreeExports, 'Points'>;
	/**
	 * @from node_modules/@types/three/src/objects/Group.d.ts
	 */
	'ngt-group': Extract<keyof ThreeExports, 'Group'>;
	/**
	 * @from node_modules/@types/three/src/cameras/Camera.d.ts
	 */
	'ngt-camera': Extract<keyof ThreeExports, 'Camera'>;
	/**
	 * @from node_modules/@types/three/src/cameras/PerspectiveCamera.d.ts
	 */
	'ngt-perspective-camera': Extract<keyof ThreeExports, 'PerspectiveCamera'>;
	/**
	 * @from node_modules/@types/three/src/cameras/OrthographicCamera.d.ts
	 */
	'ngt-orthographic-camera': Extract<keyof ThreeExports, 'OrthographicCamera'>;
	/**
	 * @from node_modules/@types/three/src/cameras/CubeCamera.d.ts
	 */
	'ngt-cube-camera': Extract<keyof ThreeExports, 'CubeCamera'>;
	/**
	 * @from node_modules/@types/three/src/cameras/ArrayCamera.d.ts
	 */
	'ngt-array-camera': Extract<keyof ThreeExports, 'ArrayCamera'>;

	/**
	 * @from node_modules/@types/three/src/lights/LightShadow.d.ts
	 */
	'ngt-light-shadow': Extract<keyof ThreeExports, 'LightShadow'>;
	/**
	 * @from node_modules/@types/three/src/lights/SpotLightShadow.d.ts
	 */
	'ngt-spot-light-shadow': Extract<keyof ThreeExports, 'SpotLightShadow'>;
	/**
	 * @from node_modules/@types/three/src/lights/DirectionalLightShadow.d.ts
	 */
	'ngt-directional-light-shadow': Extract<keyof ThreeExports, 'DirectionalLightShadow'>;

	/**
	 * @from node_modules/@types/three/src/lights/SpotLight.d.ts
	 */
	'ngt-spot-light': Extract<keyof ThreeExports, 'SpotLight'>;
	/**
	 * @from node_modules/@types/three/src/lights/PointLight.d.ts
	 */
	'ngt-point-light': Extract<keyof ThreeExports, 'PointLight'>;
	/**
	 * @from node_modules/@types/three/src/lights/RectAreaLight.d.ts
	 */
	'ngt-rect-area-light': Extract<keyof ThreeExports, 'RectAreaLight'>;
	/**
	 * @from node_modules/@types/three/src/lights/HemisphereLight.d.ts
	 */
	'ngt-hemisphere-light': Extract<keyof ThreeExports, 'HemisphereLight'>;
	/**
	 * @from node_modules/@types/three/src/lights/DirectionalLight.d.ts
	 */
	'ngt-directional-light': Extract<keyof ThreeExports, 'DirectionalLight'>;
	/**
	 * @from node_modules/@types/three/src/lights/AmbientLight.d.ts
	 */
	'ngt-ambient-light': Extract<keyof ThreeExports, 'AmbientLight'>;
	/**
	 * @from node_modules/@types/three/src/lights/LightProbe.d.ts
	 */
	'ngt-light-probe': Extract<keyof ThreeExports, 'LightProbe'>;

	/**
	 * @from node_modules/@types/three/src/helpers/SpotLightHelper.d.ts
	 */
	'ngt-spot-light-helper': Extract<keyof ThreeExports, 'SpotLightHelper'>;
	/**
	 * @from node_modules/@types/three/src/helpers/SkeletonHelper.d.ts
	 */
	'ngt-skeleton-helper': Extract<keyof ThreeExports, 'SkeletonHelper'>;
	/**
	 * @from node_modules/@types/three/src/helpers/PointLightHelper.d.ts
	 */
	'ngt-point-light-helper': Extract<keyof ThreeExports, 'PointLightHelper'>;
	/**
	 * @from node_modules/@types/three/src/helpers/HemisphereLightHelper.d.ts
	 */
	'ngt-hemisphere-light-helper': Extract<keyof ThreeExports, 'HemisphereLightHelper'>;
	/**
	 * @from node_modules/@types/three/src/helpers/GridHelper.d.ts
	 */
	'ngt-grid-helper': Extract<keyof ThreeExports, 'GridHelper'>;
	/**
	 * @from node_modules/@types/three/src/helpers/PolarGridHelper.d.ts
	 */
	'ngt-polar-grid-helper': Extract<keyof ThreeExports, 'PolarGridHelper'>;
	/**
	 * @from node_modules/@types/three/src/helpers/DirectionalLightHelper.d.ts
	 */
	'ngt-directional-light-helper': Extract<keyof ThreeExports, 'DirectionalLightHelper'>;
	/**
	 * @from node_modules/@types/three/src/helpers/CameraHelper.d.ts
	 */
	'ngt-camera-helper': Extract<keyof ThreeExports, 'CameraHelper'>;
	/**
	 * @from node_modules/@types/three/src/helpers/BoxHelper.d.ts
	 */
	'ngt-box-helper': Extract<keyof ThreeExports, 'BoxHelper'>;
	/**
	 * @from node_modules/@types/three/src/helpers/Box3Helper.d.ts
	 */
	'ngt-box3-helper': Extract<keyof ThreeExports, 'Box3Helper'>;
	/**
	 * @from node_modules/@types/three/src/helpers/PlaneHelper.d.ts
	 */
	'ngt-plane-helper': Extract<keyof ThreeExports, 'PlaneHelper'>;
	/**
	 * @from node_modules/@types/three/src/helpers/ArrowHelper.d.ts
	 */
	'ngt-arrow-helper': Extract<keyof ThreeExports, 'ArrowHelper'>;
	/**
	 * @from node_modules/@types/three/src/helpers/AxesHelper.d.ts
	 */
	'ngt-axes-helper': Extract<keyof ThreeExports, 'AxesHelper'>;

	/**
	 * @from node_modules/@types/three/src/helpers/Audio.d.ts
	 */
	'ngt-audio': Extract<keyof ThreeExports, 'Audio'>;
	/**
	 * @from node_modules/@types/three/src/helpers/PositionalAudio.d.ts
	 */
	'ngt-positional-audio': Extract<keyof ThreeExports, 'PositionalAudio'>;
	/**
	 * @from node_modules/@types/three/src/helpers/AudioListener.d.ts
	 */
	'ngt-audio-listener': Extract<keyof ThreeExports, 'AudioListener'>;

	/**
	 * @from node_modules/@types/three/src/textures/Texture.d.ts
	 */
	'ngt-texture': Extract<keyof ThreeExports, 'Texture'>;
	/**
	 * @from node_modules/@types/three/src/textures/CompressedTexture.d.ts
	 */
	'ngt-compressed-texture': Extract<keyof ThreeExports, 'CompressedTexture'>;
	/**
	 * @from node_modules/@types/three/src/textures/VideoTexture.d.ts
	 */
	'ngt-video-texture': Extract<keyof ThreeExports, 'VideoTexture'>;
	/**
	 * @from node_modules/@types/three/src/textures/DataTexture.d.ts
	 */
	'ngt-data-texture': Extract<keyof ThreeExports, 'DataTexture'>;
	/**
	 * @from node_modules/@types/three/src/textures/Data3DTexture.d.ts
	 */
	'ngt-data3D-texture': Extract<keyof ThreeExports, 'Data3DTexture'>;
	/**
	 * @from node_modules/@types/three/src/textures/CubeTexture.d.ts
	 */
	'ngt-cube-texture': Extract<keyof ThreeExports, 'CubeTexture'>;
	/**
	 * @from node_modules/@types/three/src/textures/CanvasTexture.d.ts
	 */
	'ngt-canvas-texture': Extract<keyof ThreeExports, 'CanvasTexture'>;
	/**
	 * @from node_modules/@types/three/src/textures/DepthTexture.d.ts
	 */
	'ngt-depth-texture': Extract<keyof ThreeExports, 'DepthTexture'>;
	/**
	 * @from node_modules/@types/three/src/core/Raycaster.d.ts
	 */
	'ngt-raycaster': Extract<keyof ThreeExports, 'Raycaster'>;
	/**
	 * @from node_modules/@types/three/src/math/Vector2.d.ts
	 */
	'ngt-vector2': Extract<keyof ThreeExports, 'Vector2'>;
	/**
	 * @from node_modules/@types/three/src/math/Vector3.d.ts
	 */
	'ngt-vector3': Extract<keyof ThreeExports, 'Vector3'>;
	/**
	 * @from node_modules/@types/three/src/math/Vector4.d.ts
	 */
	'ngt-vector4': Extract<keyof ThreeExports, 'Vector4'>;
	/**
	 * @from node_modules/@types/three/src/math/Euler.d.ts
	 */
	'ngt-euler': Extract<keyof ThreeExports, 'Euler'>;
	/**
	 * @from node_modules/@types/three/src/math/Matrix3.d.ts
	 */
	'ngt-matrix3': Extract<keyof ThreeExports, 'Matrix3'>;
	/**
	 * @from node_modules/@types/three/src/math/Matrix4.d.ts
	 */
	'ngt-matrix4': Extract<keyof ThreeExports, 'Matrix4'>;
	/**
	 * @from node_modules/@types/three/src/math/Quaternion.d.ts
	 */
	'ngt-quaternion': Extract<keyof ThreeExports, 'Quaternion'>;

	/**
	 * @from node_modules/@types/three/src/core/BufferAttribute.d.ts
	 */
	'ngt-buffer-attribute': Extract<keyof ThreeExports, 'BufferAttribute'>;
	/**
	 * @from node_modules/@types/three/src/core/Float16BufferAttribute.d.ts
	 */
	'ngt-float16-buffer-attribute': Extract<keyof ThreeExports, 'Float16BufferAttribute'>;
	/**
	 * @from node_modules/@types/three/src/core/Float32BufferAttribute.d.ts
	 */
	'ngt-float32-buffer-attribute': Extract<keyof ThreeExports, 'Float32BufferAttribute'>;
	/**
	 * @from node_modules/@types/three/src/core/Int8BufferAttribute.d.ts
	 */
	'ngt-int8-buffer-attribute': Extract<keyof ThreeExports, 'Int8BufferAttribute'>;
	/**
	 * @from node_modules/@types/three/src/core/Int16BufferAttribute.d.ts
	 */
	'ngt-int16-buffer-attribute': Extract<keyof ThreeExports, 'Int16BufferAttribute'>;
	/**
	 * @from node_modules/@types/three/src/core/Int32BufferAttribute.d.ts
	 */
	'ngt-int32-buffer-attribute': Extract<keyof ThreeExports, 'Int32BufferAttribute'>;
	/**
	 * @from node_modules/@types/three/src/core/Uint8BufferAttribute.d.ts
	 */
	'ngt-unit8-buffer-attribute': Extract<keyof ThreeExports, 'Uint8BufferAttribute'>;
	/**
	 * @from node_modules/@types/three/src/core/Uint16BufferAttribute.d.ts
	 */
	'ngt-unit16-buffer-attribute': Extract<keyof ThreeExports, 'Uint16BufferAttribute'>;
	/**
	 * @from node_modules/@types/three/src/core/Uint32BufferAttribute.d.ts
	 */
	'ngt-unit32-buffer-attribute': Extract<keyof ThreeExports, 'Uint32BufferAttribute'>;
	/**
	 * @from node_modules/@types/three/src/core/InstancedBufferAttribute.d.ts
	 */
	'ngt-instanced-buffer-attribute': Extract<keyof ThreeExports, 'InstancedBufferAttribute'>;
	/**
	 * @from node_modules/@types/three/src/math/Color.d.ts
	 */
	'ngt-color': Extract<keyof ThreeExports, 'Color'>;
	/**
	 * @from node_modules/@types/three/src/scenes/Fog.d.ts
	 */
	'ngt-fog': Extract<keyof ThreeExports, 'Fog'>;
	/**
	 * @from node_modules/@types/three/src/scenes/FogExp2.d.ts
	 */
	'ngt-fog-exp2': Extract<keyof ThreeExports, 'FogExp2'>;
	/**
	 * @from node_modules/@types/three/src/extras/core/Shape.d.ts
	 */
	'ngt-shape': Extract<keyof ThreeExports, 'Shape'>;
};

export type NgtThreeElements = {
	[NgtKey in keyof NgtThreeElementsMap]: NgtThreeElementsImpl[NgtThreeElementsMap[NgtKey]];
} & {
	'ngt-primitive': NgtThreeElement<any>;
	'ngt-value': NgtThreeElement<any> & { rawValue: any };
};

declare global {
	interface HTMLElementTagNameMap extends NgtThreeElements {}
	interface HTMLElementEventMap extends NgtAllObject3DEventsMap<any> {}
}
