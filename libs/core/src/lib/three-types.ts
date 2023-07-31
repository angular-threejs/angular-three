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
