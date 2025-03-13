import {
	ChangeDetectionStrategy,
	Component,
	CUSTOM_ELEMENTS_SCHEMA,
	DestroyRef,
	effect,
	ElementRef,
	inject,
	input,
	signal,
	untracked,
	viewChild,
} from '@angular/core';
import { extend, injectStore, is, NgtThreeElements, omit, pick } from 'angular-three';
import { mergeInputs } from 'ngxtension/inject-inputs';
import * as THREE from 'three';
import { Group } from 'three';
import { acceleratedRaycast, computeBoundsTree, disposeBoundsTree, SAH, SplitStrategy } from 'three-mesh-bvh';

export type NgtsBVHOptions = Partial<NgtThreeElements['ngt-group']> & {
	/**Enabled, default: true */
	enabled: boolean;
	/** Use .raycastFirst to retrieve hits which is generally faster, default: false */
	firstHitOnly: boolean;
	/** Split strategy, default: SAH (slowest to construct, fastest runtime, least memory) */
	strategy: SplitStrategy;
	/** Print out warnings encountered during tree construction, default: false */
	verbose: boolean;
	/** If true then the bounding box for the geometry is set once the BVH has been constructed, default: true */
	setBoundingBox: boolean;
	/** The maximum depth to allow the tree to build to, default: 40 */
	maxDepth: number;
	/** The number of triangles to aim for in a leaf node, default: 10 */
	maxLeafTris: number;

	/** If false then an index buffer is created if it does not exist and is rearranged */
	/** to hold the bvh structure. If false then a separate buffer is created to store the */
	/** structure and the index buffer (or lack thereof) is retained. This can be used */
	/** when the existing index layout is important or groups are being used so a */
	/** single BVH hierarchy can be created to improve performance. */
	/** default: false */
	/** Note: This setting is experimental */
	indirect?: boolean;
};

const defaultOptions: NgtsBVHOptions = {
	enabled: true,
	firstHitOnly: false,
	strategy: SAH,
	verbose: false,
	setBoundingBox: true,
	maxDepth: 40,
	maxLeafTris: 10,
	indirect: false,
};

@Component({
	selector: 'ngts-bvh',
	template: `
		<ngt-group #group [parameters]="parameters()">
			<ng-content />
		</ngt-group>
	`,
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgtsBVH {
	options = input(defaultOptions, { transform: mergeInputs(defaultOptions) });
	protected parameters = omit(this.options, [
		'enabled',
		'firstHitOnly',
		'strategy',
		'verbose',
		'setBoundingBox',
		'maxDepth',
		'maxLeafTris',
		'indirect',
	]);

	groupRef = viewChild.required<ElementRef<THREE.Group>>('group');

	private store = injectStore();

	private enabled = pick(this.options, 'enabled');
	private firstHitOnly = pick(this.options, 'firstHitOnly');
	private strategy = pick(this.options, 'strategy');
	private verbose = pick(this.options, 'verbose');
	private setBoundingBox = pick(this.options, 'setBoundingBox');
	private maxDepth = pick(this.options, 'maxDepth');
	private maxLeafTris = pick(this.options, 'maxLeafTris');
	private indirect = pick(this.options, 'indirect');

	private reset = signal(Math.random());
	private retryMap = new Map();
	private MAX_RETRIES = 3;

	constructor() {
		extend({ Group });

		effect((onCleanup) => {
			const enabled = this.enabled();
			if (!enabled) return;

			const group = this.groupRef().nativeElement;

			// track reset
			this.reset();

			// Hijacking the raycast method to do it for individual meshes is not an option as it would
			// This can only safely work if the component is used once, but there is no alternative.
			// cost too much memory ...
			const [firstHitOnly, strategy, verbose, setBoundingBox, maxDepth, maxLeafTris, indirect, raycaster] = [
				untracked(this.firstHitOnly),
				untracked(this.strategy),
				untracked(this.verbose),
				untracked(this.setBoundingBox),
				untracked(this.maxDepth),
				untracked(this.maxLeafTris),
				untracked(this.indirect),
				this.store.snapshot.raycaster,
			];

			const options = { strategy, verbose, setBoundingBox, maxDepth, maxLeafTris, indirect };
			raycaster.firstHitOnly = firstHitOnly;

			let timeoutId: ReturnType<typeof setTimeout> | undefined;
			group.visible = false;
			group.traverse((child) => {
				if (
					is.three<THREE.Mesh>(child, 'isMesh') &&
					!child.geometry.boundsTree &&
					child.raycast === THREE.Mesh.prototype.raycast
				) {
					const geometry = child.geometry;
					const retryCount = this.retryMap.get(child) ?? 0;
					// retry 3 times
					if (!Object.keys(geometry.attributes).length && retryCount <= this.MAX_RETRIES) {
						this.retryMap.set(child, retryCount + 1);
						timeoutId = setTimeout(() => {
							this.reset.set(Math.random());
						});
						return;
					}

					if (!group.visible) group.visible = true;

					child.raycast = acceleratedRaycast;
					child.geometry.computeBoundsTree = computeBoundsTree;
					child.geometry.disposeBoundsTree = disposeBoundsTree;
					child.geometry.computeBoundsTree(options);
				}
			});

			onCleanup(() => {
				timeoutId && clearTimeout(timeoutId);

				delete raycaster.firstHitOnly;
				group.traverse((child) => {
					if (is.three<THREE.Mesh>(child, 'isMesh') && child.geometry.boundsTree) {
						child.geometry.disposeBoundsTree();
						child.raycast = THREE.Mesh.prototype.raycast;
					}
				});

				if (!group.visible) group.visible = true;
			});
		});

		inject(DestroyRef).onDestroy(() => {
			this.retryMap.clear();
		});
	}
}
