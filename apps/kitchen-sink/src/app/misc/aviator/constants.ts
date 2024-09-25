export const INITIAL_SPEED = 0.00035;
export const INCREMENT_SPEED_BY_TIME = 0.0000025;
export const INCREMENT_SPEED_BY_LEVEL = 0.000005;
export const DISTANCE_FOR_SPEED_UPDATE = 100;
export const RATIO_SPEED_DISTANCE = 50;

export const SIMPLE_GUN_LEVEL_DROP = 1.1;
export const DOUBLE_GUN_LEVEL_DROP = 2.3;
export const BETTER_GUN_LEVEL_DROP = 3.5;

export const MAX_LIFES = 3;
export const PAUSE_LIFE_SPAWN = 400;

export const LEVEL_COUNT = 6;
export const DISTANCE_FOR_LEVEL_UPDATE = 500;

export const PLANE_DEFAULT_HEIGHT = 100;
export const PLANE_AMP_HEIGHT = 80;
export const PLANE_AMP_WIDTH = 75;
export const PLANE_MOVE_SENSITIVITY = 0.005;
export const PLANE_ROT_X_SENSITIVITY = 0.0008;
export const PLANE_ROT_Z_SENSITIVITY = 0.0004;
export const PLANE_MIN_SPEED = 1.2;
export const PLANE_MAX_SPEED = 1.6;

export const SEA_RADIUS = 600;
export const SEA_LENGTH = 800;
export const WAVES_MIN_AMP = 5;
export const WAVES_MAX_AMP = 20;
export const WAVES_MIN_SPEED = 0.001;
export const WAVES_MAX_SPEED = 0.003;

export const CAMERA_SENSITIVITY = 0.002;

export const COIN_DISTANCE_TOLERANCE = 15;
export const POWER_UP_DISTANCE_TOLERANCE = 15;
export const COINS_SPEED = 0.5;
export const DISTANCE_FOR_COINS_SPAWN = 50;

export const COLLECTIBLE_DISTANCE_TOLERANCE = 15;
export const COLLECTIBLES_SPEED = 0.6;

export const SPAWNABLES_SPEED = 0.6;

export const ENEMY_DISTANCE_TOLERANCE = 10;
export const ENEMIES_SPEED = 0.6;
export const DISTANCE_FOR_ENEMIES_SPAWN = 50;

export const ATTRACTION_FACTOR = 0.75;

export const COLORS = {
	red: 0xf25346,
	orange: 0xffa500,
	white: 0xd8d0d1,
	brown: 0x59332e,
	brownDark: 0x23190f,
	pink: 0xf5986e,
	yellow: 0xf4ce93,
	blue: 0x68c3c0,
};

export const COLOR_SEA_LEVEL = [
	0x68c3c0, // hsl(178deg 43% 59%)
	0x47b3af, // hsl(178deg 43% 49%)
	0x398e8b, // hsl(178deg 43% 39%)
	0x2a6a68, // hsl(178deg 43% 29%)
	0x1c4544, // hsl(178deg 43% 19%)
	0x0d2120, // hsl(178deg 43% 09%)
];

export const COLOR_COINS = 0xffd700; // 0x009999
export const COLOR_POWER_UPS = 0x8f9992;
export const COLOR_COLLECTIBLE_BUBBLE = COLOR_COINS;
