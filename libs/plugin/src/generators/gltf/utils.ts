import { DRACOLoader, GLTFLoader } from 'node-three-gltf';
import { readFileSync } from 'node:fs';
import { MeshoptDecoder } from 'three-stdlib';

function toArrayBuffer(buf: Buffer) {
	const ab = new ArrayBuffer(buf.length);
	const view = new Uint8Array(ab);
	for (let i = 0; i < buf.length; ++i) view[i] = buf[i];
	return ab;
}

let dracoLoader: DRACOLoader | null = null;
let decoderPath = 'https://www.gstatic.com/draco/versioned/decoders/1.5.5/';

const loader = new GLTFLoader();

export function parse(input: string, draco: boolean | string, meshopt: boolean) {
	if (draco) {
		if (!dracoLoader) {
			dracoLoader = new DRACOLoader();
		}

		dracoLoader.decoderPath = typeof draco === 'string' ? draco : decoderPath;
		(loader as GLTFLoader).setDRACOLoader(dracoLoader);
	}

	if (meshopt) {
		(loader as GLTFLoader).setMeshoptDecoder(typeof MeshoptDecoder === 'function' ? MeshoptDecoder() : MeshoptDecoder);
	}

	const data = input.startsWith('http')
		? null
		: (() => {
				const fileContent = readFileSync(input);
				return toArrayBuffer(fileContent);
			})();

	const operation = (onLoad: (data: any) => void, onError: (error: ErrorEvent) => void) => {
		return input.startsWith('http')
			? loader.load.call(loader, input, onLoad, () => {}, onError)
			: loader.parse.call(loader, data, input, onLoad, onError);
	};

	return new Promise((resolve, reject) => {
		operation(resolve, reject);
	});
}
