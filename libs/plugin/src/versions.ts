export const ANGULAR_THREE_VERSION = 'next';
export const THREE_VERSION = '^0.173.0';
export const THREE_TYPE_VERSION = '^0.173.0';
export const NGXTENSION_VERSION = '^4.0.0';

export const PEER_DEPENDENCIES: Record<string, Record<string, string>> = {
	'angular-three-soba': {
		'three-stdlib': '^2.0.0',
		'@pmndrs/vanilla': '^1.20.0',
		'@monogrid/gainmap-js': '^3.0.0',
		'camera-controls': '^2.8.0',
		'hls.js': '^1.5.0',
		maath: '~0.10.0',
		meshline: '^3.1.0',
		'stats-gl': '^2.0.0',
		'three-custom-shader-material': '~6.3.0',
		'three-mesh-bvh': '~0.9.0',
		'troika-three-text': '~0.52.0',
	},
	'angular-three-rapier': {
		'@dimforge/rapier3d-compat': '~0.14.0',
	},
	'angular-three-postprocessing': {
		maath: '~0.10.0',
		n8ao: '~1.9.0',
		postprocessing: '^6.0.0',
	},
	'angular-three-cannon': {
		'@pmndrs/cannon-worker-api': '^2.0.0',
		'cannon-es': '^0.20.0',
		'cannon-es-debugger': '^1.0.0',
	},
};
