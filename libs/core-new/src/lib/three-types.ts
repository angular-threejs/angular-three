import { Color, ColorRepresentation, Euler, Layers, Matrix4, Quaternion, Vector2, Vector3, Vector4 } from 'three';
import { NgtEventHandlers } from './events';
import { NgtBeforeRenderEvent } from './store';

type NoEvent<T> = Omit<T, 'addEventListener' | 'removeEventListener'>;

/**
 * If **T** contains a constructor, @see ConstructorParameters must be used, otherwise **T**.
 */
type NgtArguments<T> = T extends new (...args: any) => any ? ConstructorParameters<T> : T;

export type NgtNonFunctionKeys<T> = { [K in keyof T]-?: T[K] extends Function ? never : K }[keyof T];
export type NgtOverwrite<T, O> = Omit<T, NgtNonFunctionKeys<O>> & O;

export type NgtExtendedColors<T> = {
	[K in keyof T]: T[K] extends Color | undefined ? ColorRepresentation : T[K];
};

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
export type NgtEuler = Euler | Parameters<Euler['set']>;
export type NgtMatrix4 = Matrix4 | Parameters<Matrix4['set']> | Readonly<Matrix4['set']>;

export interface NgtNodeEventMap<TOriginal> {
	// beforeAttach: NgtBeforeAttach<TOriginal>;
	beforeAttach: any;
	// afterAttach: NgtAfterAttach<NgtInstanceNode, TOriginal>;
	afterAttach: any;
	beforeRender: NgtBeforeRenderEvent<TOriginal>;
}

export type NgtNodeElement<TOriginal, TConstructor> = {
	// attach: string | string[] | NgtAttachFunction;
	attach: string | string[] | any;
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
