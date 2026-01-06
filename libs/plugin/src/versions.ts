export const ANGULAR_THREE_VERSION = '^4.0.0';
export const THREE_VERSION = '^0.182.0';
export const THREE_TYPE_VERSION = '^0.182.0';
export const NGXTENSION_VERSION = '^7.0.0';

export const PEER_DEPENDENCIES: Record<string, Record<string, string>> = {
	'angular-three-soba': {
		'three-stdlib': '^2.36.0',
		'@pmndrs/vanilla': '^1.25.0',
		'@monogrid/gainmap-js': '^3.4.0',
		'camera-controls': '^2.10.0',
		'hls.js': '^1.6.0',
		maath: '^0.10.8',
		meshline: '^3.3.0',
		'stats-gl': '^3.8.0',
		'three-custom-shader-material': '^6.4.0',
		'three-mesh-bvh': '^0.9.0',
		'troika-three-text': '^0.52.0',
	},
	'angular-three-rapier': {
		'@dimforge/rapier3d-compat': '^0.19.0',
		'three-stdlib': '^2.36.0',
	},
	'angular-three-postprocessing': {
		maath: '^0.10.8',
		n8ao: '^1.10.0',
		postprocessing: '^6.38.0',
		'three-stdlib': '^2.36.0',
	},
	'angular-three-cannon': {
		'@pmndrs/cannon-worker-api': '^2.4.0',
		'cannon-es': '^0.20.0',
		'cannon-es-debugger': '^1.0.0',
	},
	'angular-three-tweakpane': {
		'@tweakpane/core': '^2.0.5',
		tweakpane: '^4.0.5',
	},
	'angular-three-theatre': {
		'@theatre/core': '^0.7.2',
		'@theatre/studio': '^0.7.2',
	},
};
