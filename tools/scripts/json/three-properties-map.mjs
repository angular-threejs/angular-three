export const KNOWN_PROPERTIES = {
	SpotLightHelper: {
		properties: ['light', 'matrix', 'matrixAutoUpdate', 'color'],
		isObject3D: true,
	},
	SkeletonHelper: {
		properties: ['root', 'bones', 'matrix', 'matrixAutoUpdate'],
		isObject3D: true,
	},
	PointLightHelper: {
		properties: ['light', 'matrix', 'matrixAutoUpdate', 'color'],
		isObject3D: true,
	},
	HemisphereLightHelper: {
		properties: ['light', 'matrix', 'matrixAutoUpdate', 'color', 'size'],
		isObject3D: true,
	},
	DirectionalLightHelper: {
		properties: ['light', 'matrix', 'matrixAutoUpdate', 'color', 'size'],
		isObject3D: true,
	},
	CameraHelper: {
		properties: ['camera', 'matrix', 'matrixAutoUpdate', 'pointMap'],
		isObject3D: true,
	},
	Audio: {
		properties: [
			'listener',
			'context',
			'gain',
			'autoplay',
			'buffer',
			'detune',
			'loop',
			'loopStart',
			'loopEnd',
			'offset',
			'duration',
			'playbackRate',
			'isPlaying',
			'source',
			'sourceType',
			'filters',
		],
		isObject3D: true,
	},
	PositionalAudio: {
		properties: [
			'panner',
			'orientation',
			'position',
			'refDistance',
			'rolloffFactor',
			'maxDistance',
			'distanceModel',
			'panningModel',
			'coneInnerAngle',
			'coneOuterAngle',
			'coneOuterGain',
		],
		isObject3D: true,
	},
	AudioListener: {
		properties: ['context', 'gain', 'filter', 'timeDelta', 'rotation', 'position'],
		isObject3D: true,
	},
	VideoTexture: {
		properties: ['video', 'needsUpdate'],
	},
};
