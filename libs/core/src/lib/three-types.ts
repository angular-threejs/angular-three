import {
	AmbientLight,
	ArrayCamera,
	ArrowHelper,
	Audio,
	AxesHelper,
	BatchedMesh,
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
import { NgtAfterAttach, NgtAttachFunction, NgtBeforeRenderEvent, NgtEventHandlers, NgtInstanceNode } from './types';

type Expand<T> = T extends infer O ? { [K in keyof O]: O[K] } : never;
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

export type ThreeDisposeEvent = { type: 'dispose'; target: NgtInstanceNode };
export type ThreeAddedEvent = { type: 'added'; target: NgtInstanceNode };
export type ThreeRemovedEvent = { type: 'removed'; target: NgtInstanceNode };
export type ThreeChildAddedEvent = { type: 'childadded'; target: NgtInstanceNode; child: NgtInstanceNode };
export type ThreeChildRemovedEvent = { type: 'childremoved'; target: NgtInstanceNode; child: NgtInstanceNode };

export interface NgtNodeEventMap<TOriginal> {
	attached: NgtAfterAttach<NgtInstanceNode, TOriginal>;
	updated: TOriginal;
	beforeRender: NgtBeforeRenderEvent<TOriginal>;
	// NOTE: this is named "disposed" to differentiate it from [dispose] property.
	disposed: ThreeDisposeEvent;
}

export type NgtNodeElement<TOriginal, TConstructor> = {
	attach: string | string[] | NgtAttachFunction;
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

export type NgtNode<TOriginal, TConstructor, TNoEvent = NoEvent<TOriginal>> = Expand<
	NgtExtendedColors<NgtOverwrite<Partial<TNoEvent>, NgtNodeElement<TOriginal, TConstructor>>>
>;

export type NgtObject3DEventsMap = {
	[TEvent in keyof NgtEventHandlers]-?: Parameters<NonNullable<NgtEventHandlers[TEvent]>>[0];
} & {
	added: ThreeAddedEvent;
	removed: ThreeRemovedEvent;
	childadded: ThreeChildAddedEvent;
	childremoved: ThreeChildRemovedEvent;
};

export type NgtAllObject3DEventsMap = NgtObject3DEventsMap & NgtNodeEventMap<NgtInstanceNode>;

export type NgtObject3DNode<TOriginal, TConstructor, TNoEvent = NoEvent<TOriginal>> = Expand<
	NgtOverwrite<
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
			raycast: Object3D['raycast'] | null;
			addEventListener<TEventKey extends keyof NgtAllObject3DEventsMap>(
				type: TEventKey,
				listener: (this: NgtObject3DNode<TOriginal, TConstructor>, ev: NgtAllObject3DEventsMap[TEventKey]) => any,
			): void;
			removeEventListener<TEventKey extends keyof NgtAllObject3DEventsMap>(
				type: TEventKey,
				listener: (this: NgtObject3DNode<TOriginal, TConstructor>, ev: NgtAllObject3DEventsMap[TEventKey]) => any,
			): void;
		}
	>
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
export type NgtBatchedMesh = NgtObject3DNode<BatchedMesh, typeof BatchedMesh>;
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
	/**
	 * @from node_modules/@types/three/src/core/Object3D.d.ts
	 */
	'ngt-object3D': NgtObject3D;

	/**
	 * @from node_modules/@types/three/src/audio/Audio.d.ts
	 */
	'ngt-audio': NgtAudio;
	/**
	 * @from node_modules/@types/three/src/audio/AudioListener.d.ts
	 */
	'ngt-audio-listener': NgtAudioListener;
	/**
	 * @from node_modules/@types/three/src/audio/PositionalAudio.d.ts
	 */
	'ngt-positional-audio': NgtPositionalAudio;

	/**
	 * @from node_modules/@types/three/src/objects/Mesh.d.ts
	 */
	'ngt-mesh': NgtMesh;
	/**
	 * @from node_modules/@types/three/src/objects/InstancedMesh.d.ts
	 */
	'ngt-instanced-mesh': NgtInstancedMesh;
	/**
	 * @from node_modules/@types/three/src/scenes/Scene.d.ts
	 */
	'ngt-scene': NgtScene;
	/**
	 * @from node_modules/@types/three/src/objects/Sprite.d.ts
	 */
	'ngt-sprite': NgtSprite;
	/**
	 * @from node_modules/@types/three/src/objects/LOD.d.ts
	 */
	'ngt-lOD': NgtLOD;
	/**
	 * @from node_modules/@types/three/src/objects/SkinnedMesh.d.ts
	 */
	'ngt-skinned-mesh': NgtSkinnedMesh;
	/**
	 * @from node_modules/@types/three/src/objects/Skeleton.d.ts
	 */
	'ngt-skeleton': NgtSkeleton;
	/**
	 * @from node_modules/@types/three/src/objects/Bone.d.ts
	 */
	'ngt-bone': NgtBone;

	/**
	 * @from node_modules/@types/three/src/objects/Line.d.ts
	 */
	'ngt-line': NgtLine;
	/**
	 * @from node_modules/@types/three/src/objects/LineSegments.d.ts
	 */
	'ngt-line-segments': NgtLineSegments;
	/**
	 * @from node_modules/@types/three/src/objects/LineLoop.d.ts
	 */
	'ngt-line-loop': NgtLineLoop;
	/**
	 * @from node_modules/@types/three/src/objects/Points.d.ts
	 */
	'ngt-points': NgtPoints;
	/**
	 * @from node_modules/@types/three/src/objects/Group.d.ts
	 */
	'ngt-group': NgtGroup;

	// cameras
	/**
	 * @from node_modules/@types/three/src/cameras/Camera.d.ts
	 */
	'ngt-camera': NgtCameraNode;
	/**
	 * @from node_modules/@types/three/src/cameras/PerspectiveCamera.d.ts
	 */
	'ngt-perspective-camera': NgtPerspectiveCamera;
	/**
	 * @from node_modules/@types/three/src/cameras/OrthographicCamera.d.ts
	 */
	'ngt-orthographic-camera': NgtOrthographicCamera;
	/**
	 * @from node_modules/@types/three/src/cameras/CubeCamera.d.ts
	 */
	'ngt-cube-camera': NgtCubeCamera;
	/**
	 * @from node_modules/@types/three/src/cameras/ArrayCamera.d.ts
	 */
	'ngt-array-camera': NgtArrayCamera;

	// geometry
	/**
	 * @from node_modules/@types/three/src/core/InstancedBufferGeometry.d.ts
	 */
	'ngt-instanced-buffer-geometry': NgtInstancedBufferGeometry;
	/**
	 * @from node_modules/@types/three/src/core/BufferGeometry.d.ts
	 */
	'ngt-buffer-geometry': NgtBufferGeometry;
	/**
	 * @from node_modules/@types/three/src/geometries/WireframeGeometry.d.ts
	 */
	'ngt-wireframe-geometry': NgtWireframeGeometry;
	/**
	 * @from node_modules/@types/three/src/geometries/TetrahedronGeometry.d.ts
	 */
	'ngt-tetrahedron-geometry': NgtTetrahedronGeometry;
	/**
	 * @from node_modules/@types/three/src/geometries/OctahedronGeometry.d.ts
	 */
	'ngt-octahedron-geometry': NgtOctahedronGeometry;
	/**
	 * @from node_modules/@types/three/src/geometries/IcosahedronGeometry.d.ts
	 */
	'ngt-icosahedron-geometry': NgtIcosahedronGeometry;
	/**
	 * @from node_modules/@types/three/src/geometries/PolyhedronGeometry.d.ts
	 */
	'ngt-polyhedron-geometry': NgtPolyhedronGeometry;
	/**
	 * @from node_modules/@types/three/src/geometries/DodecahedronGeometry.d.ts
	 */
	'ngt-dodecahedron-geometry': NgtDodecahedronGeometry;
	/**
	 * @from node_modules/@types/three/src/geometries/TubeGeometry.d.ts
	 */
	'ngt-tube-geometry': NgtTubeGeometry;
	/**
	 * @from node_modules/@types/three/src/geometries/TorusKnotGeometry.d.ts
	 */
	'ngt-torus-knot-geometry': NgtTorusKnotGeometry;
	/**
	 * @from node_modules/@types/three/src/geometries/TorusGeometry.d.ts
	 */
	'ngt-torus-geometry': NgtTorusGeometry;
	/**
	 * @from node_modules/@types/three/src/geometries/SphereGeometry.d.ts
	 */
	'ngt-sphere-geometry': NgtSphereGeometry;
	/**
	 * @from node_modules/@types/three/src/geometries/RingGeometry.d.ts
	 */
	'ngt-ring-geometry': NgtRingGeometry;
	/**
	 * @from node_modules/@types/three/src/geometries/PlaneGeometry.d.ts
	 */
	'ngt-plane-geometry': NgtPlaneGeometry;
	/**
	 * @from node_modules/@types/three/src/geometries/LatheGeometry.d.ts
	 */
	'ngt-lathe-geometry': NgtLatheGeometry;
	/**
	 * @from node_modules/@types/three/src/geometries/ShapeGeometry.d.ts
	 */
	'ngt-shape-geometry': NgtShapeGeometry;
	/**
	 * @from node_modules/@types/three/src/geometries/ExtrudeGeometry.d.ts
	 */
	'ngt-extrude-geometry': NgtExtrudeGeometry;
	/**
	 * @from node_modules/@types/three/src/geometries/EdgesGeometry.d.ts
	 */
	'ngt-edges-geometry': NgtEdgesGeometry;
	/**
	 * @from node_modules/@types/three/src/geometries/ConeGeometry.d.ts
	 */
	'ngt-cone-geometry': NgtConeGeometry;
	/**
	 * @from node_modules/@types/three/src/geometries/CylinderGeometry.d.ts
	 */
	'ngt-cylinder-geometry': NgtCylinderGeometry;
	/**
	 * @from node_modules/@types/three/src/geometries/CircleGeometry.d.ts
	 */
	'ngt-circle-geometry': NgtCircleGeometry;
	/**
	 * @from node_modules/@types/three/src/geometries/BoxGeometry.d.ts
	 */
	'ngt-box-geometry': NgtBoxGeometry;
	/**
	 * @from node_modules/@types/three/src/geometries/CapsuleGeometry.d.ts
	 */
	'ngt-capsule-geometry': NgtCapsuleGeometry;

	// materials
	/**
	 * @from node_modules/@types/three/src/materials/ShadowMaterial.d.ts
	 */
	'ngt-shadow-material': NgtShadowMaterial;
	/**
	 * @from node_modules/@types/three/src/materials/SpriteMaterial.d.ts
	 */
	'ngt-sprite-material': NgtSpriteMaterial;
	/**
	 * @from node_modules/@types/three/src/materials/RawShaderMaterial.d.ts
	 */
	'ngt-raw-shader-material': NgtRawShaderMaterial;
	/**
	 * @from node_modules/@types/three/src/materials/ShaderMaterial.d.ts
	 */
	'ngt-shader-material': NgtShaderMaterial;
	/**
	 * @from node_modules/@types/three/src/materials/PointsMaterial.d.ts
	 */
	'ngt-points-material': NgtPointsMaterial;
	/**
	 * @from node_modules/@types/three/src/materials/MeshPhysicalMaterial.d.ts
	 */
	'ngt-mesh-physical-material': NgtMeshPhysicalMaterial;
	/**
	 * @from node_modules/@types/three/src/materials/MeshStandardMaterial.d.ts
	 */
	'ngt-mesh-standard-material': NgtMeshStandardMaterial;
	/**
	 * @from node_modules/@types/three/src/materials/MeshPhongMaterial.d.ts
	 */
	'ngt-mesh-phong-material': NgtMeshPhongMaterial;
	/**
	 * @from node_modules/@types/three/src/materials/MeshToonMaterial.d.ts
	 */
	'ngt-mesh-toon-material': NgtMeshToonMaterial;
	/**
	 * @from node_modules/@types/three/src/materials/MeshNormalMaterial.d.ts
	 */
	'ngt-mesh-normal-material': NgtMeshNormalMaterial;
	/**
	 * @from node_modules/@types/three/src/materials/MeshLambertMaterial.d.ts
	 */
	'ngt-mesh-lambert-material': NgtMeshLambertMaterial;
	/**
	 * @from node_modules/@types/three/src/materials/MeshDepthMaterial.d.ts
	 */
	'ngt-mesh-depth-material': NgtMeshDepthMaterial;
	/**
	 * @from node_modules/@types/three/src/materials/MeshDistanceMaterial.d.ts
	 */
	'ngt-mesh-distance-material': NgtMeshDistanceMaterial;
	/**
	 * @from node_modules/@types/three/src/materials/MeshBasicMaterial.d.ts
	 */
	'ngt-mesh-basic-material': NgtMeshBasicMaterial;
	/**
	 * @from node_modules/@types/three/src/materials/MeshMatcapMaterial.d.ts
	 */
	'ngt-mesh-matcap-material': NgtMeshMatcapMaterial;
	/**
	 * @from node_modules/@types/three/src/materials/LineDashedMaterial.d.ts
	 */
	'ngt-line-dashed-material': NgtLineDashedMaterial;
	/**
	 * @from node_modules/@types/three/src/materials/LineBasicMaterial.d.ts
	 */
	'ngt-line-basic-material': NgtLineBasicMaterial;

	// primitive
	'ngt-primitive': NgtPrimitive;

	// rawValue
	'ngt-value': NgtValue;

	// lights and other
	/**
	 * @from node_modules/@types/three/src/lights/SpotLightShadow.d.ts
	 */
	'ngt-spot-light-shadow': NgtSpotLightShadow;
	/**
	 * @from node_modules/@types/three/src/lights/SpotLight.d.ts
	 */
	'ngt-spot-light': NgtSpotLight;
	/**
	 * @from node_modules/@types/three/src/lights/PointLight.d.ts
	 */
	'ngt-point-light': NgtPointLight;
	/**
	 * @from node_modules/@types/three/src/lights/RectAreaLight.d.ts
	 */
	'ngt-rect-area-light': NgtRectAreaLight;
	/**
	 * @from node_modules/@types/three/src/lights/HemisphereLight.d.ts
	 */
	'ngt-hemisphere-light': NgtHemisphereLight;
	/**
	 * @from node_modules/@types/three/src/lights/DirectionalLightShadow.d.ts
	 */
	'ngt-directional-light-shadow': NgtDirectionalLightShadow;
	/**
	 * @from node_modules/@types/three/src/lights/DirectionalLight.d.ts
	 */
	'ngt-directional-light': NgtDirectionalLight;
	/**
	 * @from node_modules/@types/three/src/lights/AmbientLight.d.ts
	 */
	'ngt-ambient-light': NgtAmbientLight;
	/**
	 * @from node_modules/@types/three/src/lights/LightShadow
	 */
	'ngt-light-shadow': NgtLightShadow;
	/**
	 * @from node_modules/@types/three/src/lights/LightProbe.d.ts
	 */
	'ngt-light-probe': NgtLightProbe;

	// helpers
	/**
	 * @from node_modules/@types/three/src/helpers/SpotLightHelper.d.ts
	 */
	'ngt-spot-light-helper': NgtSpotLightHelper;
	/**
	 * @from node_modules/@types/three/src/helpers/SkeletonHelper.d.ts
	 */
	'ngt-skeleton-helper': NgtSkeletonHelper;
	/**
	 * @from node_modules/@types/three/src/helpers/PointLightHelper.d.ts
	 */
	'ngt-point-light-helper': NgtPointLightHelper;
	/**
	 * @from node_modules/@types/three/src/helpers/HemisphereLightHelper.d.ts
	 */
	'ngt-hemisphere-light-helper': NgtHemisphereLightHelper;
	/**
	 * @from node_modules/@types/three/src/helpers/GridHelper.d.ts
	 */
	'ngt-grid-helper': NgtGridHelper;
	/**
	 * @from node_modules/@types/three/src/helpers/PolarGridHelper.d.ts
	 */
	'ngt-polar-grid-helper': NgtPolarGridHelper;
	/**
	 * @from node_modules/@types/three/src/helpers/DirectionalLightHelper.d.ts
	 */
	'ngt-directional-light-helper': NgtDirectionalLightHelper;
	/**
	 * @from node_modules/@types/three/src/helpers/CameraHelper.d.ts
	 */
	'ngt-camera-helper': NgtCameraHelper;
	/**
	 * @from node_modules/@types/three/src/helpers/BoxHelper.d.ts
	 */
	'ngt-box-helper': NgtBoxHelper;
	/**
	 * @from node_modules/@types/three/src/helpers/Box3Helper.d.ts
	 */
	'ngt-box3-helper': NgtBox3Helper;
	/**
	 * @from node_modules/@types/three/src/helpers/PlaneHelper.d.ts
	 */
	'ngt-plane-helper': NgtPlaneHelper;
	/**
	 * @from node_modules/@types/three/src/helpers/ArrowHelper.d.ts
	 */
	'ngt-arrow-helper': NgtArrowHelper;
	/**
	 * @from node_modules/@types/three/src/helpers/AxesHelper.d.ts
	 */
	'ngt-axes-helper': NgtAxesHelper;

	// textures
	/**
	 * @from node_modules/@types/three/src/textures/Texture.d.ts
	 */
	'ngt-texture': NgtTexture;
	/**
	 * @from node_modules/@types/three/src/textures/VideoTexture.d.ts
	 */
	'ngt-video-texture': NgtVideoTexture;
	/**
	 * @from node_modules/@types/three/src/textures/DataTexture.d.ts
	 */
	'ngt-data-texture': NgtDataTexture;
	/**
	 * @from node_modules/@types/three/src/textures/Data3DTexture.d.ts
	 */
	'ngt-data3D-texture': NgtData3DTexture;
	/**
	 * @from node_modules/@types/three/src/textures/CompressedTexture.d.ts
	 */
	'ngt-compressed-texture': NgtCompressedTexture;
	/**
	 * @from node_modules/@types/three/src/textures/CubeTexture.d.ts
	 */
	'ngt-cube-texture': NgtCubeTexture;
	/**
	 * @from node_modules/@types/three/src/textures/CanvasTexture.d.ts
	 */
	'ngt-canvas-texture': NgtCanvasTexture;
	/**
	 * @from node_modules/@types/three/src/textures/DepthTexture.d.ts
	 */
	'ngt-depth-texture': NgtDepthTexture;

	// misc
	/**
	 * @from node_modules/@types/three/src/core/Raycaster.d.ts
	 */
	'ngt-raycaster': NgtRaycaster;
	/**
	 * @from node_modules/@types/three/src/math/Vector2.d.ts
	 */
	'ngt-vector2': NgtVector2Node;
	/**
	 * @from node_modules/@types/three/src/math/Vector3.d.ts
	 */
	'ngt-vector3': NgtVector3Node;
	/**
	 * @from node_modules/@types/three/src/math/Vector4.d.ts
	 */
	'ngt-vector4': NgtVector4Node;
	/**
	 * @from node_modules/@types/three/src/math/Euler.d.ts
	 */
	'ngt-euler': NgtEulerNode;
	/**
	 * @from node_modules/@types/three/src/math/Matrix3.d.ts
	 */
	'ngt-matrix3': NgtMatrix3Node;
	/**
	 * @from node_modules/@types/three/src/math/Matrix4.d.ts
	 */
	'ngt-matrix4': NgtMatrix4Node;
	/**
	 * @from node_modules/@types/three/src/math/Quaternion.d.ts
	 */
	'ngt-quaternion': NgtQuaternionNode;
	/**
	 * @from node_modules/@types/three/src/core/BufferAttribute.d.ts
	 */
	'ngt-buffer-attribute': NgtBufferAttribute;
	/**
	 * @from node_modules/@types/three/src/core/BufferAttribute.d.ts
	 * @symbol Float16BufferAttribute
	 */
	'ngt-float16-buffer-attribute': NgtFloat16BufferAttribute;
	/**
	 * @from node_modules/@types/three/src/core/BufferAttribute.d.ts
	 * @symbol Float32BufferAttribute
	 */
	'ngt-float32-buffer-attribute': NgtFloat32BufferAttribute;
	/**
	 * @from node_modules/@types/three/src/core/BufferAttribute.d.ts
	 * @symbol Int8BufferAttribute
	 */
	'ngt-int8-buffer-attribute': NgtInt8BufferAttribute;
	/**
	 * @from node_modules/@types/three/src/core/BufferAttribute.d.ts
	 * @symbol Int16BufferAttribute
	 */
	'ngt-int16-buffer-attribute': NgtInt16BufferAttribute;
	/**
	 * @from node_modules/@types/three/src/core/BufferAttribute.d.ts
	 * @symbol Int32BufferAttribute
	 */
	'ngt-int32-buffer-attribute': NgtInt32BufferAttribute;
	/**
	 * @from node_modules/@types/three/src/core/BufferAttribute.d.ts
	 * @symbol Uint8BufferAttribute
	 */
	'ngt-unit8-buffer-attribute': NgtUint8BufferAttribute;
	/**
	 * @from node_modules/@types/three/src/core/BufferAttribute.d.ts
	 * @symbol Uint16BufferAttribute
	 */
	'ngt-unit16-buffer-attribute': NgtUint16BufferAttribute;
	/**
	 * @from node_modules/@types/three/src/core/BufferAttribute.d.ts
	 * @symbol Uint32BufferAttribute
	 */
	'ngt-unit32-buffer-attribute': NgtUint32BufferAttribute;
	/**
	 * @from node_modules/@types/three/src/core/InstancedBufferAttribute.d.ts
	 */
	'ngt-instanced-buffer-attribute': NgtInstancedBufferAttribute;
	/**
	 * @from node_modules/@types/three/src/math/Color.d.ts
	 */
	'ngt-color': NgtColor;
	/**
	 * @from node_modules/@types/three/src/scenes/Fog.d.ts
	 */
	'ngt-fog': NgtFog;
	/**
	 * @from node_modules/@types/three/src/scenes/FogExp2.d.ts
	 */
	'ngt-fog-exp2': NgtFogExp2;
	/**
	 * @from node_modules/@types/three/src/extras/core/Shape.d.ts
	 */
	'ngt-shape': NgtShape;
}

declare global {
	interface HTMLElementTagNameMap extends ThreeElements {}
	interface HTMLElementEventMap extends NgtAllObject3DEventsMap {}
}
