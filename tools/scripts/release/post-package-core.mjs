/**
 * This script is run after `nx package core` is executed
 * to remove the `.npmignore` file from the `core` package as we want to publish `plugin` package.json
 **/
import { existsSync, unlinkSync } from 'node:fs';

const coreDistPath = './dist/libs/core';
const npmIgnorePath = `${coreDistPath}/.npmignore`;

if (existsSync(npmIgnorePath)) {
	console.log('Removing .npmignore from core package');
	unlinkSync(npmIgnorePath);
}
