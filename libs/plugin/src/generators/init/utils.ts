import { formatFiles, installPackagesTask, logger, Tree } from '@nx/devkit';
import { Node, ObjectLiteralExpression, PropertyAssignment, SourceFile, SyntaxKind } from 'ts-morph';

/**
 * Logs an error message and gracefully stops the setup process.
 *
 * @param tree - The Nx virtual file system tree
 * @param message - Error message to display
 * @returns A function that triggers package installation
 */
export async function stopSetup(tree: Tree, message: string) {
	logger.info(`[NGT] ${message}. Stopping setup`);
	return await finishSetup(tree);
}

/**
 * Completes the setup process by formatting files and returning a package installation task.
 *
 * @param tree - The Nx virtual file system tree
 * @returns A function that triggers package installation
 */
export async function finishSetup(tree: Tree) {
	await formatFiles(tree);
	return () => {
		installPackagesTask(tree);
	};
}

/**
 * Modifies the application config to add provideNgtRenderer() to the providers array.
 * Handles both inline config objects and external app.config.ts files.
 *
 * @param tree - The Nx virtual file system tree
 * @param config - The ObjectLiteralExpression representing the app config
 * @param sf - The ts-morph SourceFile containing the config
 * @returns A save promise, or a function to stop setup if providers array is invalid
 */
export async function handleAppConfig(tree: Tree, config: ObjectLiteralExpression, sf: SourceFile) {
	// add angular-three/dom import
	sf.addImportDeclaration({ moduleSpecifier: 'angular-three/dom', namedImports: ['provideNgtRenderer'] });

	const providersProperty = config.getProperty((property): property is PropertyAssignment => {
		return Node.isPropertyAssignment(property) && property.getName() === 'providers';
	});

	if (!providersProperty) {
		config.addPropertyAssignment({
			name: 'providers',
			initializer: `[provideNgtRenderer()]`,
		});
		return await sf.save();
	}

	const providersArray = (providersProperty as PropertyAssignment).getInitializerIfKind(
		SyntaxKind.ArrayLiteralExpression,
	);
	if (!providersArray) {
		return async () => await stopSetup(tree, `Could not locate providers array`);
	}

	providersArray.addElement('provideNgtRenderer()');
	return await sf.save();
}
