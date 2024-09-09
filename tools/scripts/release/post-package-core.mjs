/**
 * This script is run after `nx package core` is executed
 * to remove the `.npmignore` file from the `core` package as we want to publish `plugin` package.json
 **/
import { execSync } from 'node:child_process';
import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';

const distPath = './dist/libs';
const coreDistPath = `${distPath}/core`;
const npmIgnorePath = `${coreDistPath}/.npmignore`;

if (existsSync(npmIgnorePath)) {
	console.log('Removing .npmignore from core package');
	unlinkSync(npmIgnorePath);
}

// update package.json for all libs

try {
	// read latest version of angular-three from npm
	const latestNpmVersion = execSync('npm view angular-three version').toString().trim();

	// read latest version from git tag first
	const latestTag = execSync('git describe --tags --abbrev=0').toString().trim();

	// increment latestNpmVersion if latestTag equals latestNpmVersion (e.g. beta.288 becomes beta.289)
	let latestVersion = undefined;

	if (latestTag !== latestNpmVersion) {
		latestVersion = latestTag;
	} else {
		const split = latestNpmVersion.split('.');
		const version = parseInt(split.pop()) + 1;
		latestVersion = split.join('.') + '.' + version;
	}

	const libs = ['cannon', 'postprocessing', 'soba', 'core'];

	libs.forEach((lib) => {
		const libDistPath = `${distPath}/${lib}`;
		const packageJsonPath = `${libDistPath}/package.json`;

		if (existsSync(packageJsonPath)) {
			const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
			packageJson.version = latestVersion;
			writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
			console.log(`Updated ${lib} package.json version to ${latestVersion}`);
		}
	});
} catch (e) {
	console.log('Error while getting latest version from npm or git tag');
}
