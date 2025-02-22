import {
	ChangeDetectionStrategy,
	Component,
	CUSTOM_ELEMENTS_SCHEMA,
	effect,
	ElementRef,
	input,
	untracked,
	viewChild,
} from '@angular/core';
import { extend, injectStore, is, NgtThreeElements, omit, pick } from 'angular-three';
import { mergeInputs } from 'ngxtension/inject-inputs';
import * as THREE from 'three';
import { Group } from 'three';
import { acceleratedRaycast, computeBoundsTree, disposeBoundsTree, SAH, SplitStrategy } from 'three-mesh-bvh';

export type NgtsBvhOptions = Partial<NgtThreeElements['ngt-group']> & {
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

const defaultOptions: NgtsBvhOptions = {
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
export class NgtsBvh {
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

	constructor() {
		extend({ Group });

		effect((onCleanup) => {
			const enabled = this.enabled();
			if (!enabled) return;

			// This can only safely work if the component is used once, but there is no alternative.
			// Hijacking the raycast method to do it for individual meshes is not an option as it would
			// cost too much memory ...
			const [firstHitOnly, strategy, verbose, setBoundingBox, maxDepth, maxLeafTris, indirect, group, raycaster] =
				[
					untracked(this.firstHitOnly),
					untracked(this.strategy),
					untracked(this.verbose),
					untracked(this.setBoundingBox),
					untracked(this.maxDepth),
					untracked(this.maxLeafTris),
					untracked(this.indirect),
					this.groupRef().nativeElement,
					this.store.snapshot.raycaster,
				];

			const options = { strategy, verbose, setBoundingBox, maxDepth, maxLeafTris, indirect };
			raycaster.firstHitOnly = firstHitOnly;

			group.traverse((child) => {
				if (
					is.three<THREE.Mesh>(child, 'isMesh') &&
					!child.geometry.boundsTree &&
					child.raycast === THREE.Mesh.prototype.raycast
				) {
					child.raycast = acceleratedRaycast;
					child.geometry.computeBoundsTree = computeBoundsTree;
					child.geometry.disposeBoundsTree = disposeBoundsTree;
					child.geometry.computeBoundsTree(options);
				}
			});

			onCleanup(() => {
				delete raycaster.firstHitOnly;
				group.traverse((child) => {
					if (is.three<THREE.Mesh>(child, 'isMesh') && child.geometry.boundsTree) {
						child.geometry.disposeBoundsTree();
						child.raycast = THREE.Mesh.prototype.raycast;
					}
				});
			});
		});
	}
}
