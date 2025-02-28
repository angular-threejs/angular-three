import type * as THREE from 'three';
import type {
	NgtAfterAttach,
	NgtAnyRecord,
	NgtArguments,
	NgtAttachFunction,
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

export type NgtNullableRaycast<P> = {
	[K in keyof P as K extends 'raycast' ? K : never]: K extends 'raycast' ? P[K] | null : never;
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
export type ThreeChangeEvent = { type: 'change'; target: any };
export type ThreeAddedEvent = { type: 'added'; target: any };
export type ThreeRemovedEvent = { type: 'removed'; target: any };
export type ThreeChildAddedEvent = { type: 'childadded'; target: any; child: any };
export type ThreeChildRemovedEvent = { type: 'childremoved'; target: any; child: any };

export interface NgtNodeEventMap<TInstance = NgtAnyRecord> {
	attached: NgtAfterAttach<TInstance, any>;
	updated: TInstance;
	created: TInstance;
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
	change: ThreeChangeEvent;
};

export type NgtAllObject3DEventsMap<TInstance> = NgtObject3DEventsMap & NgtNodeEventMap<TInstance>;

export interface NgtNodeElement<
	TConstructor extends NgtConstructorRepresentation,
	TInstance = InstanceType<TConstructor>,
> {
	attach: string | string[] | NgtAttachFunction;
	dispose?: (() => void) | null;
	parameters: Partial<TInstance>;
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
> = Partial<NgtOverwrite<TInstance, NgtMathProperties<TInstance> & NgtNullableRaycast<TInstance>>> &
	NgtNodeElement<TConstructor, TInstance>;

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

export interface NgtThreeElements {
	'ngt-scene': NgtThreeElementsImpl['Scene'];
	'ngt-object3D': NgtThreeElementsImpl['Object3D'];
	'ngt-lOD': NgtThreeElementsImpl['LOD'];
	'ngt-mesh': NgtThreeElementsImpl['Mesh'];
	'ngt-instanced-mesh': NgtThreeElementsImpl['InstancedMesh'];
	'ngt-material': NgtThreeElementsImpl['Material'];
	'ngt-mesh-basic-material': NgtThreeElementsImpl['MeshBasicMaterial'];
	'ngt-mesh-physical-material': NgtThreeElementsImpl['MeshPhysicalMaterial'];
	'ngt-mesh-standard-material': NgtThreeElementsImpl['MeshStandardMaterial'];
	'ngt-mesh-toon-material': NgtThreeElementsImpl['MeshToonMaterial'];
	'ngt-mesh-normal-material': NgtThreeElementsImpl['MeshNormalMaterial'];
	'ngt-mesh-depth-material': NgtThreeElementsImpl['MeshDepthMaterial'];
	'ngt-mesh-distance-material': NgtThreeElementsImpl['MeshDistanceMaterial'];
	'ngt-mesh-matcap-material': NgtThreeElementsImpl['MeshMatcapMaterial'];
	'ngt-mesh-phong-material': NgtThreeElementsImpl['MeshPhongMaterial'];
	'ngt-line-basic-material': NgtThreeElementsImpl['LineBasicMaterial'];
	'ngt-line-dashed-material': NgtThreeElementsImpl['LineDashedMaterial'];
	'ngt-mesh-lambert-material': NgtThreeElementsImpl['MeshLambertMaterial'];
	'ngt-points-material': NgtThreeElementsImpl['PointsMaterial'];
	'ngt-raw-shader-material': NgtThreeElementsImpl['RawShaderMaterial'];
	'ngt-shader-material': NgtThreeElementsImpl['ShaderMaterial'];
	'ngt-shadow-material': NgtThreeElementsImpl['ShadowMaterial'];
	'ngt-sprite-material': NgtThreeElementsImpl['SpriteMaterial'];
	'ngt-instanced-buffer-geometry': NgtThreeElementsImpl['InstancedBufferGeometry'];
	'ngt-buffer-geometry': NgtThreeElementsImpl['BufferGeometry'];
	'ngt-wireframe-geometry': NgtThreeElementsImpl['WireframeGeometry'];
	'ngt-box-geometry': NgtThreeElementsImpl['BoxGeometry'];
	'ngt-extrude-geometry': NgtThreeElementsImpl['ExtrudeGeometry'];
	'ngt-shape-geometry': NgtThreeElementsImpl['ShapeGeometry'];
	'ngt-circle-geometry': NgtThreeElementsImpl['CircleGeometry'];
	'ngt-cylinder-geometry': NgtThreeElementsImpl['CylinderGeometry'];
	'ngt-capsule-geometry': NgtThreeElementsImpl['CapsuleGeometry'];
	'ngt-cone-geometry': NgtThreeElementsImpl['ConeGeometry'];
	'ngt-edges-geometry': NgtThreeElementsImpl['EdgesGeometry'];
	'ngt-tetrahedron-geometry': NgtThreeElementsImpl['TetrahedronGeometry'];
	'ngt-octahedron-geometry': NgtThreeElementsImpl['OctahedronGeometry'];
	'ngt-icosahedron-geometry': NgtThreeElementsImpl['IcosahedronGeometry'];
	'ngt-polyhedron-geometry': NgtThreeElementsImpl['PolyhedronGeometry'];
	'ngt-dodecahedron-geometry': NgtThreeElementsImpl['DodecahedronGeometry'];
	'ngt-tube-geometry': NgtThreeElementsImpl['TubeGeometry'];
	'ngt-torus-knot-geometry': NgtThreeElementsImpl['TorusKnotGeometry'];
	'ngt-torus-geometry': NgtThreeElementsImpl['TorusGeometry'];
	'ngt-sphere-geometry': NgtThreeElementsImpl['SphereGeometry'];
	'ngt-ring-geometry': NgtThreeElementsImpl['RingGeometry'];
	'ngt-plane-geometry': NgtThreeElementsImpl['PlaneGeometry'];
	'ngt-lathe-geometry': NgtThreeElementsImpl['LatheGeometry'];
	'ngt-line-segments': NgtThreeElementsImpl['LineSegments'];
	'ngt-line-loop': NgtThreeElementsImpl['LineLoop'];
	'ngt-points': NgtThreeElementsImpl['Points'];
	'ngt-group': NgtThreeElementsImpl['Group'];
	'ngt-camera': NgtThreeElementsImpl['Camera'];
	'ngt-perspective-camera': NgtThreeElementsImpl['PerspectiveCamera'];
	'ngt-orthographic-camera': NgtThreeElementsImpl['OrthographicCamera'];
	'ngt-cube-camera': NgtThreeElementsImpl['CubeCamera'];
	'ngt-array-camera': NgtThreeElementsImpl['ArrayCamera'];
	'ngt-spot-light': NgtThreeElementsImpl['SpotLight'];
	'ngt-point-light': NgtThreeElementsImpl['PointLight'];
	'ngt-rect-area-light': NgtThreeElementsImpl['RectAreaLight'];
	'ngt-hemisphere-light': NgtThreeElementsImpl['HemisphereLight'];
	'ngt-directional-light': NgtThreeElementsImpl['DirectionalLight'];
	'ngt-ambient-light': NgtThreeElementsImpl['AmbientLight'];
	'ngt-light-probe': NgtThreeElementsImpl['LightProbe'];
	'ngt-spot-light-helper': NgtThreeElementsImpl['SpotLightHelper'];
	'ngt-skeleton-helper': NgtThreeElementsImpl['SkeletonHelper'];
	'ngt-point-light-helper': NgtThreeElementsImpl['PointLightHelper'];
	'ngt-hemisphere-light-helper': NgtThreeElementsImpl['HemisphereLightHelper'];
	'ngt-grid-helper': NgtThreeElementsImpl['GridHelper'];
	'ngt-polar-grid-helper': NgtThreeElementsImpl['PolarGridHelper'];
	'ngt-directional-light-helper': NgtThreeElementsImpl['DirectionalLightHelper'];
	'ngt-camera-helper': NgtThreeElementsImpl['CameraHelper'];
	'ngt-box-helper': NgtThreeElementsImpl['BoxHelper'];
	'ngt-box3-helper': NgtThreeElementsImpl['Box3Helper'];
	'ngt-plane-helper': NgtThreeElementsImpl['PlaneHelper'];
	'ngt-arrow-helper': NgtThreeElementsImpl['ArrowHelper'];
	'ngt-axes-helper': NgtThreeElementsImpl['AxesHelper'];
	'ngt-audio': NgtThreeElementsImpl['Audio'];
	'ngt-positional-audio': NgtThreeElementsImpl['PositionalAudio'];
	'ngt-audio-listener': NgtThreeElementsImpl['AudioListener'];
	'ngt-texture': NgtThreeElementsImpl['Texture'];
	'ngt-compressed-texture': NgtThreeElementsImpl['CompressedTexture'];
	'ngt-video-texture': NgtThreeElementsImpl['VideoTexture'];
	'ngt-data-texture': NgtThreeElementsImpl['DataTexture'];
	'ngt-data3D-texture': NgtThreeElementsImpl['Data3DTexture'];
	'ngt-cube-texture': NgtThreeElementsImpl['CubeTexture'];
	'ngt-canvas-texture': NgtThreeElementsImpl['CanvasTexture'];
	'ngt-depth-texture': NgtThreeElementsImpl['DepthTexture'];
	'ngt-raycaster': NgtThreeElementsImpl['Raycaster'];
	'ngt-vector2': NgtThreeElementsImpl['Vector2'];
	'ngt-vector3': NgtThreeElementsImpl['Vector3'];
	'ngt-vector4': NgtThreeElementsImpl['Vector4'];
	'ngt-euler': NgtThreeElementsImpl['Euler'];
	'ngt-matrix3': NgtThreeElementsImpl['Matrix3'];
	'ngt-matrix4': NgtThreeElementsImpl['Matrix4'];
	'ngt-quaternion': NgtThreeElementsImpl['Quaternion'];
	'ngt-buffer-attribute': NgtThreeElementsImpl['BufferAttribute'];
	'ngt-float16-buffer-attribute': NgtThreeElementsImpl['Float16BufferAttribute'];
	'ngt-float32-buffer-attribute': NgtThreeElementsImpl['Float32BufferAttribute'];
	'ngt-int8-buffer-attribute': NgtThreeElementsImpl['Int8BufferAttribute'];
	'ngt-int16-buffer-attribute': NgtThreeElementsImpl['Int16BufferAttribute'];
	'ngt-int32-buffer-attribute': NgtThreeElementsImpl['Int32BufferAttribute'];
	'ngt-uint8-buffer-attribute': NgtThreeElementsImpl['Uint8BufferAttribute'];
	'ngt-uint16-buffer-attribute': NgtThreeElementsImpl['Uint16BufferAttribute'];
	'ngt-uint32-buffer-attribute': NgtThreeElementsImpl['Uint32BufferAttribute'];
	'ngt-instanced-buffer-attribute': NgtThreeElementsImpl['InstancedBufferAttribute'];
	'ngt-color': NgtThreeElementsImpl['Color'];
	'ngt-fog': NgtThreeElementsImpl['Fog'];
	'ngt-fog-exp2': NgtThreeElementsImpl['FogExp2'];
	'ngt-shape': NgtThreeElementsImpl['Shape'];
	'ngt-primitive': NgtThreeElement<any>;
	'ngt-value': NgtThreeElement<any> & { rawValue: any };
}

declare global {
	interface HTMLElementTagNameMap extends NgtThreeElements {}
	interface HTMLElementEventMap extends NgtAllObject3DEventsMap<any> {}
}
