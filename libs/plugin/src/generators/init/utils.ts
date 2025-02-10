import { formatFiles, installPackagesTask, logger, Tree } from '@nx/devkit';
import { Node, ObjectLiteralExpression, PropertyAssignment, SourceFile, SyntaxKind } from 'ts-morph';

export async function stopSetup(tree: Tree, message: string) {
	logger.info(`[NGT] ${message}. Stopping setup`);
	return await finishSetup(tree);
}

export async function finishSetup(tree: Tree) {
	await formatFiles(tree);
	return () => {
		installPackagesTask(tree);
	};
}

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
