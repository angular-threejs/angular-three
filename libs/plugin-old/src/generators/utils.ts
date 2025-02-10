import { logger, updateJson, writeJson, type Tree } from '@nx/devkit';

export function addMetadataJson(tree: Tree, metadataJsonPath: string) {
	if (!metadataJsonPath.includes('node_modules')) {
		metadataJsonPath = `./node_modules/${metadataJsonPath}`;
	}

	// add metadata.json to vscode settings if exists
	const vscodeSettingsPath = '.vscode/settings.json';
	if (tree.exists('.vscode')) {
		logger.info('Enabling typings support for VSCode...');
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
	} else {
		logger.info(
			`.vscode/settings.json not found.
If you are using VSCode, add "${metadataJsonPath}" to "html.customData" in ".vscode/settings.json"
to enable TypeScript type definitions for Angular Three elements.
`,
		);
	}
}
