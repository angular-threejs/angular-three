export type FlightCityVector3 = [number, number, number];

export interface FlightCityInstance {
	id: string;
	position: FlightCityVector3;
	scale: FlightCityVector3;
	color?: string;
	rotation?: FlightCityVector3;
}

export interface FlightCityData {
	buildings: FlightCityInstance[];
	districts: Array<{ id: string; buildings: FlightCityInstance[] }>;
	lampHeads: FlightCityInstance[];
	lampPoles: FlightCityInstance[];
	laneMarkings: FlightCityInstance[];
	rooftops: FlightCityInstance[];
	sidewalks: FlightCityInstance[];
	windowsCool: FlightCityInstance[];
	windowsWarm: FlightCityInstance[];
}

const BLOCK_CENTERS = [-72, -48, -24, 24, 48, 72];
const BUILDING_COLORS = ['#263548', '#334155', '#3f4654', '#2f4057'];
const LOT_OFFSETS: Array<[number, number]> = [
	[-4.6, -4.6],
	[4.6, 4.6],
	[-4.6, 4.6],
	[4.6, -4.6],
];

function createRandom(seed: number) {
	let value = seed >>> 0;
	return () => {
		value += 0x6d2b79f5;
		let result = value;
		result = Math.imul(result ^ (result >>> 15), result | 1);
		result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
		return ((result ^ (result >>> 14)) >>> 0) / 4_294_967_296;
	};
}

function randomBetween(random: () => number, min: number, max: number) {
	return min + (max - min) * random();
}

function districtIndex(x: number, z: number) {
	return (x >= 0 ? 1 : 0) + (z >= 0 ? 2 : 0);
}

function addWindowBands(
	building: FlightCityInstance,
	buildingIndex: number,
	warm: FlightCityInstance[],
	cool: FlightCityInstance[],
) {
	const [width, height, depth] = building.scale;
	const [x, , z] = building.position;
	const bands = Math.max(2, Math.min(4, Math.floor(height / 9)));
	const target = buildingIndex % 3 === 0 ? warm : cool;

	for (let band = 1; band <= bands; band++) {
		const y = 0.25 + (height * band) / (bands + 1);
		const bandHeight = band % 2 === 0 ? 0.34 : 0.5;
		target.push(
			{
				id: `${building.id}-window-${band}-north`,
				position: [x, y, z - depth / 2 - 0.07],
				scale: [width * 0.72, bandHeight, 0.1],
			},
			{
				id: `${building.id}-window-${band}-south`,
				position: [x, y, z + depth / 2 + 0.07],
				scale: [width * 0.72, bandHeight, 0.1],
			},
			{
				id: `${building.id}-window-${band}-west`,
				position: [x - width / 2 - 0.07, y, z],
				scale: [0.1, bandHeight, depth * 0.72],
			},
			{
				id: `${building.id}-window-${band}-east`,
				position: [x + width / 2 + 0.07, y, z],
				scale: [0.1, bandHeight, depth * 0.72],
			},
		);
	}
}

export function createFlightCity(seed = 0x3ec7_1205): FlightCityData {
	const random = createRandom(seed);
	const buildings: FlightCityInstance[] = [];
	const districts = Array.from({ length: 4 }, (_, index) => ({
		id: `district-${index}`,
		buildings: [] as FlightCityInstance[],
	}));
	const sidewalks: FlightCityInstance[] = [];
	const rooftops: FlightCityInstance[] = [];
	const windowsWarm: FlightCityInstance[] = [];
	const windowsCool: FlightCityInstance[] = [];
	const laneMarkings: FlightCityInstance[] = [];
	const lampPoles: FlightCityInstance[] = [];
	const lampHeads: FlightCityInstance[] = [];

	for (const blockX of BLOCK_CENTERS) {
		for (const blockZ of BLOCK_CENTERS) {
			const blockId = `${blockX}-${blockZ}`;
			sidewalks.push({
				id: `sidewalk-${blockId}`,
				position: [blockX, 0.125, blockZ],
				scale: [18, 0.25, 18],
			});

			if (blockX === 48 && blockZ === 48) continue;

			for (let lotIndex = 0; lotIndex < LOT_OFFSETS.length; lotIndex++) {
				if (lotIndex > 1 && random() > 0.48) continue;
				const [lotX, lotZ] = LOT_OFFSETS[lotIndex];
				const width = randomBetween(random, 5.6, 8.1);
				const depth = randomBetween(random, 5.6, 8.1);
				const height = randomBetween(random, 10, 46) * (blockZ < -48 ? 0.82 : 1);
				const building: FlightCityInstance = {
					id: `building-${blockId}-${lotIndex}`,
					position: [blockX + lotX, 0.25 + height / 2, blockZ + lotZ],
					scale: [width, height, depth],
					color: BUILDING_COLORS[Math.floor(random() * BUILDING_COLORS.length)],
				};

				buildings.push(building);
				districts[districtIndex(blockX, blockZ)].buildings.push(building);
				addWindowBands(building, buildings.length, windowsWarm, windowsCool);

				if (random() > 0.36) {
					const roofHeight = randomBetween(random, 0.7, 1.8);
					rooftops.push({
						id: `rooftop-${blockId}-${lotIndex}`,
						position: [
							building.position[0] + randomBetween(random, -width * 0.18, width * 0.18),
							0.25 + height + roofHeight / 2,
							building.position[2] + randomBetween(random, -depth * 0.18, depth * 0.18),
						],
						scale: [width * 0.34, roofHeight, depth * 0.34],
						color: '#172033',
					});
				}
			}
		}
	}

	for (let value = -92; value <= 92; value += 8) {
		for (const offset of [-4, 4]) {
			laneMarkings.push(
				{
					id: `lane-z-${value}-${offset}`,
					position: [offset, 0.035, value],
					scale: [0.18, 0.04, 3.2],
				},
				{
					id: `lane-x-${value}-${offset}`,
					position: [value, 0.035, offset],
					scale: [3.2, 0.04, 0.18],
				},
			);
		}
	}

	for (let z = -88; z <= 88; z += 16) {
		for (const x of [-10.5, 10.5]) {
			lampPoles.push({
				id: `lamp-pole-${x}-${z}`,
				position: [x, 2.25, z],
				scale: [0.12, 4.5, 0.12],
			});
			lampHeads.push({
				id: `lamp-head-${x}-${z}`,
				position: [x, 4.55, z],
				scale: [0.42, 0.22, 0.42],
			});
		}
	}

	return {
		buildings,
		districts,
		lampHeads,
		lampPoles,
		laneMarkings,
		rooftops,
		sidewalks,
		windowsCool,
		windowsWarm,
	};
}
