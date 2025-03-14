import { Tree } from '@nx/devkit';
import migrateTweakpane from '../../generators/migrate-tweakpane/migrate-tweakpane';

export default async function update(host: Tree) {
	await migrateTweakpane(host, {});
}
