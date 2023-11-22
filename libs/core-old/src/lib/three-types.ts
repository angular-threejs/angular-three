import * as THREE from 'three';
import type { NgtEventHandlers } from './events';
import type { NgtAfterAttach, NgtAttachFunction, NgtInstanceNode } from './instance';
import type { NgtBeforeRenderEvent } from './store';

type NoEvent<T> = Omit<T, 'addEventListener' | 'removeEventListener'>;

export type NgtNonFunctionKeys<T> = { [K in keyof T]-?: T[K] extends Function ? never : K }[keyof T];
export type NgtOverwrite<T, O> = Omit<T, NgtNonFunctionKeys<O>> & O;

export type NgtExtendedColors<T> = {
	[K in keyof T]: T[K] extends THREE.Color | undefined ? THREE.ColorRepresentation : T[K];
};

/**
 * If **T** contains a constructor, @see ConstructorParameters must be used, otherwise **T**.
 */
type NgtArgs<T> = T extends new (...args: any) => any ? ConstructorParameters<T> : T;

export type NgtEuler = THREE.Euler | Parameters<THREE.Euler['set']>;
export type NgtMatrix4 = THREE.Matrix4 | Parameters<THREE.Matrix4['set']> | Readonly<THREE.Matrix4['set']>;

/**
 * Turn an implementation of THREE.Vector in to the type that an r3f component would accept as a prop.
 */
type NgtVectorLike<VectorClass extends THREE.Vector> =
	| VectorClass
	| Parameters<VectorClass['set']>
	| Readonly<Parameters<VectorClass['set']>>
	| Parameters<VectorClass['setScalar']>[0];

export type NgtVector2 = NgtVectorLike<THREE.Vector2>;
export type NgtVector3 = NgtVectorLike<THREE.Vector3>;
export type NgtVector4 = NgtVectorLike<THREE.Vector4>;
export type NgtLayers = THREE.Layers | Parameters<THREE.Layers['set']>[0];
export type NgtQuaternion = THREE.Quaternion | Parameters<THREE.Quaternion['set']>;

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
	__ngt_args__: NgtArgs<TConstructor>;
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

export type NgtGeometry<TGeometry extends THREE.BufferGeometry, TConstructor> = NgtNode<TGeometry, TConstructor>;
export type NgtMaterial<TMaterial extends THREE.Material, TConstructor> = NgtNode<TMaterial, TConstructor>;
export type NgtLight<T extends THREE.Light, P> = NgtObject3DNode<T, P>;

export type NgtObject3D = NgtObject3DNode<THREE.Object3D, typeof THREE.Object3D>;
export type NgtAudio = NgtObject3DNode<THREE.Audio, typeof THREE.Audio>;
export type NgtAudioListener = NgtObject3DNode<THREE.AudioListener, typeof THREE.AudioListener>;
export type NgtPositionalAudio = NgtObject3DNode<THREE.PositionalAudio, typeof THREE.PositionalAudio>;

export type NgtMesh = NgtObject3DNode<THREE.Mesh, typeof THREE.Mesh>;
export type NgtInstancedMesh = NgtObject3DNode<THREE.InstancedMesh, typeof THREE.InstancedMesh>;
export type NgtScene = NgtObject3DNode<THREE.Scene, typeof THREE.Scene>;
export type NgtSprite = NgtObject3DNode<THREE.Sprite, typeof THREE.Sprite>;
export type NgtLOD = NgtObject3DNode<THREE.LOD, typeof THREE.LOD>;
export type NgtSkinnedMesh = NgtObject3DNode<THREE.SkinnedMesh, typeof THREE.SkinnedMesh>;

export type NgtSkeleton = NgtObject3DNode<THREE.Skeleton, typeof THREE.Skeleton>;
export type NgtBone = NgtObject3DNode<THREE.Bone, typeof THREE.Bone>;
export type NgtLine = NgtObject3DNode<THREE.Line, typeof THREE.Line>;
export type NgtLineSegments = NgtObject3DNode<THREE.LineSegments, typeof THREE.LineSegments>;
export type NgtLineLoop = NgtObject3DNode<THREE.LineLoop, typeof THREE.LineLoop>;
export type NgtPoints = NgtObject3DNode<THREE.Points, typeof THREE.Points>;
export type NgtGroup = NgtObject3DNode<THREE.Group, typeof THREE.Group>;

export type NgtCameraNode = NgtObject3DNode<THREE.Camera, typeof THREE.Camera>;
export type NgtPerspectiveCamera = NgtObject3DNode<THREE.PerspectiveCamera, typeof THREE.PerspectiveCamera>;
export type NgtOrthographicCamera = NgtObject3DNode<THREE.OrthographicCamera, typeof THREE.OrthographicCamera>;
export type NgtCubeCamera = NgtObject3DNode<THREE.CubeCamera, typeof THREE.CubeCamera>;
export type NgtArrayCamera = NgtObject3DNode<THREE.ArrayCamera, typeof THREE.ArrayCamera>;

export type NgtInstancedBufferGeometry = NgtGeometry<
	THREE.InstancedBufferGeometry,
	typeof THREE.InstancedBufferGeometry
>;
export type NgtBufferGeometry = NgtGeometry<THREE.BufferGeometry, typeof THREE.BufferGeometry>;
export type NgtWireframeGeometry = NgtGeometry<THREE.WireframeGeometry, typeof THREE.WireframeGeometry>;
export type NgtTetrahedronGeometry = NgtGeometry<THREE.TetrahedronGeometry, typeof THREE.TetrahedronGeometry>;
export type NgtOctahedronGeometry = NgtGeometry<THREE.OctahedronGeometry, typeof THREE.OctahedronGeometry>;
export type NgtIcosahedronGeometry = NgtGeometry<THREE.IcosahedronGeometry, typeof THREE.IcosahedronGeometry>;
export type NgtDodecahedronGeometry = NgtGeometry<THREE.DodecahedronGeometry, typeof THREE.DodecahedronGeometry>;
export type NgtPolyhedronGeometry = NgtGeometry<THREE.PolyhedronGeometry, typeof THREE.PolyhedronGeometry>;
export type NgtTubeGeometry = NgtGeometry<THREE.TubeGeometry, typeof THREE.TubeGeometry>;
export type NgtTorusKnotGeometry = NgtGeometry<THREE.TorusKnotGeometry, typeof THREE.TorusKnotGeometry>;
export type NgtTorusGeometry = NgtGeometry<THREE.TorusGeometry, typeof THREE.TorusGeometry>;
export type NgtSphereGeometry = NgtGeometry<THREE.SphereGeometry, typeof THREE.SphereGeometry>;
export type NgtRingGeometry = NgtGeometry<THREE.RingGeometry, typeof THREE.RingGeometry>;
export type NgtPlaneGeometry = NgtGeometry<THREE.PlaneGeometry, typeof THREE.PlaneGeometry>;
export type NgtLatheGeometry = NgtGeometry<THREE.LatheGeometry, typeof THREE.LatheGeometry>;
export type NgtShapeGeometry = NgtGeometry<THREE.ShapeGeometry, typeof THREE.ShapeGeometry>;
export type NgtExtrudeGeometry = NgtGeometry<THREE.ExtrudeGeometry, typeof THREE.ExtrudeGeometry>;
export type NgtEdgesGeometry = NgtGeometry<THREE.EdgesGeometry, typeof THREE.EdgesGeometry>;
export type NgtConeGeometry = NgtGeometry<THREE.ConeGeometry, typeof THREE.ConeGeometry>;
export type NgtCylinderGeometry = NgtGeometry<THREE.CylinderGeometry, typeof THREE.CylinderGeometry>;
export type NgtCircleGeometry = NgtGeometry<THREE.CircleGeometry, typeof THREE.CircleGeometry>;
export type NgtBoxGeometry = NgtGeometry<THREE.BoxGeometry, typeof THREE.BoxGeometry>;
export type NgtCapsuleGeometry = NgtGeometry<THREE.CapsuleGeometry, typeof THREE.CapsuleGeometry>;

export type NgtShadowMaterial = NgtMaterial<THREE.ShadowMaterial, [THREE.ShaderMaterialParameters]>;
export type NgtSpriteMaterial = NgtMaterial<THREE.SpriteMaterial, [THREE.SpriteMaterialParameters]>;
export type NgtRawShaderMaterial = NgtMaterial<THREE.RawShaderMaterial, [THREE.ShaderMaterialParameters]>;
export type NgtShaderMaterial = NgtMaterial<THREE.ShaderMaterial, [THREE.ShaderMaterialParameters]>;
export type NgtPointsMaterial = NgtMaterial<THREE.PointsMaterial, [THREE.PointsMaterialParameters]>;
export type NgtMeshPhysicalMaterial = NgtMaterial<THREE.MeshPhysicalMaterial, [THREE.MeshPhysicalMaterialParameters]>;
export type NgtMeshStandardMaterial = NgtMaterial<THREE.MeshStandardMaterial, [THREE.MeshStandardMaterialParameters]>;
export type NgtMeshPhongMaterial = NgtMaterial<THREE.MeshPhongMaterial, [THREE.MeshPhongMaterialParameters]>;
export type NgtMeshToonMaterial = NgtMaterial<THREE.MeshToonMaterial, [THREE.MeshToonMaterialParameters]>;
export type NgtMeshNormalMaterial = NgtMaterial<THREE.MeshNormalMaterial, [THREE.MeshNormalMaterialParameters]>;
export type NgtMeshLambertMaterial = NgtMaterial<THREE.MeshLambertMaterial, [THREE.MeshLambertMaterialParameters]>;
export type NgtMeshDepthMaterial = NgtMaterial<THREE.MeshDepthMaterial, [THREE.MeshDepthMaterialParameters]>;
export type NgtMeshDistanceMaterial = NgtMaterial<THREE.MeshDistanceMaterial, [THREE.MeshDistanceMaterialParameters]>;
export type NgtMeshBasicMaterial = NgtMaterial<THREE.MeshBasicMaterial, [THREE.MeshBasicMaterialParameters]>;
export type NgtMeshMatcapMaterial = NgtMaterial<THREE.MeshMatcapMaterial, [THREE.MeshMatcapMaterialParameters]>;
export type NgtLineDashedMaterial = NgtMaterial<THREE.LineDashedMaterial, [THREE.LineDashedMaterialParameters]>;
export type NgtLineBasicMaterial = NgtMaterial<THREE.LineBasicMaterial, [THREE.LineBasicMaterialParameters]>;

export type NgtPrimitive = NgtNodeElement<any, any>;
export type NgtValue = NgtNode<{ rawValue: any }, {}>;

export type NgtLightShadow = NgtNode<THREE.LightShadow, typeof THREE.LightShadow>;
export type NgtSpotLightShadow = NgtNode<THREE.SpotLightShadow, typeof THREE.SpotLightShadow>;
export type NgtDirectionalLightShadow = NgtNode<THREE.DirectionalLightShadow, typeof THREE.DirectionalLightShadow>;

export type NgtSpotLight = NgtLight<THREE.SpotLight, typeof THREE.SpotLight>;
export type NgtPointLight = NgtLight<THREE.PointLight, typeof THREE.PointLight>;
export type NgtRectAreaLight = NgtLight<THREE.RectAreaLight, typeof THREE.RectAreaLight>;
export type NgtHemisphereLight = NgtLight<THREE.HemisphereLight, typeof THREE.HemisphereLight>;
export type NgtDirectionalLight = NgtLight<THREE.DirectionalLight, typeof THREE.DirectionalLight>;
export type NgtAmbientLight = NgtLight<THREE.AmbientLight, typeof THREE.AmbientLight>;
export type NgtAmbientLightProbe = NgtLight<THREE.AmbientLightProbe, typeof THREE.AmbientLightProbe>;
export type NgtHemisphereLightProbe = NgtLight<THREE.HemisphereLightProbe, typeof THREE.HemisphereLightProbe>;
export type NgtLightProbe = NgtLight<THREE.LightProbe, typeof THREE.LightProbe>;

export type NgtSpotLightHelper = NgtObject3DNode<THREE.SpotLightHelper, typeof THREE.SpotLightHelper>;
export type NgtSkeletonHelper = NgtObject3DNode<THREE.SkeletonHelper, typeof THREE.SkeletonHelper>;
export type NgtPointLightHelper = NgtObject3DNode<THREE.PointLightHelper, typeof THREE.PointLightHelper>;
export type NgtHemisphereLightHelper = NgtObject3DNode<THREE.HemisphereLightHelper, typeof THREE.HemisphereLightHelper>;
export type NgtGridHelper = NgtObject3DNode<THREE.GridHelper, typeof THREE.GridHelper>;
export type NgtPolarGridHelper = NgtObject3DNode<THREE.PolarGridHelper, typeof THREE.PolarGridHelper>;
export type NgtDirectionalLightHelper = NgtObject3DNode<
	THREE.DirectionalLightHelper,
	typeof THREE.DirectionalLightHelper
>;
export type NgtCameraHelper = NgtObject3DNode<THREE.CameraHelper, typeof THREE.CameraHelper>;
export type NgtBoxHelper = NgtObject3DNode<THREE.BoxHelper, typeof THREE.BoxHelper>;
export type NgtBox3Helper = NgtObject3DNode<THREE.Box3Helper, typeof THREE.Box3Helper>;
export type NgtPlaneHelper = NgtObject3DNode<THREE.PlaneHelper, typeof THREE.PlaneHelper>;
export type NgtArrowHelper = NgtObject3DNode<THREE.ArrowHelper, typeof THREE.ArrowHelper>;
export type NgtAxesHelper = NgtObject3DNode<THREE.AxesHelper, typeof THREE.AxesHelper>;

export type NgtTexture = NgtNode<THREE.Texture, typeof THREE.Texture>;
export type NgtVideoTexture = NgtNode<THREE.VideoTexture, typeof THREE.VideoTexture>;
export type NgtDataTexture = NgtNode<THREE.DataTexture, typeof THREE.DataTexture>;
export type NgtData3DTexture = NgtNode<THREE.Data3DTexture, typeof THREE.Data3DTexture>;
export type NgtCompressedTexture = NgtNode<THREE.CompressedTexture, typeof THREE.CompressedTexture>;
export type NgtCubeTexture = NgtNode<THREE.CubeTexture, typeof THREE.CubeTexture>;
export type NgtCanvasTexture = NgtNode<THREE.CanvasTexture, typeof THREE.CanvasTexture>;
export type NgtDepthTexture = NgtNode<THREE.DepthTexture, typeof THREE.DepthTexture>;

export type NgtRaycaster = NgtNode<THREE.Raycaster, typeof THREE.Raycaster>;
export type NgtVector2Node = NgtNode<THREE.Vector2, typeof THREE.Vector2>;
export type NgtVector3Node = NgtNode<THREE.Vector3, typeof THREE.Vector3>;
export type NgtVector4Node = NgtNode<THREE.Vector4, typeof THREE.Vector4>;
export type NgtEulerNode = NgtNode<THREE.Euler, typeof THREE.Euler>;
export type NgtMatrix3Node = NgtNode<THREE.Matrix3, typeof THREE.Matrix3>;
export type NgtMatrix4Node = NgtNode<THREE.Matrix4, typeof THREE.Matrix4>;
export type NgtQuaternionNode = NgtNode<THREE.Quaternion, typeof THREE.Quaternion>;
export type NgtBufferAttribute = NgtNode<THREE.BufferAttribute, typeof THREE.BufferAttribute>;
export type NgtFloat16BufferAttribute = NgtNode<THREE.Float16BufferAttribute, typeof THREE.Float16BufferAttribute>;
export type NgtFloat32BufferAttribute = NgtNode<THREE.Float32BufferAttribute, typeof THREE.Float32BufferAttribute>;
export type NgtFloat64BufferAttribute = NgtNode<THREE.Float64BufferAttribute, typeof THREE.Float64BufferAttribute>;
export type NgtInt8BufferAttribute = NgtNode<THREE.Int8BufferAttribute, typeof THREE.Int8BufferAttribute>;
export type NgtInt16BufferAttribute = NgtNode<THREE.Int16BufferAttribute, typeof THREE.Int16BufferAttribute>;
export type NgtInt32BufferAttribute = NgtNode<THREE.Int32BufferAttribute, typeof THREE.Int32BufferAttribute>;
export type NgtUint8BufferAttribute = NgtNode<THREE.Uint8BufferAttribute, typeof THREE.Uint8BufferAttribute>;
export type NgtUint16BufferAttribute = NgtNode<THREE.Uint16BufferAttribute, typeof THREE.Uint16BufferAttribute>;
export type NgtUint32BufferAttribute = NgtNode<THREE.Uint32BufferAttribute, typeof THREE.Uint32BufferAttribute>;
export type NgtInstancedBufferAttribute = NgtNode<
	THREE.InstancedBufferAttribute,
	typeof THREE.InstancedBufferAttribute
>;
export type NgtColor = NgtNode<THREE.Color, THREE.ColorRepresentation>;
export type NgtFog = NgtNode<THREE.Fog, typeof THREE.Fog>;
export type NgtFogExp2 = NgtNode<THREE.FogExp2, typeof THREE.FogExp2>;
export type NgtShape = NgtNode<THREE.Shape, typeof THREE.Shape>;

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
	'ngt-ambient-light-probe': NgtAmbientLightProbe;
	'ngt-hemisphere-light-probe': NgtHemisphereLightProbe;
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
	'ngt-float64-buffer-attribute': NgtFloat64BufferAttribute;
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
