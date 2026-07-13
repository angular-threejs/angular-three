import { resolveRef, type NgtRenderState, type NgtState, type SignalState } from 'angular-three';
import type * as THREE from 'three';
import {
	resolveHTMLOcclusionStrategy,
	type NgtsHTMLOcclusion,
	type NgtsHTMLOcclusionStrategy,
	type NgtsHTMLOcclusionTarget,
} from './occlusion';
import { isObjectBehindCamera, isObjectVisible } from './utils';

export interface HTMLFrameTargetRegistration {
	readonly target: NgtsHTMLOcclusionTarget;
	readonly getOcclusion: () => NgtsHTMLOcclusion;
	readonly onOcclusionChange: (occluded: boolean) => void;
	readonly update: (state: NgtRenderState) => void;
}

interface HTMLFrameTargetRecord extends HTMLFrameTargetRegistration {
	active: boolean;
	visible: boolean;
	strategy?: NgtsHTMLOcclusionStrategy;
	releaseStrategy?: () => void;
	frameOcclusion: NgtsHTMLOcclusion;
	frameAncestorVisible: boolean;
	frameBehindCamera: boolean;
}

interface HTMLFrameCoordinator {
	frameId: number;
	records: Set<HTMLFrameTargetRecord>;
	store: SignalState<NgtState>;
	unsubscribe: () => void;
}

const coordinators = new WeakMap<SignalState<NgtState>, HTMLFrameCoordinator>();
const storeFrameIds = new WeakMap<SignalState<NgtState>, number>();

function hasVisibleAncestors(anchor: THREE.Object3D) {
	let ancestor: THREE.Object3D | null = anchor;
	while (ancestor) {
		if (!ancestor.visible) return false;
		ancestor = ancestor.parent;
	}
	return true;
}

function setStrategy(record: HTMLFrameTargetRecord, strategy?: NgtsHTMLOcclusionStrategy) {
	if (record.strategy === strategy) return;
	record.releaseStrategy?.();
	record.releaseStrategy = undefined;
	record.strategy = strategy;

	const release = strategy?.setupTarget?.(record.target);
	if (typeof release === 'function') record.releaseStrategy = release;
}

function setVisible(record: HTMLFrameTargetRecord, visible: boolean) {
	if (record.visible === visible) return;
	record.visible = visible;
	record.onOcclusionChange(!visible);
}

function raycastTargets(occlusion: NgtsHTMLOcclusion, scene: THREE.Scene) {
	if (!Array.isArray(occlusion)) return [scene];
	return occlusion.map((item) => resolveRef(item)).filter((item): item is THREE.Object3D => !!item);
}

function runHTMLFrame(coordinator: HTMLFrameCoordinator, state: NgtRenderState) {
	const { scene, camera, raycaster } = state;
	scene.updateWorldMatrix(true, true);
	camera.updateWorldMatrix(true, false);

	const frameId = ++coordinator.frameId;
	storeFrameIds.set(coordinator.store, frameId);
	const frame = { id: frameId, state } as const;
	const strategyRecords = new Map<NgtsHTMLOcclusionStrategy, HTMLFrameTargetRecord[]>();
	const records = [...coordinator.records];

	for (const record of records) {
		if (!record.active) continue;
		const occlusion = record.getOcclusion();
		const strategy = resolveHTMLOcclusionStrategy(occlusion);
		setStrategy(record, strategy);

		record.frameOcclusion = occlusion;
		record.frameAncestorVisible = hasVisibleAncestors(record.target.anchor);
		record.frameBehindCamera = record.frameAncestorVisible && isObjectBehindCamera(record.target.anchor, camera);

		if (!record.frameAncestorVisible || record.frameBehindCamera || !strategy) continue;
		const groupedRecords = strategyRecords.get(strategy);
		if (groupedRecords) groupedRecords.push(record);
		else strategyRecords.set(strategy, [record]);
	}

	for (const [strategy, groupedRecords] of strategyRecords) {
		strategy.beginFrame?.(
			groupedRecords.map(({ target }) => target),
			frame,
		);
	}

	for (const record of records) {
		if (!record.active) continue;

		let visible = record.frameAncestorVisible && !record.frameBehindCamera;
		if (visible && record.strategy) {
			visible = !record.strategy.isOccluded(record.target, frame);
		} else if (
			visible &&
			(record.frameOcclusion === true ||
				record.frameOcclusion === 'raycast' ||
				Array.isArray(record.frameOcclusion))
		) {
			visible = isObjectVisible(
				record.target.anchor,
				camera,
				raycaster,
				raycastTargets(record.frameOcclusion, scene),
			);
		}

		setVisible(record, visible);
		if (record.active && record.frameAncestorVisible) record.update(state);
	}
}

function createCoordinator(store: SignalState<NgtState>): HTMLFrameCoordinator {
	const coordinator: HTMLFrameCoordinator = {
		frameId: storeFrameIds.get(store) ?? 0,
		records: new Set(),
		store,
		unsubscribe: () => undefined,
	};
	coordinator.unsubscribe = store.snapshot.internal.subscribe((state) => runHTMLFrame(coordinator, state), 0, store);
	return coordinator;
}

/** Registers an HTML content target with the single per-store frame coordinator. */
export function registerHTMLFrameTarget(store: SignalState<NgtState>, registration: HTMLFrameTargetRegistration) {
	let coordinator = coordinators.get(store);
	if (!coordinator) {
		coordinator = createCoordinator(store);
		coordinators.set(store, coordinator);
	}

	const record: HTMLFrameTargetRecord = {
		...registration,
		active: true,
		visible: true,
		frameOcclusion: false,
		frameAncestorVisible: true,
		frameBehindCamera: false,
	};
	coordinator.records.add(record);

	let released = false;
	return () => {
		if (released) return;
		released = true;
		record.active = false;
		record.releaseStrategy?.();
		record.releaseStrategy = undefined;
		record.strategy = undefined;
		coordinator.records.delete(record);

		if (coordinator.records.size) return;
		coordinator.unsubscribe();
		coordinators.delete(store);
	};
}
