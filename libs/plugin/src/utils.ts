import { logger, updateJson, writeJson, type Tree } from '@nx/devkit';

/**
 * Adds a metadata JSON file path to VSCode's html.customData settings.
 * This enables TypeScript type definitions and IntelliSense for Angular Three elements in templates.
 *
 * @param tree - The Nx virtual file system tree
 * @param metadataJsonPath - Path to the metadata JSON file (e.g., 'angular-three/metadata.json')
 */
export function addMetadataJson(tree: Tree, metadataJsonPath: string) {
	if (!metadataJsonPath.includes('node_modules')) {
		metadataJsonPath = `./node_modules/${metadataJsonPath}`;
	}

	// add metadata.json to vscode settings if exists
	const vscodeSettingsPath = '.vscode/settings.json';

	if (!tree.exists('.vscode')) {
		return logger.info(
			`[NGT] .vscode directory not found.
If you are using VSCode, add "${metadataJsonPath}" to "html.customData" in ".vscode/settings.json"
to enable TypeScript type definitions for Angular Three elements.
`,
		);
	}

	logger.info('[NGT] Enabling typings support for VSCode...');

	if (!tree.exists(vscodeSettingsPath)) {
		writeJson(tree, vscodeSettingsPath, {});
	}

	updateJson(tree, vscodeSettingsPath, (json) => {
		if (
			json['html.customData'] &&
			Array.isArray(json['html.customData']) &&
			!json['html.customData'].includes(metadataJsonPath)
		) {
			json['html.customData'].push(metadataJsonPath);
		} else {
			json['html.customData'] = [metadataJsonPath];
		}

		return json;
	});
}
