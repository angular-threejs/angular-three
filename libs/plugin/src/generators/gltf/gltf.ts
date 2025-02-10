import { Tree } from '@nx/devkit';

export interface GltfGeneratorSchema {}

export async function gltfGenerator(tree: Tree, options: GltfGeneratorSchema) {
	const test = await import('@rosskevin/gltfjsx');
	console.log(test);
	// await formatFiles(tree);
}

export default gltfGenerator;
