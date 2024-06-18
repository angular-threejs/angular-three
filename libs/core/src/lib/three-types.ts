import {
	AmbientLight,
	ArrayCamera,
	ArrowHelper,
	Audio,
	AxesHelper,
	Bone,
	Box3Helper,
	BoxGeometry,
	BoxHelper,
	BufferAttribute,
	BufferGeometry,
	Camera,
	CameraHelper,
	CanvasTexture,
	CapsuleGeometry,
	CircleGeometry,
	Color,
	ColorRepresentation,
	CompressedTexture,
	ConeGeometry,
	CubeCamera,
	CubeTexture,
	CylinderGeometry,
	Data3DTexture,
	DataTexture,
	DepthTexture,
	DirectionalLight,
	DirectionalLightHelper,
	DirectionalLightShadow,
	DodecahedronGeometry,
	EdgesGeometry,
	Euler,
	ExtrudeGeometry,
	Float16BufferAttribute,
	Float32BufferAttribute,
	Fog,
	FogExp2,
	GridHelper,
	Group,
	HemisphereLight,
	HemisphereLightHelper,
	IcosahedronGeometry,
	InstancedBufferAttribute,
	InstancedBufferGeometry,
	InstancedMesh,
	Int16BufferAttribute,
	Int32BufferAttribute,
	Int8BufferAttribute,
	LOD,
	LatheGeometry,
	Layers,
	Light,
	LightProbe,
	LightShadow,
	Line,
	LineBasicMaterial,
	LineBasicMaterialParameters,
	LineDashedMaterial,
	LineDashedMaterialParameters,
	LineLoop,
	LineSegments,
	Material,
	Matrix3,
	Matrix4,
	Mesh,
	MeshBasicMaterial,
	MeshBasicMaterialParameters,
	MeshDepthMaterial,
	MeshDepthMaterialParameters,
	MeshDistanceMaterial,
	MeshDistanceMaterialParameters,
	MeshLambertMaterial,
	MeshLambertMaterialParameters,
	MeshMatcapMaterial,
	MeshMatcapMaterialParameters,
	MeshNormalMaterial,
	MeshNormalMaterialParameters,
	MeshPhongMaterial,
	MeshPhongMaterialParameters,
	MeshPhysicalMaterial,
	MeshPhysicalMaterialParameters,
	MeshStandardMaterial,
	MeshStandardMaterialParameters,
	MeshToonMaterial,
	MeshToonMaterialParameters,
	Object3D,
	OctahedronGeometry,
	OrthographicCamera,
	PerspectiveCamera,
	PlaneGeometry,
	PlaneHelper,
	PointLight,
	PointLightHelper,
	Points,
	PointsMaterial,
	PointsMaterialParameters,
	PolarGridHelper,
	PolyhedronGeometry,
	PositionalAudio,
	Quaternion,
	RawShaderMaterial,
	Raycaster,
	RectAreaLight,
	RingGeometry,
	Scene,
	ShaderMaterial,
	ShaderMaterialParameters,
	ShadowMaterial,
	Shape,
	ShapeGeometry,
	Skeleton,
	SkeletonHelper,
	SkinnedMesh,
	SphereGeometry,
	SpotLight,
	SpotLightHelper,
	SpotLightShadow,
	Sprite,
	SpriteMaterial,
	SpriteMaterialParameters,
	TetrahedronGeometry,
	Texture,
	TorusGeometry,
	TorusKnotGeometry,
	TubeGeometry,
	Uint16BufferAttribute,
	Uint32BufferAttribute,
	Uint8BufferAttribute,
	Vector2,
	Vector3,
	Vector4,
	VideoTexture,
	WireframeGeometry,
} from 'three';
import { NgtEventHandlers } from './events';
import { NgtAfterAttach, NgtAttachFunction, NgtInstanceNode } from './instance';
import { NgtBeforeRenderEvent } from './store';

type NoEvent<T> = Omit<T, 'addEventListener' | 'removeEventListener'>;

export type NgtNonFunctionKeys<T> = { [K in keyof T]-?: T[K] extends Function ? never : K }[keyof T];
export type NgtOverwrite<T, O> = Omit<T, NgtNonFunctionKeys<O>> & O;

export type NgtExtendedColors<T> = {
	[K in keyof T]: T[K] extends Color | undefined ? ColorRepresentation : T[K];
};

/**
 * If **T** contains a constructor, @see ConstructorParameters must be used, otherwise **T**.
 */
type NgtArguments<T> = T extends new (...args: any) => any ? ConstructorParameters<T> : T;

export type NgtEuler = Euler | Parameters<Euler['set']>;
export type NgtMatrix4 = Matrix4 | Parameters<Matrix4['set']> | Readonly<Matrix4['set']>;

/**
 * Turn an implementation of Vector in to the type that an r3f component would accept as a prop.
 */
type NgtVectorLike<VectorClass extends Vector2 | Vector3 | Vector4> =
	| VectorClass
	| Parameters<VectorClass['set']>
	| Readonly<Parameters<VectorClass['set']>>
	| Parameters<VectorClass['setScalar']>[0];

export type NgtVector2 = NgtVectorLike<Vector2>;
export type NgtVector3 = NgtVectorLike<Vector3>;
export type NgtVector4 = NgtVectorLike<Vector4>;
export type NgtLayers = Layers | Parameters<Layers['set']>[0];
export type NgtQuaternion = Quaternion | Parameters<Quaternion['set']>;

export interface NgtNodeEventMap<TOriginal> {
	afterAttach: NgtAfterAttach<NgtInstanceNode, TOriginal>;
	afterUpdate: TOriginal;
	beforeRender: NgtBeforeRenderEvent<TOriginal>;
}

export type NgtNodeElement<TOriginal, TConstructor> = {
	attach: string | string[] | NgtAttachFunction;
	// ref: NgtInjectedRef<TOriginal>;
	addEventListener<TEventKey extends keyof NgtNodeEventMap<TOriginal>>(
		type: TEventKey,
		listener: (this: NgtNodeElement<TOriginal, TConstructor>, ev: NgtNodeEventMap<TOriginal>[TEventKey]) => any,
	): void;
	removeEventListener<TEventKey extends keyof NgtNodeEventMap<TOriginal>>(
		type: TEventKey,
		listener: (this: NgtNodeElement<TOriginal, TConstructor>, ev: NgtNodeEventMap<TOriginal>[TEventKey]) => any,
	): void;
	__ngt_args__: NgtArguments<TConstructor>;
};

export type NgtNode<TOriginal, TConstructor, TNoEvent = NoEvent<TOriginal>> = NgtExtendedColors<
	NgtOverwrite<Partial<TNoEvent>, NgtNodeElement<TOriginal, TConstructor>>
>;

export type NgtObject3DEventsMap = {
	[TEvent in keyof NgtEventHandlers]-?: Parameters<NonNullable<NgtEventHandlers[TEvent]>>[0];
};

export type NgtObject3DNode<TOriginal, TConstructor, TNoEvent = NoEvent<TOriginal>> = NgtOverwrite<
	NgtNode<TOriginal, TConstructor, TNoEvent>,
	{
		position: NgtVector3;
		up: NgtVector3;
		scale: NgtVector3;
		rotation: NgtEuler;
		matrix: NgtMatrix4;
		quaternion: NgtQuaternion;
		layers: NgtLayers;
		dispose: (() => void) | null;
		addEventListener<TEventKey extends keyof NgtObject3DEventsMap>(
			type: TEventKey,
			listener: (this: NgtObject3DNode<TOriginal, TConstructor>, ev: NgtObject3DEventsMap[TEventKey]) => any,
		): void;
		removeEventListener<TEventKey extends keyof NgtObject3DEventsMap>(
			type: TEventKey,
			listener: (this: NgtObject3DNode<TOriginal, TConstructor>, ev: NgtObject3DEventsMap[TEventKey]) => any,
		): void;
	}
>;

export type NgtGeometry<TGeometry extends BufferGeometry, TConstructor> = NgtNode<TGeometry, TConstructor>;
export type NgtMaterial<TMaterial extends Material, TConstructor> = NgtNode<TMaterial, TConstructor>;
export type NgtLight<T extends Light, P> = NgtObject3DNode<T, P>;

export type NgtObject3D = NgtObject3DNode<Object3D, typeof Object3D>;
export type NgtAudio = NgtObject3DNode<Audio, typeof Audio>;
export type NgtAudioListener = NgtObject3DNode<AudioListener, typeof AudioListener>;
export type NgtPositionalAudio = NgtObject3DNode<PositionalAudio, typeof PositionalAudio>;

export type NgtMesh = NgtObject3DNode<Mesh, typeof Mesh>;
export type NgtInstancedMesh = NgtObject3DNode<InstancedMesh, typeof InstancedMesh>;
export type NgtScene = NgtObject3DNode<Scene, typeof Scene>;
export type NgtSprite = NgtObject3DNode<Sprite, typeof Sprite>;
export type NgtLOD = NgtObject3DNode<LOD, typeof LOD>;
export type NgtSkinnedMesh = NgtObject3DNode<SkinnedMesh, typeof SkinnedMesh>;

export type NgtSkeleton = NgtObject3DNode<Skeleton, typeof Skeleton>;
export type NgtBone = NgtObject3DNode<Bone, typeof Bone>;
export type NgtLine = NgtObject3DNode<Line, typeof Line>;
export type NgtLineSegments = NgtObject3DNode<LineSegments, typeof LineSegments>;
export type NgtLineLoop = NgtObject3DNode<LineLoop, typeof LineLoop>;
export type NgtPoints = NgtObject3DNode<Points, typeof Points>;
export type NgtGroup = NgtObject3DNode<Group, typeof Group>;

export type NgtCameraNode = NgtObject3DNode<Camera, typeof Camera>;
export type NgtPerspectiveCamera = NgtObject3DNode<PerspectiveCamera, typeof PerspectiveCamera>;
export type NgtOrthographicCamera = NgtObject3DNode<OrthographicCamera, typeof OrthographicCamera>;
export type NgtCubeCamera = NgtObject3DNode<CubeCamera, typeof CubeCamera>;
export type NgtArrayCamera = NgtObject3DNode<ArrayCamera, typeof ArrayCamera>;

export type NgtInstancedBufferGeometry = NgtGeometry<InstancedBufferGeometry, typeof InstancedBufferGeometry>;
export type NgtBufferGeometry = NgtGeometry<BufferGeometry, typeof BufferGeometry>;
export type NgtWireframeGeometry = NgtGeometry<WireframeGeometry, typeof WireframeGeometry>;
export type NgtTetrahedronGeometry = NgtGeometry<TetrahedronGeometry, typeof TetrahedronGeometry>;
export type NgtOctahedronGeometry = NgtGeometry<OctahedronGeometry, typeof OctahedronGeometry>;
export type NgtIcosahedronGeometry = NgtGeometry<IcosahedronGeometry, typeof IcosahedronGeometry>;
export type NgtDodecahedronGeometry = NgtGeometry<DodecahedronGeometry, typeof DodecahedronGeometry>;
export type NgtPolyhedronGeometry = NgtGeometry<PolyhedronGeometry, typeof PolyhedronGeometry>;
export type NgtTubeGeometry = NgtGeometry<TubeGeometry, typeof TubeGeometry>;
export type NgtTorusKnotGeometry = NgtGeometry<TorusKnotGeometry, typeof TorusKnotGeometry>;
export type NgtTorusGeometry = NgtGeometry<TorusGeometry, typeof TorusGeometry>;
export type NgtSphereGeometry = NgtGeometry<SphereGeometry, typeof SphereGeometry>;
export type NgtRingGeometry = NgtGeometry<RingGeometry, typeof RingGeometry>;
export type NgtPlaneGeometry = NgtGeometry<PlaneGeometry, typeof PlaneGeometry>;
export type NgtLatheGeometry = NgtGeometry<LatheGeometry, typeof LatheGeometry>;
export type NgtShapeGeometry = NgtGeometry<ShapeGeometry, typeof ShapeGeometry>;
export type NgtExtrudeGeometry = NgtGeometry<ExtrudeGeometry, typeof ExtrudeGeometry>;
export type NgtEdgesGeometry = NgtGeometry<EdgesGeometry, typeof EdgesGeometry>;
export type NgtConeGeometry = NgtGeometry<ConeGeometry, typeof ConeGeometry>;
export type NgtCylinderGeometry = NgtGeometry<CylinderGeometry, typeof CylinderGeometry>;
export type NgtCircleGeometry = NgtGeometry<CircleGeometry, typeof CircleGeometry>;
export type NgtBoxGeometry = NgtGeometry<BoxGeometry, typeof BoxGeometry>;
export type NgtCapsuleGeometry = NgtGeometry<CapsuleGeometry, typeof CapsuleGeometry>;

export type NgtShadowMaterial = NgtMaterial<ShadowMaterial, [ShaderMaterialParameters]>;
export type NgtSpriteMaterial = NgtMaterial<SpriteMaterial, [SpriteMaterialParameters]>;
export type NgtRawShaderMaterial = NgtMaterial<RawShaderMaterial, [ShaderMaterialParameters]>;
export type NgtShaderMaterial = NgtMaterial<ShaderMaterial, [ShaderMaterialParameters]>;
export type NgtPointsMaterial = NgtMaterial<PointsMaterial, [PointsMaterialParameters]>;
export type NgtMeshPhysicalMaterial = NgtMaterial<MeshPhysicalMaterial, [MeshPhysicalMaterialParameters]>;
export type NgtMeshStandardMaterial = NgtMaterial<MeshStandardMaterial, [MeshStandardMaterialParameters]>;
export type NgtMeshPhongMaterial = NgtMaterial<MeshPhongMaterial, [MeshPhongMaterialParameters]>;
export type NgtMeshToonMaterial = NgtMaterial<MeshToonMaterial, [MeshToonMaterialParameters]>;
export type NgtMeshNormalMaterial = NgtMaterial<MeshNormalMaterial, [MeshNormalMaterialParameters]>;
export type NgtMeshLambertMaterial = NgtMaterial<MeshLambertMaterial, [MeshLambertMaterialParameters]>;
export type NgtMeshDepthMaterial = NgtMaterial<MeshDepthMaterial, [MeshDepthMaterialParameters]>;
export type NgtMeshDistanceMaterial = NgtMaterial<MeshDistanceMaterial, [MeshDistanceMaterialParameters]>;
export type NgtMeshBasicMaterial = NgtMaterial<MeshBasicMaterial, [MeshBasicMaterialParameters]>;
export type NgtMeshMatcapMaterial = NgtMaterial<MeshMatcapMaterial, [MeshMatcapMaterialParameters]>;
export type NgtLineDashedMaterial = NgtMaterial<LineDashedMaterial, [LineDashedMaterialParameters]>;
export type NgtLineBasicMaterial = NgtMaterial<LineBasicMaterial, [LineBasicMaterialParameters]>;

export type NgtPrimitive = NgtNodeElement<any, any>;
export type NgtValue = NgtNode<{ rawValue: any }, {}>;

export type NgtLightShadow = NgtNode<LightShadow, typeof LightShadow>;
export type NgtSpotLightShadow = NgtNode<SpotLightShadow, typeof SpotLightShadow>;
export type NgtDirectionalLightShadow = NgtNode<DirectionalLightShadow, typeof DirectionalLightShadow>;

export type NgtSpotLight = NgtLight<SpotLight, typeof SpotLight>;
export type NgtPointLight = NgtLight<PointLight, typeof PointLight>;
export type NgtRectAreaLight = NgtLight<RectAreaLight, typeof RectAreaLight>;
export type NgtHemisphereLight = NgtLight<HemisphereLight, typeof HemisphereLight>;
export type NgtDirectionalLight = NgtLight<DirectionalLight, typeof DirectionalLight>;
export type NgtAmbientLight = NgtLight<AmbientLight, typeof AmbientLight>;
export type NgtLightProbe = NgtLight<LightProbe, typeof LightProbe>;

export type NgtSpotLightHelper = NgtObject3DNode<SpotLightHelper, typeof SpotLightHelper>;
export type NgtSkeletonHelper = NgtObject3DNode<SkeletonHelper, typeof SkeletonHelper>;
export type NgtPointLightHelper = NgtObject3DNode<PointLightHelper, typeof PointLightHelper>;
export type NgtHemisphereLightHelper = NgtObject3DNode<HemisphereLightHelper, typeof HemisphereLightHelper>;
export type NgtGridHelper = NgtObject3DNode<GridHelper, typeof GridHelper>;
export type NgtPolarGridHelper = NgtObject3DNode<PolarGridHelper, typeof PolarGridHelper>;
export type NgtDirectionalLightHelper = NgtObject3DNode<DirectionalLightHelper, typeof DirectionalLightHelper>;
export type NgtCameraHelper = NgtObject3DNode<CameraHelper, typeof CameraHelper>;
export type NgtBoxHelper = NgtObject3DNode<BoxHelper, typeof BoxHelper>;
export type NgtBox3Helper = NgtObject3DNode<Box3Helper, typeof Box3Helper>;
export type NgtPlaneHelper = NgtObject3DNode<PlaneHelper, typeof PlaneHelper>;
export type NgtArrowHelper = NgtObject3DNode<ArrowHelper, typeof ArrowHelper>;
export type NgtAxesHelper = NgtObject3DNode<AxesHelper, typeof AxesHelper>;

export type NgtTexture = NgtNode<Texture, typeof Texture>;
export type NgtVideoTexture = NgtNode<VideoTexture, typeof VideoTexture>;
export type NgtDataTexture = NgtNode<DataTexture, typeof DataTexture>;
export type NgtData3DTexture = NgtNode<Data3DTexture, typeof Data3DTexture>;
export type NgtCompressedTexture = NgtNode<CompressedTexture, typeof CompressedTexture>;
export type NgtCubeTexture = NgtNode<CubeTexture, typeof CubeTexture>;
export type NgtCanvasTexture = NgtNode<CanvasTexture, typeof CanvasTexture>;
export type NgtDepthTexture = NgtNode<DepthTexture, typeof DepthTexture>;

export type NgtRaycaster = NgtNode<Raycaster, typeof Raycaster>;
export type NgtVector2Node = NgtNode<Vector2, typeof Vector2>;
export type NgtVector3Node = NgtNode<Vector3, typeof Vector3>;
export type NgtVector4Node = NgtNode<Vector4, typeof Vector4>;
export type NgtEulerNode = NgtNode<Euler, typeof Euler>;
export type NgtMatrix3Node = NgtNode<Matrix3, typeof Matrix3>;
export type NgtMatrix4Node = NgtNode<Matrix4, typeof Matrix4>;
export type NgtQuaternionNode = NgtNode<Quaternion, typeof Quaternion>;
export type NgtBufferAttribute = NgtNode<BufferAttribute, typeof BufferAttribute>;
export type NgtFloat16BufferAttribute = NgtNode<Float16BufferAttribute, typeof Float16BufferAttribute>;
export type NgtFloat32BufferAttribute = NgtNode<Float32BufferAttribute, typeof Float32BufferAttribute>;
export type NgtInt8BufferAttribute = NgtNode<Int8BufferAttribute, typeof Int8BufferAttribute>;
export type NgtInt16BufferAttribute = NgtNode<Int16BufferAttribute, typeof Int16BufferAttribute>;
export type NgtInt32BufferAttribute = NgtNode<Int32BufferAttribute, typeof Int32BufferAttribute>;
export type NgtUint8BufferAttribute = NgtNode<Uint8BufferAttribute, typeof Uint8BufferAttribute>;
export type NgtUint16BufferAttribute = NgtNode<Uint16BufferAttribute, typeof Uint16BufferAttribute>;
export type NgtUint32BufferAttribute = NgtNode<Uint32BufferAttribute, typeof Uint32BufferAttribute>;
export type NgtInstancedBufferAttribute = NgtNode<InstancedBufferAttribute, typeof InstancedBufferAttribute>;
export type NgtColor = NgtNode<Color, ColorRepresentation>;
export type NgtFog = NgtNode<Fog, typeof Fog>;
export type NgtFogExp2 = NgtNode<FogExp2, typeof FogExp2>;
export type NgtShape = NgtNode<Shape, typeof Shape>;

export interface ThreeElements {
	'ngt-object3D': NgtObject3D;

	// `audio` works but conflicts with @types/react. Try using PositionalAudio from @react-three/drei instead
	'ngt-audio': NgtAudio;
	'ngt-audio-listener': NgtAudioListener;
	'ngt-positional-audio': NgtPositionalAudio;

	'ngt-mesh': NgtMesh;
	'ngt-instanced-mesh': NgtInstancedMesh;
	'ngt-scene': NgtScene;
	'ngt-sprite': NgtSprite;
	'ngt-lOD': NgtLOD;
	'ngt-skinned-mesh': NgtSkinnedMesh;
	'ngt-skeleton': NgtSkeleton;
	'ngt-bone': NgtBone;

	'ngt-line': NgtLine;
	'ngt-line-segments': NgtLineSegments;
	'ngt-line-loop': NgtLineLoop;
	'ngt-points': NgtPoints;
	'ngt-group': NgtGroup;

	// cameras
	'ngt-camera': NgtCameraNode;
	'ngt-perspective-camera': NgtPerspectiveCamera;
	'ngt-orthographic-camera': NgtOrthographicCamera;
	'ngt-cube-camera': NgtCubeCamera;
	'ngt-array-camera': NgtArrayCamera;

	// geometry
	'ngt-instanced-buffer-geometry': NgtInstancedBufferGeometry;
	'ngt-buffer-geometry': NgtBufferGeometry;
	'ngt-wireframe-geometry': NgtWireframeGeometry;
	'ngt-tetrahedron-geometry': NgtTetrahedronGeometry;
	'ngt-octahedron-geometry': NgtOctahedronGeometry;
	'ngt-icosahedron-geometry': NgtIcosahedronGeometry;
	'ngt-polyhedron-geometry': NgtPolyhedronGeometry;
	'ngt-dodecahedron-geometry': NgtDodecahedronGeometry;
	'ngt-tube-geometry': NgtTubeGeometry;
	'ngt-torus-knot-geometry': NgtTorusKnotGeometry;
	'ngt-torus-geometry': NgtTorusGeometry;
	'ngt-sphere-geometry': NgtSphereGeometry;
	'ngt-ring-geometry': NgtRingGeometry;
	'ngt-plane-geometry': NgtPlaneGeometry;
	'ngt-lathe-geometry': NgtLatheGeometry;
	'ngt-shape-geometry': NgtShapeGeometry;
	'ngt-extrude-geometry': NgtExtrudeGeometry;
	'ngt-edges-geometry': NgtEdgesGeometry;
	'ngt-cone-geometry': NgtConeGeometry;
	'ngt-cylinder-geometry': NgtCylinderGeometry;
	'ngt-circle-geometry': NgtCircleGeometry;
	'ngt-box-geometry': NgtBoxGeometry;
	'ngt-capsule-geometry': NgtCapsuleGeometry;

	// materials
	'ngt-shadow-material': NgtShadowMaterial;
	'ngt-sprite-material': NgtSpriteMaterial;
	'ngt-raw-shader-material': NgtRawShaderMaterial;
	'ngt-shader-material': NgtShaderMaterial;
	'ngt-points-material': NgtPointsMaterial;
	'ngt-mesh-physical-material': NgtMeshPhysicalMaterial;
	'ngt-mesh-standard-material': NgtMeshStandardMaterial;
	'ngt-mesh-phong-material': NgtMeshPhongMaterial;
	'ngt-mesh-toon-material': NgtMeshToonMaterial;
	'ngt-mesh-normal-material': NgtMeshNormalMaterial;
	'ngt-mesh-lambert-material': NgtMeshLambertMaterial;
	'ngt-mesh-depth-material': NgtMeshDepthMaterial;
	'ngt-mesh-distance-material': NgtMeshDistanceMaterial;
	'ngt-mesh-basic-material': NgtMeshBasicMaterial;
	'ngt-mesh-matcap-material': NgtMeshMatcapMaterial;
	'ngt-line-dashed-material': NgtLineDashedMaterial;
	'ngt-line-basic-material': NgtLineBasicMaterial;

	// primitive
	'ngt-primitive': NgtPrimitive;

	// rawValue
	'ngt-value': NgtValue;

	// lights and other
	'ngt-spot-light-shadow': NgtSpotLightShadow;
	'ngt-spot-light': NgtSpotLight;
	'ngt-point-light': NgtPointLight;
	'ngt-rect-area-light': NgtRectAreaLight;
	'ngt-hemisphere-light': NgtHemisphereLight;
	'ngt-directional-light-shadow': NgtDirectionalLightShadow;
	'ngt-directional-light': NgtDirectionalLight;
	'ngt-ambient-light': NgtAmbientLight;
	'ngt-light-shadow': NgtLightShadow;
	'ngt-light-probe': NgtLightProbe;

	// helpers
	'ngt-spot-light-helper': NgtSpotLightHelper;
	'ngt-skeleton-helper': NgtSkeletonHelper;
	'ngt-point-light-helper': NgtPointLightHelper;
	'ngt-hemisphere-light-helper': NgtHemisphereLightHelper;
	'ngt-grid-helper': NgtGridHelper;
	'ngt-polar-grid-helper': NgtPolarGridHelper;
	'ngt-directional-light-helper': NgtDirectionalLightHelper;
	'ngt-camera-helper': NgtCameraHelper;
	'ngt-box-helper': NgtBoxHelper;
	'ngt-box3-helper': NgtBox3Helper;
	'ngt-plane-helper': NgtPlaneHelper;
	'ngt-arrow-helper': NgtArrowHelper;
	'ngt-axes-helper': NgtAxesHelper;

	// textures
	'ngt-texture': NgtTexture;
	'ngt-video-texture': NgtVideoTexture;
	'ngt-data-texture': NgtDataTexture;
	'ngt-data3D-texture': NgtData3DTexture;
	'ngt-compressed-texture': NgtCompressedTexture;
	'ngt-cube-texture': NgtCubeTexture;
	'ngt-canvas-texture': NgtCanvasTexture;
	'ngt-depth-texture': NgtDepthTexture;

	// misc
	'ngt-raycaster': NgtRaycaster;
	'ngt-vector2': NgtVector2Node;
	'ngt-vector3': NgtVector3Node;
	'ngt-vector4': NgtVector4Node;
	'ngt-euler': NgtEulerNode;
	'ngt-matrix3': NgtMatrix3Node;
	'ngt-matrix4': NgtMatrix4Node;
	'ngt-quaternion': NgtQuaternionNode;
	'ngt-buffer-attribute': NgtBufferAttribute;
	'ngt-float16-buffer-attribute': NgtFloat16BufferAttribute;
	'ngt-float32-buffer-attribute': NgtFloat32BufferAttribute;
	'ngt-int8-buffer-attribute': NgtInt8BufferAttribute;
	'ngt-int16-buffer-attribute': NgtInt16BufferAttribute;
	'ngt-int32-buffer-attribute': NgtInt32BufferAttribute;
	'ngt-unit8-buffer-attribute': NgtUint8BufferAttribute;
	'ngt-unit16-buffer-attribute': NgtUint16BufferAttribute;
	'ngt-unit32-buffer-attribute': NgtUint32BufferAttribute;
	'ngt-instanced-buffer-attribute': NgtInstancedBufferAttribute;
	'ngt-color': NgtColor;
	'ngt-fog': NgtFog;
	'ngt-fog-exp2': NgtFogExp2;
	'ngt-shape': NgtShape;
}

declare global {
	interface HTMLElementTagNameMap extends ThreeElements {}
}
