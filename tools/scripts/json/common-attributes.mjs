export const COMMON_ATTRIBUTES = [
	{
		name: 'attach',
		description: 'Property to attach to parent. Can be dotted path',
	},
	{
		name: '[attach]',
		description: 'An array of paths to attach to parent. Can also be an NgtAttachFunction',
	},
	{
		name: '[dispose]',
		description: 'Cleanup function',
	},
	{
		name: '[parameters]',
		description: 'Additional parameters for the instance',
	},
	{
		name: '[userData]',
		description: 'User data to pass to the instance',
	},
];

export const COMMON_EVENTS = [
	{
		name: '(change)',
		properties: { type: 'string', target: 'any' },
	},
	{
		name: '(disposed)',
		properties: { type: 'string', target: 'any' },
	},
	{
		name: '(attached)',
		type: 'NgtAfterAttach',
		description: 'Fires after the element is attached to its parent',
		properties: [
			{
				name: 'parent',
				description: 'The parent instance this element was attached to',
			},
			{
				name: 'node',
				description: 'The element instance that was attached',
			},
		],
	},
	{
		name: '(updated)',
		type: 'any',
		description: 'Fires when the element is updated with the updated instance',
	},
	{
		name: '(created)',
		type: 'any',
		description: 'Fires when the element is created with the created instance',
	},
];

export const OBJECT3D_EVENTS = [
	{
		name: 'added',
		properties: { type: 'string', target: 'THREE.Object3D' },
	},
	{
		name: 'removed',
		properties: { type: 'string', target: 'THREE.Object3D' },
	},
	{
		name: 'childadded',
		properties: { type: 'string', target: 'THREE.Object3D', child: 'THREE.Object3D' },
	},
	{
		name: 'childremoved',
		properties: { type: 'string', target: 'THREE.Object3D', child: 'THREE.Object3D' },
	},
];
